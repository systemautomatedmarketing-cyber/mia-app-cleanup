import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";


// TEMP import { useEffect } from 'react';
import { notificationManager } from './lib/notifications';

import AuthPage from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Onboarding from "@/pages/Onboarding";
import Credits from "@/pages/Credits";
import Pro from "@/pages/Pro";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";


/* Situazione Temporanea */

// client/src/App.tsx - Aggiungi questo useEffect temporaneo
import { useEffect, useState } from 'react';

function App() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Importa Firebase modules
        const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
        const { getAuth } = await import('firebase/auth');
        
        // Attendi che l'utente sia loggato (opzionale)
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const auth = getAuth();
        if (!auth.currentUser) {
          console.log('⚠️ Utente non autenticato, skip notifiche');
          return;
        }
        
        // Richiedi permesso notifiche
        const permission = await Notification.requestPermission();
        console.log('🔔 Permesso notifiche:', permission);
        
        if (permission !== 'granted') {
          console.log('❌ Permesso negato');
          return;
        }
        
        // Inizializza messaging
        const messaging = getMessaging();
        
        // Ottieni token FCM
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: await navigator.serviceWorker.ready,
        });
        
        console.log('✅ Token FCM ottenuto:', token);
        setFcmToken(token);
        
        // Salva token in Firestore (per test)
        const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
        const db = getFirestore();
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          fcmToken: token,
          'notificationSettings.enabled': true,
          'notificationSettings.pwaInstallPrompted': true,
        });
        console.log('✅ Token salvato in Firestore');
        
        // Listener per notifiche in foreground
        onMessage(messaging, (payload) => {
          console.log('🔔 Notifica received in foreground:', payload);
          alert(`🔔 ${payload.notification?.title}\n\n${payload.notification?.body}`);
        });
        
      } catch (error) {
        console.error('❌ Errore setup notifiche:', error);
      }
    };
    
    setupNotifications();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Mostra token FCM per debug */}
        {fcmToken && (
          <div style={{
            position: 'fixed',
            bottom: '10px',
            left: '10px',
            background: '#333',
            color: '#fff',
            padding: '10px',
            borderRadius: '8px',
            fontSize: '12px',
            zIndex: 9999,
            maxWidth: '400px',
          }}>
            <strong>🔑 FCM Token:</strong>
            <br />
            <code style={{ wordBreak: 'break-all' }}>{fcmToken}</code>
            <br />
            <button 
              onClick={() => navigator.clipboard.writeText(fcmToken)}
              style={{ marginTop: '5px', cursor: 'pointer' }}
            >
              📋 Copia Token
            </button>
          </div>
        )}
        
        <PWAInstallPrompt />
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

/* Fine situazione Temporanea */


function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    setLocation("/auth");
    return null;
  }

  // Redirect to onboarding if not completed
  if (!user.onboarding && window.location.pathname !== "/onboarding") {
    setLocation("/onboarding");
    return null;
  }

//  if (user.plan === "EXPIRED") {
//    setLocation("/pro");
//    return null;
//  }

 // 🔎 Controllo trial
  const plan = user.plan || "FREE";

  let isExpired = false;

  if (plan === "EXPIRED") {
    isExpired = true;
  }

  if (user.trialEndsAt) {
    const trialEndMillis =
      typeof user.trialEndsAt.toMillis === "function"
        ? user.trialEndsAt.toMillis()
        : new Date(user.trialEndsAt).getTime();

    if (Date.now() > trialEndMillis) {
      isExpired = true;
    }
  }

  if (isExpired) {
    alert("TRIAL Scaduta!\nIl tuo periodo di prova è terminato.\n\nAggiorna a PRO per continuare!");
    setLocation("/pro");
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/pro" component={Pro} />
      
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/onboarding">
        <ProtectedRoute component={Onboarding} />
      </Route>
      <Route path="/credits">
        <ProtectedRoute component={Credits} />
      </Route>
//      <Route path="/pro">
//        <ProtectedRoute component={Pro} />
//      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>

      {/* Protected Routes */}
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

/* TEMP */
// function App() {
// useEffect(() => {
    // Inizializza notifiche dopo il mount
//    const initNotifications = async () => {
      // Attendi che l'utente sia autenticato (opzionale)
//      setTimeout(async () => {
//        await notificationManager.initialize();
//      }, 3000); // Delay per non disturbare l'utente all'ingresso
//    };
    
//    initNotifications();
//  }, []);
//  return (
//    <QueryClientProvider client={queryClient}>
//      <TooltipProvider>
        {/* Aggiungi qui il prompt PWA */}
//        <PWAInstallPrompt />

//        <Router />
//        <Toaster />
//      </TooltipProvider>
//    </QueryClientProvider>
//  );
//}
/* FINE TEMP */


export default App;
