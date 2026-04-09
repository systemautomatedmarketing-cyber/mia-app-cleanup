"use strict";
// functions/src/notifications/dailyNotification.ts
// ✅ VERSIONE CON PATTERN SICURO PER admin.firestore.Timestamp
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDailyNotifications = void 0;
//import * as functions from 'firebase-functions';
const admin = __importStar(require("firebase-admin"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
const v2_1 = require("firebase-functions/v2");
// 🔥 NON chiamare initializeApp() qui! Deve essere fatto SOLO in index.ts
// ─────────────────────────────────────────────
// 🛡️ HELPER SICURI PER FIRESTORE (CRITICO!)
// ─────────────────────────────────────────────
(0, v2_1.setGlobalOptions)({
    region: "europe-west1",
    timeoutSeconds: 540,
    memory: "512MiB",
});
// Ottieni l'istanza di Firestore in modo sicuro
function getDb() {
    if (typeof admin.firestore !== 'function') {
        throw new Error('admin.firestore non è una funzione - Firebase Admin non inizializzato');
    }
    return admin.firestore();
}
// Ottieni il costruttore Timestamp in modo sicuro
//function getTimestamp() {
// Timestamp è una proprietà statica del modulo admin.firestore, non dell'istanza
//  const Timestamp = (admin.firestore as any).Timestamp;
//  if (!Timestamp || !Timestamp.fromDate) {
//    throw new Error('admin.firestore.Timestamp non disponibile');
//  }
//  return Timestamp;
//}
// Converte qualsiasi valore data in Date JavaScript in modo sicuro
//function toDate(value: any): Date | null {
//  if (!value) return null;
//  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
//  if (value?.toDate && typeof value.toDate === 'function') return value.toDate();
//  try {
//    const d = new Date(value);
//    return isNaN(d.getTime()) ? null : d;
//  } catch { return null; }
//}
// Helper per convertire qualsiasi valore in Date JavaScript
function toDate(value) {
    if (!value)
        return null;
    if (value instanceof Date)
        return isNaN(value.getTime()) ? null : value;
    if (value?.toDate && typeof value.toDate === 'function')
        return value.toDate();
    if (typeof value === 'string' || typeof value === 'number') {
        try {
            const d = new Date(value);
            return isNaN(d.getTime()) ? null : d;
        }
        catch {
            return null;
        }
    }
    // Se è un oggetto con _seconds/_nanoseconds (Firestore Timestamp serializzato)
    if (value?._seconds && value?._nanoseconds !== undefined) {
        return new Date(value._seconds * 1000 + value._nanoseconds / 1000000);
    }
    return null;
}
function getFieldValue() {
    // FieldValue è una proprietà statica del modulo admin.firestore
    const FieldValue = admin.firestore.FieldValue;
    if (!FieldValue || !FieldValue.serverTimestamp) {
        console.warn('⚠️ FieldValue.serverTimestamp non disponibile, uso Date.now()');
        return { serverTimestamp: () => new Date() }; // Fallback sicuro
    }
    return FieldValue;
}
async function evaluateUserNotifications(userId) {
    try {
        const db = getDb();
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            console.log(`⚠️ Utente ${userId} non trovato`);
            return null;
        }
        const userData = userDoc.data();
        if (!userData?.fcmToken) {
            console.log(`⚠️ Utente ${userId} non ha fcmToken`);
            return null;
        }
        // ─────────────────────────────────────
        // Controlla se ha già ricevuto notifica oggi
        // ─────────────────────────────────────
        const lastNotified = userData.notificationSettings?.lastNotified;
        if (lastNotified) {
            const lastDate = toDate(lastNotified);
            if (lastDate) {
                const now = new Date();
                const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
                if (diffHours < 24) {
                    console.log(`⏭️ Utente ${userId} già notificato oggi`);
                    return null;
                }
            }
        }
        // ─────────────────────────────────────
        // 🎯 PRIORITÀ 1: Task rimandato da ieri
        // ─────────────────────────────────────
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        // ✅ PATTERN SICURO: usa getTimestamp() invece di admin.firestore.Timestamp
        //    const Timestamp = getTimestamp();
        //    const yesterdayTs = Timestamp.fromDate(yesterday);
        const postponedSnapshot = await db.collection('tasks')
            .where('userId', '==', userId)
            .where('status', '==', 'postponed')
            //      .where('originalDueDate', '<=', yesterdayTs)
            //      .limit(1)
            .get();
        if (!postponedSnapshot.empty) {
            const task = postponedSnapshot.docs[0].data();
            console.log(`✅ Priority 1 per ${userId}: task "${task.title}"`);
            return {
                title: '⏰ Hai un task in sospeso!',
                body: 'Hai rimandato almeno un task da ieri. Vuoi completarlo oggi?',
                icon: '/icon-192.png',
                click_action: '/dashboard?filter=postponed',
                priority: 1,
            };
        }
        // ─────────────────────────────────────
        // 🎯 PRIORITÀ 2: Giornata quasi completata
        // ─────────────────────────────────────
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        //    const todayTs = Timestamp.fromDate(today);
        //    const tomorrowTs = Timestamp.fromDate(tomorrow);
        const todayTasks = await db.collection('tasks')
            .where('userId', '==', userId)
            //      .where('dueDate', '>=', todayTs)
            //      .where('dueDate', '<', tomorrowTs)
            .get();
        if (!todayTasks.empty) {
            const tasks = todayTasks.docs.map(d => d.data());
            const completed = tasks.filter(t => t.status === 'completed').length;
            const total = tasks.length;
            if (total >= 3 && completed >= Math.ceil(total * 0.7) && completed < total) {
                console.log(`✅ Priority 2 per ${userId}: ${completed}/${total} completati`);
                return {
                    title: '🎉 Quasi fatto!',
                    body: `Hai completato ${completed}/${total} task. Mancano solo ${total - completed}!`,
                    icon: '/icon-192.png',
                    click_action: '/dashboard',
                    priority: 2,
                };
            }
        }
        // ─────────────────────────────────────
        // 🎯 PRIORITÀ 3: Utente inattivo da 24+ ore
        // ─────────────────────────────────────
        const lastActive = userData.lastActiveAt;
        if (lastActive) {
            const lastActiveDate = toDate(lastActive);
            if (lastActiveDate) {
                const hoursInactive = (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60);
                if (hoursInactive >= 24) {
                    console.log(`✅ Priority 3 per ${userId}: inattivo da ${hoursInactive.toFixed(1)}h`);
                    return {
                        title: '👋 Ci manchi!',
                        body: 'Non apri l\'app da più di 24 ore. Torna a organizzare la tua giornata!',
                        icon: '/icon-192.png',
                        click_action: '/dashboard',
                        priority: 3,
                    };
                }
            }
        }
        console.log(`⏭️ Utente ${userId}: nessuna condizione soddisfatta`);
        return null;
    }
    catch (error) {
        console.error(`❌ Errore valutazione notifiche per ${userId}:`, {
            message: error?.message,
            name: error?.name,
            stack: error?.stack?.split('\n')[0]
        });
        return null;
    }
}
async function sendNotification(userId, payload) {
    try {
        const db = getDb();
        const messaging = admin.messaging();
        const userDoc = await db.collection('users').doc(userId).get();
        const fcmToken = userDoc.data()?.fcmToken;
        if (!fcmToken)
            return false;
        console.log(`📤 Invio a ${userId}: "${payload.title}"`);
        await messaging.send({
            token: fcmToken,
            notification: {
                title: payload.title,
                body: payload.body,
                //        imageUrl: payload.icon, 
            },
            data: {
                click_action: payload.click_action || '/',
                priority: payload.priority.toString(),
                userId,
            },
            android: { priority: 'high', notification: { clickAction: payload.click_action } },
            apns: { payload: { aps: { sound: 'default' } } },
        });
        // ✅ Aggiorna lastNotified con FieldValue sicuro
        //    await db.collection('users').doc(userId).update({
        //      'notificationSettings.lastNotified': admin.firestore.FieldValue.serverTimestamp(),
        //      'notificationSettings.lastNotificationPriority': payload.priority,
        //    });
        const FieldValue = getFieldValue();
        await db.collection('users').doc(userId).update({
            'notificationSettings.lastNotified': FieldValue.serverTimestamp(),
            'notificationSettings.lastNotificationPriority': payload.priority,
        });
        console.log(`✅ Notifica inviata a ${userId}`);
        return true;
    }
    catch (error) {
        console.error(`❌ Errore invio a ${userId}:`, error?.message);
        if (error?.code === 'messaging/invalid-registration-token') {
            await getDb().collection('users').doc(userId).update({
                fcmToken: admin.firestore.FieldValue.delete(),
            });
        }
        return false;
    }
}
exports.sendDailyNotifications = (0, scheduler_1.onSchedule)({
    schedule: "0 9 * * *",
    timeZone: "Europe/Rome",
}, async () => {
    console.log("🔔 [START] Notifiche giornaliere");
    try {
        console.log("🔍 admin.apps.length:", admin.apps?.length);
        console.log("🔍 typeof admin.firestore:", typeof admin.firestore);
        //      console.log("🔍 admin.firestore.Timestamp exists:", !!(admin.firestore as any)?.Timestamp?.fromDate);
        const db = getDb();
        const usersSnapshot = await db.collection("users")
            .where("fcmToken", "!=", null)
            .where("notificationSettings.enabled", "==", true)
            .get();
        console.log(`👥 Utenti candidati: ${usersSnapshot.size}`);
        let sent = 0, skipped = 0;
        for (const doc of usersSnapshot.docs) {
            try {
                const payload = await evaluateUserNotifications(doc.id);
                if (!payload) {
                    skipped++;
                    continue;
                }
                if (await sendNotification(doc.id, payload))
                    sent++;
                else
                    skipped++;
                await new Promise(r => setTimeout(r, 100));
            }
            catch (e) {
                console.error(`❌ Errore utente ${doc.id}:`, e?.message);
                skipped++;
            }
        }
        console.log("🔔 [END]", { sent, skipped, total: usersSnapshot.size });
        //      return { sent, skipped };
        console.log("Risultato finale:", { sent, skipped });
        return;
    }
    catch (error) {
        console.error("❌ Errore critico:", error?.message);
        return;
    }
});
