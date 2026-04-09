// update-fcm-token.ts - Aggiorna utenti test con token FCM reale
// Esegui con: npx tsx update-fcm-token.ts

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

// Carica service account
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps || !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || 'social-growth-engine',
  });
}

const db = admin.firestore();

// 🔑 INSERISCI QUI IL TOKEN COPIATO DAL BROWSER
const REAL_FCM_TOKEN = process.env.FCM_TOKEN || '';

if (!REAL_FCM_TOKEN) {
  console.error('❌ Inserisci il token FCM!');
  console.error('   Esegui: $env:FCM_TOKEN="eyJhbG..." (PowerShell)');
  console.error('   Oppure: set FCM_TOKEN=eyJhbG... (CMD)');
  console.error('   Poi: npx tsx update-fcm-token.ts');
  process.exit(1);
}

async function updateTestUsersWithToken() {
  console.log('🔄 Aggiornamento utenti test con token FCM reale...\n');
  
  const testUserIds = [
    'test_user_priority1',
    'test_user_priority2',
    'test_user_priority3',
    'test_user_no_notification'
  ];
  
  for (const userId of testUserIds) {
    try {
      await db.collection('users').doc(userId).update({
        fcmToken: REAL_FCM_TOKEN,
        'notificationSettings.enabled': true,
        'notificationSettings.lastNotified': null, // Reset per test
        'notificationSettings.pwaInstallPrompted': true,
      });
      console.log(`✅ Aggiornato: ${userId}`);
    } catch (error: any) {
      console.error(`⚠️ Errore aggiornando ${userId}:`, error.message);
    }
  }
  
  console.log('\n🎉 Token FCM aggiornato per tutti gli utenti di test!');
  console.log('\n📋 Ora esegui la funzione notifiche:');
  console.log('   firebase functions:shell');
  console.log('   > sendDailyNotifications()');
}

updateTestUsersWithToken().catch(console.error);