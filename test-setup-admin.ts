// test-setup-admin.ts - Versione compatibile con firebase-admin (CommonJS)
// Esegui con: npx tsx test-setup-admin.ts

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// 🔧 Fix per __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔧 Usa createRequire per caricare firebase-admin come CommonJS ✅
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

// 🔑 Carica le credenziali dalla service account
const possiblePaths = [
  path.join(__dirname, 'serviceAccountKey.json'),
  path.join(__dirname, '../serviceAccountKey.json'),
  path.join(process.cwd(), 'serviceAccountKey.json'),
  path.join(process.cwd(), 'functions', 'serviceAccountKey.json'),
];

const serviceAccountPath = possiblePaths.find(p => fs.existsSync(p));

if (!serviceAccountPath) {
  console.error('❌ serviceAccountKey.json non trovato!');
  possiblePaths.forEach(p => console.error('  -', p));
  process.exit(1);
}

console.log(`✅ Trovato service account: ${serviceAccountPath}`);
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// 🚀 Inizializza Firebase Admin
if (!admin.apps || !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || 'social-growth-engine',
  });
  console.log('✅ Firebase Admin inizializzato');
}

const db = admin.firestore();

// Configura emulatori se necessario
if (process.env.FIREBASE_EMULATOR_HOST) {
  db.settings({ 
    host: process.env.FIREBASE_EMULATOR_HOST, 
    ssl: false,
    projectId: process.env.FIREBASE_PROJECT_ID 
  });
  console.log(`🔌 Connesso a emulatori: ${process.env.FIREBASE_EMULATOR_HOST}`);
}

const TEST_FCM_TOKEN = process.env.TEST_FCM_TOKEN || 'test-token-placeholder';

async function createTestUsers() {
  console.log('\n🧪 Avvio creazione utenti di test...\n');
  
  const now = admin.firestore.Timestamp.now();
  const yesterday = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - 24 * 60 * 60 * 1000)
  );
  const twoDaysAgo = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - 48 * 60 * 60 * 1000)
  );
  const today = admin.firestore.Timestamp.fromDate(
    new Date(new Date().setHours(0, 0, 0, 0))
  );

  try {
    // ─────────────────────────────────────────
    // 🎯 UTENTE 1: Priority 1 - Task rimandato
    // ─────────────────────────────────────────
    const user1Id = 'test_user_priority1';
    await db.collection('users').doc(user1Id).set({
      email: 'test-priority1@example.com',
      fcmToken: TEST_FCM_TOKEN,
      notificationSettings: {
        enabled: true,
        lastNotified: null,
        pwaInstallPrompted: false,
      },
      lastActiveAt: now,
      createdAt: now,
      isTestUser: true,
    });
    console.log(`✅ Creato utente: ${user1Id}`);

    await db.collection('tasks').add({
      userId: user1Id,
      title: 'Task rimandato da ieri',
      description: 'Questo task doveva essere fatto ieri',
      status: 'postponed',
      priority: 'high',
      dueDate: yesterday,
      originalDueDate: yesterday,
      createdAt: twoDaysAgo,
      updatedAt: yesterday,
      isTestTask: true,
    });
    console.log(`✅ Creato task rimandato per ${user1Id}`);

    // ─────────────────────────────────────────
    // 🎯 UTENTE 2: Priority 2 - Quasi completato
    // ─────────────────────────────────────────
    const user2Id = 'test_user_priority2';
    await db.collection('users').doc(user2Id).set({
      email: 'test-priority2@example.com',
      fcmToken: TEST_FCM_TOKEN,
      notificationSettings: {
        enabled: true,
        lastNotified: null,
        pwaInstallPrompted: false,
      },
      lastActiveAt: now,
      createdAt: now,
      isTestUser: true,
    });
    console.log(`✅ Creato utente: ${user2Id}`);

    // 7 task: 5 completati + 2 pending = 71% → trigger Priority 2
    for (let i = 1; i <= 5; i++) {
      await db.collection('tasks').add({
        userId: user2Id,
        title: `Task completato #${i}`,
        status: 'completed',
        dueDate: today,
        completedAt: now,
        createdAt: today,
        isTestTask: true,
      });
    }
    for (let i = 6; i <= 7; i++) {
      await db.collection('tasks').add({
        userId: user2Id,
        title: `Task pending #${i}`,
        status: 'pending',
        dueDate: today,
        createdAt: today,
        isTestTask: true,
      });
    }
    console.log(`✅ Creati 7 task per ${user2Id} (5 completati, 2 pending)`);

    // ─────────────────────────────────────────
    // 🎯 UTENTE 3: Priority 3 - Inattivo 24h+
    // ─────────────────────────────────────────
    const user3Id = 'test_user_priority3';
    await db.collection('users').doc(user3Id).set({
      email: 'test-priority3@example.com',
      fcmToken: TEST_FCM_TOKEN,
      notificationSettings: {
        enabled: true,
        lastNotified: null,
        pwaInstallPrompted: false,
      },
      lastActiveAt: twoDaysAgo,
      createdAt: now,
      isTestUser: true,
    });
    console.log(`✅ Creato utente inattivo: ${user3Id}`);

    // ─────────────────────────────────────────
    // 🎯 UTENTE 4: Controllo - Già notificato oggi
    // ─────────────────────────────────────────
    const user4Id = 'test_user_no_notification';
    await db.collection('users').doc(user4Id).set({
      email: 'test-none@example.com',
      fcmToken: TEST_FCM_TOKEN,
      notificationSettings: {
        enabled: true,
        lastNotified: now,
        pwaInstallPrompted: false,
      },
      lastActiveAt: now,
      createdAt: now,
      isTestUser: true,
    });
    console.log(`✅ Creato utente controllo (già notificato): ${user4Id}`);

    console.log('\n🎉 Tutti gli utenti di test creati con successo!');
    console.log('\n📋 Ora testa la funzione notifiche:');
    console.log('   firebase functions:shell');
    console.log('   > sendDailyNotifications()');
    
    return true;
    
  } catch (error: any) {
    console.error('\n❌ Errore durante la creazione degli utenti:');
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    
    if (error.code === 'permission-denied') {
      console.error('\n💡 La service account non ha permessi Firestore Admin.');
      console.error('   Vai su IAM & Admin → IAM e assegna il ruolo "Firestore Admin"');
    } else if (error.code === 'not-found') {
      console.error('\n💡 Progetto Firestore non trovato o projectId sbagliato.');
      console.error('   Verifica che "project_id" in serviceAccountKey.json sia corretto');
    }
    
    process.exit(1);
  }
}

// Esegui
createTestUsers();