// export const API_BASE = "https://wsams-api.systemautomatedmarketing.workers.dev";
export const API_BASE = import.meta.env.VITE_API_BASE || "https://wsams-api.systemautomatedmarketing.workers.dev";

// 🔔 Configurazione Firebase per notifiche
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // 🔑 VAPID Key per Web Push (generata nella console Firebase)
  vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
};