/* client/src/lib/push.ts */

import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db, app } from "@/lib/firebase";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

if (!vapidKey) {
  console.warn("⚠️ VITE_FIREBASE_VAPID_KEY non configurata in .env.production");
}

//const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export async function enablePushNotifications() {
  const supported = await isSupported();
  if (!supported) {
    throw new Error("Questo browser non supporta le notifiche push FCM.");
  }

  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Utente non loggato.");
  }

try {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permesso notifiche non concesso.");
  }

//  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

  const messaging = getMessaging(app);

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: await navigator.serviceWorker.ready, //registration,
  });

  if (!token) {
    throw new Error("Token notifiche non ottenuto.");
  }

//  console.log("✅ Token FCM ottenuto:", token);

//  await setDoc(
//    doc(db, "users", user.uid) , "pushTokens", token),
//    {
//      token,
//      enabled: true,
//      platform: "web",
//      createdAt: serverTimestamp(),
//      updatedAt: serverTimestamp(),
//    },
//    { merge: true }
//  );

//  await setDoc(
//    doc(db, "users", user.uid),
//    {
//      notificationsEnabled: true,
//      updatedAt: serverTimestamp(),
//    },
//    { merge: true }
//  );

//  return token;

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

    console.log("✅ Token salvato in Firestore per utente:", userId);

     onMessage(messaging, (payload) => {
      console.log("🔔 Notifica received in foreground:", payload);
      // Mostra alert o toast personalizzato
      if (payload.notification) {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: payload.notification.image || "/icon-192.png",
        });
      }
    });

    return true;

  } catch (error: any) {
    console.error("❌ Errore abilitazione notifiche:", {
      message: error.message,
      code: error.code,
    });
    throw error;
  }

}


/**
 * Verifica se le notifiche sono già abilitate per l'utente
 */
export async function areNotificationsEnabled(userId: string): Promise<boolean> {
  if (Notification.permission !== "granted") return false;
  
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (!userDoc.exists()) return false;
    
    const data = userDoc.data();
    return !!(data?.fcmToken && data?.notificationSettings?.enabled);
  } catch {
    return false;
  }
}

/**
 * Aggiorna il token FCM se è cambiato o scaduto
 */
export async function refreshFcmToken(userId: string): Promise<void> {
  try {
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
          notificationSettings: {
            lastTokenUpdate: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      console.log("✅ Token FCM aggiornato");
    }
  } catch (error) {
    console.warn("⚠️ Impossibile aggiornare token FCM:", error);
  }
}