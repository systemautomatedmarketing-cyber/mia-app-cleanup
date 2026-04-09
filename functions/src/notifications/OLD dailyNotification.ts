// functions/src/notifications/dailyNotification.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

//if (!admin.apps.length) {
//  admin.initializeApp();
//}

const db = admin.firestore();
const messaging = admin.messaging();

// Tipo per il payload della notifica
interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  click_action?: string;
  priority: 1 | 2 | 3;
}

// 🔍 Logica di priorità per le notifiche
async function evaluateUserNotifications(userId: string): Promise<NotificationPayload | null> {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) return null;
    const userData = userDoc.data()!;
    
    // Controlla se l'utente ha già ricevuto una notifica oggi
    const lastNotified = userData.notificationSettings?.lastNotified;
    if (lastNotified) {
      const lastDate = new Date(lastNotified);
      const now = new Date();
      const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
      
      if (diffHours < 24) {
        console.log(`Utente ${userId} ha già ricevuto notifica oggi`);
        return null;
      }
    }
    
    // Controlla se l'utente ha un token FCM valido
    if (!userData.fcmToken) {
      console.log(`Utente ${userId} non ha token FCM`);
      return null;
    }

    // 🎯 PRIORITÀ 1: Task rimandato da ieri
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const postponedTasks = await db.collection('tasks')
      .where('userId', '==', userId)
      .where('status', '==', 'postponed')
      .where('originalDueDate', '<=', admin.firestore.Timestamp.fromDate(yesterday))
      .limit(1)
      .get();
    
    if (!postponedTasks.empty) {
      return {
        title: '⏰ Hai un task in sospeso!',
        body: 'Hai rimandato almeno un task da ieri. Vuoi completarlo oggi?',
        icon: '/icon-192.png',
        click_action: '/dashboard?filter=postponed',
        priority: 1,
      };
    }

    // 🎯 PRIORITÀ 2: Giornata quasi completata
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayTasks = await db.collection('tasks')
      .where('userId', '==', userId)
      .where('dueDate', '>=', admin.firestore.Timestamp.fromDate(today))
      .where('dueDate', '<', admin.firestore.Timestamp.fromDate(tomorrow))
      .get();
    
    if (!todayTasks.empty) {
      const completed = todayTasks.docs.filter(doc => 
        doc.data().status === 'completed'
      ).length;
      const total = todayTasks.size;
      
      // "Gran parte" = almeno il 70% completato, ma non il 100%
      if (total >= 3 && completed >= Math.ceil(total * 0.7) && completed < total) {
        const remaining = total - completed;
        return {
          title: '🎉 Quasi fatto!',
          body: `Hai completato ${completed}/${total} task. Mancano solo ${remaining} per finire la giornata!`,
          icon: '/icon-192.png',
          click_action: '/dashboard',
          priority: 2,
        };
      }
    }

    // 🎯 PRIORITÀ 3: Utente inattivo da 24+ ore
    const lastActive = userData.lastActiveAt;
    if (lastActive) {
      const lastActiveDate = lastActive.toDate ? lastActive.toDate() : new Date(lastActive);
      const hoursInactive = (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursInactive >= 24) {
        return {
          title: '👋 Ci manchi!',
          body: 'Non apri l\'app da più di 24 ore. Torna a organizzare la tua giornata!',
          icon: '/icon-192.png',
          click_action: '/dashboard',
          priority: 3,
        };
      }
    }

    return null; // Nessuna condizione soddisfatta

  } catch (error) {
    console.error(`Errore valutazione notifiche per utente ${userId}:`, error);
    return null;
  }
}

// 📤 Funzione per inviare la notifica
async function sendNotification(userId: string, payload: NotificationPayload): Promise<boolean> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const fcmToken = userDoc.data()?.fcmToken;
    
    if (!fcmToken) return false;

    await messaging.send({
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.icon,
      },
      data: {
        click_action: payload.click_action || '/',
        priority: payload.priority.toString(),
      },
      android: {
        priority: 'high',
        notification: {
          clickAction: payload.click_action,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    });

    // Aggiorna lastNotified nel database
    await db.collection('users').doc(userId).update({
      'notificationSettings.lastNotified': admin.firestore.FieldValue.serverTimestamp(),
      'notificationSettings.lastNotificationPriority': payload.priority,
    });

    console.log(`Notifica inviata a utente ${userId}: ${payload.title}`);
    return true;
    
  } catch (error) {
    console.error(`Errore invio notifica a ${userId}:`, error);
    // Se il token non è più valido, rimuovilo
    if (error.code === 'messaging/invalid-registration-token') {
      await db.collection('users').doc(userId).update({
        fcmToken: admin.firestore.FieldValue.delete(),
      });
    }
    return false;
  }
}

// 🔄 Cloud Function schedulata: eseguita ogni giorno alle 9:00 UTC
export const sendDailyNotifications = functions
  .region('europe-west1') // Scegli una regione vicina ai tuoi utenti
  .runWith({
    timeoutSeconds: 540, // 9 minuti max
    memory: '512MB',
  })
  .pubsub
  .schedule('0 9 * * *') // Cron: ogni giorno alle 9:00 UTC
  .timeZone('Europe/Rome') // Fuso orario italiano
  .onRun(async () => {
    console.log('🔔 Avvio invio notifiche giornaliere...');
    
    // Recupera tutti gli utenti con token FCM e notifiche abilitate
    const usersSnapshot = await db.collection('users')
      .where('fcmToken', '!=', null)
      .where('notificationSettings.enabled', '==', true)
      .get();
    
    console.log(`Trovati ${usersSnapshot.size} utenti candidati`);
    
    let sent = 0;
    let skipped = 0;
    
    // Processa ogni utente (con delay per evitare rate limiting)
    for (const doc of usersSnapshot.docs) {
      try {
        const userId = doc.id;
        
        // Valuta quale notifica inviare (se nessuna, salta)
        const notification = await evaluateUserNotifications(userId);
        
        if (!notification) {
          skipped++;
          continue;
        }
        
        // Invia la notifica
        const success = await sendNotification(userId, notification);
        if (success) sent++;
        else skipped++;
        
        // Piccolo delay tra le richieste (opzionale, per sicurezza)
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Errore processing utente ${doc.id}:`, error);
        skipped++;
      }
    }
    
    console.log(`✅ Notifiche completate: ${sent} inviate, ${skipped} saltate`);
    return null;
  });