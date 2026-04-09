// quick-test.ts - Setup minimale per test notifiche
// Esegui con: npx tsx quick-test.ts

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

// Carica service account
const saPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || 'social-growth-engine',
  });
}

const db = admin.firestore();

// 🔑 INSERISCI QUI IL TOKEN COPIATO DAL BROWSER (Passo 1)
const FCM_TOKEN = process.env.FCM_TOKEN || '';

if (!FCM_TOKEN) {
  console.error('❌ Manca FCM_TOKEN!');
  console.error('Esegui: $env:FCM_TOKEN="eyJhbG..." && npx tsx quick-test.ts');
  process.exit(1);
}

async function setupMinimalTest() {
  const userId = 'test_quick_notification';
  const now = admin.firestore.Timestamp.now();
  
  // Crea/aggiorna utente di test
  await db.collection('users').doc(userId).set({
    email: 'test-quick@example.com',
    fcmToken: FCM_TOKEN,
    notificationSettings: {
      enabled: true,
      lastNotified: null,  // ← Importante: null per ricevere notifiche
    },
    lastActiveAt: now,
    createdAt: now,
    isTestUser: true,
  }, { merge: true });
  
  // Crea UN task rimandato da ieri (triggera Priority 1)
  const yesterday = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - 24 * 60 * 60 * 1000)
  );
  
  await db.collection('tasks').add({
    userId,
    title: 'Test Task Rimandato',
    status: 'postponed',
    dueDate: yesterday,
    originalDueDate: yesterday,
    createdAt: yesterday,
    isTestTask: true,
  });
  
  console.log('✅ Utente di test pronto:', userId);
  console.log('🎯 Ora esegui: firebase functions:shell > sendDailyNotifications()');
  console.log('🔔 Tieni aperta l\'app su localhost:5173 per vedere la notifica!');
}

setupMinimalTest().catch(console.error);