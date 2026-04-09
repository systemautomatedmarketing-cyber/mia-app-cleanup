# update-token.ps1 - Aggiorna utente test con token FCM reale
# Esegui con: .\update-token.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$FcmToken
)

# Carica dipendenze
# $saPath = Join-Path $PSScriptRoot "serviceAccountKey.json"
$saPath = "./serviceAccountKey.json"

if (!(Test-Path $saPath)) {
    Write-Error "❌ serviceAccountKey.json non trovato in: $saPath"
    exit 1
}


# Usa Node.js per eseguire lo script TypeScript
$script = @"
const admin = require('firebase-admin');
const fs = require('fs');
const sa = JSON.parse(fs.readFileSync('$saPath', 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    projectId: process.env.FIREBASE_PROJECT_ID || 'social-growth-engine',
  });
}
const db = admin.firestore();
const token = '$FcmToken';
const userId = 'test_quick';
const now = admin.firestore.Timestamp.now();
const yesterday = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 86400000));

(async () => {
  try {
    // Crea/aggiorna utente
    await db.collection('users').doc(userId).set({
      email: 'test@example.com',
      fcmToken: token,
      notificationSettings: { enabled: true, lastNotified: null },
      lastActiveAt: now,
      createdAt: now,
      isTestUser: true,
    }, { merge: true });
    
    // Crea task rimandato (triggera Priority 1)
    await db.collection('tasks').add({
      userId,
      title: 'Test Task Rimandato',
      status: 'postponed',
      dueDate: yesterday,
      originalDueDate: yesterday,
      createdAt: yesterday,
      isTestTask: true,
    });
    
    console.log('✅ Utente pronto:', userId);
    console.log('🎯 Ora esegui: firebase functions:shell > sendDailyNotifications()');
  } catch (e) {
    console.error('❌ Errore:', e.message);
    process.exit(1);
  }
})();
"@

node -e "$script"