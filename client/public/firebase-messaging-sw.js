/* firebase-messaging-sw.js */
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAOuF_M0_HjkRhzaKHnlmOgHf10qBjmHvs",
  authDomain: "social-growth-engine.firebaseapp.com",
  projectId: "social-growth-engine",
  storageBucket: "social-growth-engine.firebasestorage.app",
  messagingSenderId: "885245220430",
  appId: "1:885245220430:web:e70cdd7137e2ff4a58951f",
});

const messaging = firebase.messaging();

// Notifiche in background (app chiusa o in background)
messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "Social Growth Engine";
  const clickAction = payload?.data?.click_action || "/dashboard";

  self.registration.showNotification(title, {
    body: payload?.notification?.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: "social-growth-daily",   // una sola notifica alla volta — sostituisce la precedente
    renotify: false,
    data: { url: clickAction },
  });
});

// Click sulla notifica — apre o focalizza la finestra
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(urlToOpen);
      })
  );
});

// Aggiornamento PWA — notifica all'utente quando c'è una nuova versione
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
