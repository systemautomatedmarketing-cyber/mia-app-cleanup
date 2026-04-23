/* client/src/lib/push.ts */
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db, app } from "@/lib/firebase";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string;

/**
 * Abilita le notifiche push per l'utente corrente.
 * Richiede il permesso, ottiene il token FCM e lo salva su Firestore.
 * Ritorna true se tutto è andato bene, false se l'utente ha negato.
 */
export async function enablePushNotifications(userId: string): Promise<boolean> {
  try {
    const supported = await isSupported();
    if (!supported) return false;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    await navigator.serviceWorker.ready;
    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });

    if (!token) return false;

    await setDoc(
      doc(db, "users", userId),
      {
        fcmToken: token,
        notificationSettings: {
          enabled: true,
          grantedAt: serverTimestamp(),
          lastTokenUpdate: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Ascolta messaggi in foreground e mostrali come toast nativo
    onMessage(messaging, (payload) => {
      if (payload.notification) {
        new Notification(payload.notification.title || "Social Growth", {
          body: payload.notification.body || "",
          icon: "/icons/icon-192.png",
          tag: "social-growth-daily",
        });
      }
    });

    return true;
  } catch (error: any) {
    console.error("Errore abilitazione notifiche:", error.message);
    return false;
  }
}

/**
 * Verifica se le notifiche push sono già abilitate per l'utente.
 */
export async function areNotificationsEnabled(userId: string): Promise<boolean> {
  if (Notification.permission !== "granted") return false;
  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (!snap.exists()) return false;
    const data = snap.data();
    return !!(data?.fcmToken && data?.notificationSettings?.enabled);
  } catch {
    return false;
  }
}

/**
 * Aggiorna il token FCM (da chiamare ogni 7 giorni circa).
 */
export async function refreshFcmToken(userId: string): Promise<void> {
  try {
    const supported = await isSupported();
    if (!supported) return;
    const messaging = getMessaging(app);
    const newToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });
    if (newToken) {
      await setDoc(
        doc(db, "users", userId),
        {
          fcmToken: newToken,
          "notificationSettings.lastTokenUpdate": serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (error: any) {
    console.warn("Impossibile aggiornare token FCM:", error.message);
  }
}
