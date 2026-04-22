// client/src/lib/notifications.ts
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { FIREBASE_CONFIG } from '../config';

// 🔔 Hook per gestire le notifiche
export class NotificationManager {
  private messaging: ReturnType<typeof getMessaging> | null = null;
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    // Verifica supporto browser
    const supported = await isSupported();
    if (!supported) {
      console.log('Notifiche non supportate in questo browser');
      return false;
    }

    // Richiedi permesso
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Permesso notifiche negato');
      return false;
    }

    // Inizializza Firebase Messaging
    this.messaging = getMessaging(undefined, FIREBASE_CONFIG);
    
    // Ottieni token FCM
    try {
      const token = await getToken(this.messaging, {
        vapidKey: FIREBASE_CONFIG.vapidKey,
        serviceWorkerRegistration: await navigator.serviceWorker.ready,
      });
      
      if (token) {
//        console.log('Token FCM ottenuto:', token);
        // Salva il token nel backend (vedi sotto)
        await this.saveTokenToBackend(token);
        this.isInitialized = true;
        return true;
      }
    } catch (error) {
      console.error('Errore durante il recupero del token:', error);
    }
    
    return false;
  }

  // Salva token in Firestore
  private async saveTokenToBackend(token: string): Promise<void> {
    // Usa la tua libreria Firebase esistente
    // Esempio con Firestore:
    try {
      const { getAuth } = await import('firebase/auth');
      const { getFirestore, doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        const db = getFirestore();
        await setDoc(doc(db, 'users', user.uid), {
          fcmToken: token,
          notificationSettings: {
            enabled: true,
            lastNotified: null,
            pwaInstallPrompted: true, // Segna che abbiamo mostrato il prompt PWA
          },
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    } catch (error) {
      console.error('Errore salvataggio token:', error);
    }
  }

  // Ascolta messaggi in foreground
  onForegroundMessage(callback: (payload: any) => void): () => void {
    if (!this.messaging) return () => {};
    
    return onMessage(this.messaging, (payload) => {
      console.log('Messaggio ricevuto in foreground:', payload);
      callback(payload);
      
      // Mostra notifica anche in foreground (opzionale)
      if (payload.notification) {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: payload.notification.icon || '/icon-192.png',
        });
      }
    });
  }

  // Controlla se l'utente ha già ricevuto una notifica oggi
  async canSendNotification(userId: string): Promise<boolean> {
    try {
      const { getFirestore, doc, getDoc } = await import('firebase/firestore');
      const db = getFirestore();
      
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return true;
      
      const data = userDoc.data();
      const lastNotified = data.notificationSettings?.lastNotified;
      
      if (!lastNotified) return true;
      
      // Controlla se è passato almeno 1 giorno
      const lastDate = new Date(lastNotified);
      const now = new Date();
      const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
      
      return diffHours >= 24;
    } catch (error) {
      console.error('Errore controllo notifica:', error);
      return true; // In caso di errore, permetti l'invio
    }
  }
}

export const notificationManager = new NotificationManager();