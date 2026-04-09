// test-setup.ts - Script per creare utenti di test
// Esegui con: npx tsx test-setup.ts

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// 🔧 Configura con i tuoi dati Firebase (da .env)
const FIREBASE_CONFIG = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

// 🔑 Token FCM di test (usa il tuo token reale dall'app per test reali)
const TEST_FCM_TOKEN = "ci4DHs9_MGoZC9XCWizhXt:APA91bHpxIGcNviNudUxjyey5QRJacfRtPDr6zpMtKk7DuKwKs94xld2BCaW-gCkjdxgYf5pO1e6LazeA39zKOUGAWUkb5shs7FRf6K8UulLtMQ4ydMfBKI"; // ← Sostituisci con token reale

async function createTestUsers() {
  const now = Timestamp.now();
  const yesterday = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const twoDaysAgo = Timestamp.fromDate(new Date(Date.now() - 48 * 60 * 60 * 1000));

  // ─────────────────────────────────────────
  // 🎯 UTENTE 1: Priority 1 - Task rimandato
  // ─────────────────────────────────────────
  const user1Id = 'test_user_priority1';
  await setDoc(doc(db, 'users', user1Id), {
    email: 'test-priority1@example.com',
    fcmToken: TEST_FCM_TOKEN,
    notificationSettings: {
      enabled: true,
      lastNotified: null,
      pwaInstallPrompted: false,
    },
    lastActiveAt: now,
    createdAt: now,
  });

  // Task rimandato da ieri
  await addDoc(collection(db, 'tasks'), {
    userId: user1Id,
    title: 'Task rimandato da ieri',
    description: 'Questo task doveva essere fatto ieri',
    status: 'postponed',
    priority: 'high',
    dueDate: yesterday,
    originalDueDate: yesterday,
    createdAt: twoDaysAgo,
    updatedAt: yesterday,
  });

  console.log(`✅ Creato utente Priority 1: ${user1Id}`);

  // ─────────────────────────────────────────
  // 🎯 UTENTE 2: Priority 2 - Quasi completato
  // ─────────────────────────────────────────
  const user2Id = 'test_user_priority2';
  await setDoc(doc(db, 'users', user2Id), {
    email: 'test-priority2@example.com',
    fcmToken: TEST_FCM_TOKEN,
    notificationSettings: {
      enabled: true,
      lastNotified: null,
      pwaInstallPrompted: false,
    },
    lastActiveAt: now,
    createdAt: now,
  });

  const today = Timestamp.fromDate(new Date(new Date().setHours(0, 0, 0, 0)));
  const tomorrow = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));

  // 7 task oggi: 5 completati, 2 pending (= 71% completato → trigger Priority 2)
  for (let i = 1; i <= 5; i++) {
    await addDoc(collection(db, 'tasks'), {
      userId: user2Id,
      title: `Task completato #${i}`,
      status: 'completed',
      dueDate: today,
      completedAt: now,
      createdAt: today,
    });
  }
  for (let i = 6; i <= 7; i++) {
    await addDoc(collection(db, 'tasks'), {
      userId: user2Id,
      title: `Task pending #${i}`,
      status: 'pending',
      dueDate: today,
      createdAt: today,
    });
  }

  console.log(`✅ Creato utente Priority 2: ${user2Id}`);

  // ─────────────────────────────────────────
  // 🎯 UTENTE 3: Priority 3 - Inattivo 24h+
  // ─────────────────────────────────────────
  const user3Id = 'test_user_priority3';
  await setDoc(doc(db, 'users', user3Id), {
    email: 'test-priority3@example.com',
    fcmToken: TEST_FCM_TOKEN,
    notificationSettings: {
      enabled: true,
      lastNotified: null,
      pwaInstallPrompted: false,
    },
    lastActiveAt: twoDaysAgo, // ← Inattivo da 48 ore!
    createdAt: now,
  });

  console.log(`✅ Creato utente Priority 3: ${user3Id}`);

  // ─────────────────────────────────────────
  // 🎯 UTENTE 4: Nessuna notifica (controllo)
  // ─────────────────────────────────────────
  const user4Id = 'test_user_no_notification';
  await setDoc(doc(db, 'users', user4Id), {
    email: 'test-none@example.com',
    fcmToken: TEST_FCM_TOKEN,
    notificationSettings: {
      enabled: true,
      lastNotified: now, // ← Ha già ricevuto notifica oggi!
      pwaInstallPrompted: false,
    },
    lastActiveAt: now,
    createdAt: now,
  });

  console.log(`✅ Creato utente controllo (nessuna notifica): ${user4Id}`);

  console.log('\n🎉 Tutti gli utenti di test creati!');
  console.log('Ora esegui: firebase functions:shell > sendDailyNotifications()');
}

createTestUsers().catch(console.error);