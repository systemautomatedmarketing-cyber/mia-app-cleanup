# scripts/test-utils.ps1 - Funzioni utility per i test

param(
    [Parameter(Mandatory=$true)]
    [string]$Action,
    
    [string]$UserId = "test_quick",
    
    [string]$FcmToken = ""
)

# $saPath = Join-Path $PSScriptRoot "..\serviceAccountKey.json"
$saPath = "./serviceAccountKey.json"

if (!(Test-Path $saPath)) {
    Write-Error "❌ serviceAccountKey.json non trovato"
    exit 1
}

$script = @"
const admin = require('firebase-admin');
const fs = require('fs');
const sa = JSON.parse(fs.readFileSync('$saPath', 'utf8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: 'social-growth-engine' });
const db = admin.firestore();
const userId = '$UserId';
const token = '$FcmToken';

async function run() {
  const action = '$Action';
  
  if (action === 'reset') {
    // Resetta lastNotified e aggiorna token
    await db.collection('users').doc(userId).set({
      fcmToken: token || null,
      'notificationSettings.enabled': true,
      'notificationSettings.lastNotified': null,
      'notificationSettings.pwaInstallPrompted': true,
      lastActiveAt: admin.firestore.Timestamp.now(),
    }, { merge: true });
    console.log('✅ Reset completato per', userId);
    
  } else if (action === 'priority1') {
    // Crea task rimandato da ieri
    const yesterday = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 86400000));
    await db.collection('tasks').add({
      userId, title: 'Test Task Rimandato', status: 'postponed',
      dueDate: yesterday, originalDueDate: yesterday,
      createdAt: yesterday, isTestTask: true,
    });
    console.log('✅ Priority 1 ready per', userId);
    
  } else if (action === 'priority2') {
    // Crea 7 task di oggi: 5 completati + 2 pending
    const now = admin.firestore.Timestamp.now();
    const today = new Date(); today.setHours(0,0,0,0);
    const todayTs = new admin.firestore.Timestamp(Math.floor(today.getTime()/1000), 0);
    
    for(let i=1; i<=5; i++) {
      await db.collection('tasks').add({
        userId, title: 'Completato #'+i, status: 'completed',
        dueDate: todayTs, completedAt: now, createdAt: now, isTestTask: true,
      });
    }
    for(let i=6; i<=7; i++) {
      await db.collection('tasks').add({
        userId, title: 'Pending #'+i, status: 'pending',
        dueDate: todayTs, createdAt: now, isTestTask: true,
      });
    }
    console.log('✅ Priority 2 ready per', userId, '(5/7 completati)');
    
  } else if (action === 'priority3') {
    // Imposta lastActiveAt a 48 ore fa
    const twoDaysAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 48*60*60*1000));
    await db.collection('users').doc(userId).update({
      lastActiveAt: twoDaysAgo,
      'notificationSettings.lastNotified': null,
    });
    console.log('✅ Priority 3 ready per', userId, '(inattivo da 48h)');
    
  } else if (action === 'set-notified') {
    // Imposta lastNotified a ora (per test limite 1/giorno)
    await db.collection('users').doc(userId).update({
      'notificationSettings.lastNotified': admin.firestore.Timestamp.now(),
    });
    console.log('✅ lastNotified impostato per', userId);
    
  } else if (action === 'cleanup') {
    // Elimina utente e task associati
    await db.collection('users').doc(userId).delete();
    const tasks = await db.collection('tasks').where('userId', '==', userId).get();
    const batch = db.batch();
    tasks.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    console.log('🗑️ Cleanup completato per', userId);
  }
}
run().catch(e => { console.error('❌ Errore:', e.message); process.exit(1); });
"@

node -e "$script"