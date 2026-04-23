// client/src/components/PWAInstallPrompt.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Download } from 'lucide-react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Controlla se l'app è già installata
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return; // Già installata come PWA
    }

    // Ascolta l'evento beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Controlla se abbiamo già mostrato il prompt
      const hasPrompted = localStorage.getItem('pwa_prompt_shown');
      if (!hasPrompted) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    setShowPrompt(false);
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('Utente ha accettato l\'installazione PWA');
      // Salva nel backend che l'utente ha installato la PWA
      await markPWAInstalled();
    }
    setDeferredPrompt(null);
    localStorage.setItem('pwa_prompt_shown', 'true');
  };

  const markPWAInstalled = async () => {
    // Usa la tua libreria Firebase per aggiornare il profilo utente
    try {
      const { getAuth } = await import('firebase/auth');
      const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
      
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        const db = getFirestore();
        await updateDoc(doc(db, 'users', user.uid), {
          'notificationSettings.pwaInstalled': true,
          'notificationSettings.pwaInstallPrompted': true,
        });
      }
    } catch (error) {
      console.error('Errore aggiornamento PWA status:', error);
    }
  };

  if (!showPrompt) return null;

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-lg border-primary/20">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Download className="h-5 w-5" />
          Installa l'App
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={() => setShowPrompt(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Installa Social Growth Engine sul tuo dispositivo per ricevere notifiche sui tuoi task!
        </p>
        <Button onClick={handleInstall} className="w-full">
          Installa Ora
        </Button>
      </CardContent>
    </Card>
  );
}