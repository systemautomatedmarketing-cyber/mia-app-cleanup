// client/src/components/PWAInstallPrompt.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, RefreshCw, Share } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type PromptType = "install" | "update" | "ios" | null;

export function PWAInstallPrompt() {
  const [promptType, setPromptType] = useState<PromptType>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    // --- Notifica aggiornamento disponibile ---
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // Nuovo SW installato ma in attesa — c'è un aggiornamento
              setWaitingWorker(newWorker);
              setPromptType("update");
            }
          });
        });
      });

      // Rileva quando il SW prende il controllo (dopo skipWaiting)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }

    // --- Già installata come PWA: non mostrare nulla ---
    if (isStandalone) return;

    // --- iOS: beforeinstallprompt non esiste, mostra istruzioni manuali ---
    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window as any).MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIos && isSafari) {
      const dismissed = sessionStorage.getItem("pwa_ios_dismissed");
      if (!dismissed) {
        // Delay di 3s per non disturbare all'apertura
        const t = setTimeout(() => setPromptType("ios"), 3000);
        return () => clearTimeout(t);
      }
      return;
    }

    // --- Android/Chrome: usa beforeinstallprompt ---
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = sessionStorage.getItem("pwa_install_dismissed");
      if (!dismissed) {
        const t = setTimeout(() => setPromptType("install"), 2000);
        return () => clearTimeout(t);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      try {
        const { getAuth } = await import("firebase/auth");
        const { doc, updateDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const u = getAuth().currentUser;
        if (u) await updateDoc(doc(db, "users", u.uid), { "notificationSettings.pwaInstalled": true });
      } catch {}
    }
    setDeferredPrompt(null);
    setPromptType(null);
    sessionStorage.setItem("pwa_install_dismissed", "true");
  };

  const handleUpdate = () => {
    waitingWorker?.postMessage({ type: "SKIP_WAITING" });
    setPromptType(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(
      promptType === "ios" ? "pwa_ios_dismissed" : "pwa_install_dismissed",
      "true"
    );
    setPromptType(null);
  };

  return (
    <AnimatePresence>
      {promptType && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200 overflow-hidden">
            {/* Header colorato */}
            <div className={`px-4 py-3 flex items-center justify-between ${
              promptType === "update" ? "bg-amber-50 border-b border-amber-100" : "bg-indigo-50 border-b border-indigo-100"
            }`}>
              <div className="flex items-center gap-2">
                {promptType === "update"
                  ? <RefreshCw className="w-4 h-4 text-amber-600" />
                  : <Download className="w-4 h-4 text-indigo-600" />}
                <span className={`text-sm font-bold ${
                  promptType === "update" ? "text-amber-900" : "text-indigo-900"
                }`}>
                  {promptType === "update" ? "Aggiornamento disponibile" : "Installa l'app"}
                </span>
              </div>
              <button onClick={handleDismiss} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              {promptType === "update" && (
                <>
                  <p className="text-sm text-slate-600 mb-3">
                    È disponibile una nuova versione di Social Growth Engine con miglioramenti e correzioni.
                  </p>
                  <Button onClick={handleUpdate} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Aggiorna ora
                  </Button>
                </>
              )}

              {promptType === "install" && (
                <>
                  <p className="text-sm text-slate-600 mb-3">
                    Installa l'app per accedere più velocemente e ricevere notifiche sui tuoi task giornalieri.
                  </p>
                  <Button onClick={handleInstall} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Installa ora
                  </Button>
                </>
              )}

              {promptType === "ios" && (
                <>
                  <p className="text-sm text-slate-600 mb-3">
                    Per installare l'app su iPhone:
                  </p>
                  <ol className="text-sm text-slate-700 space-y-2 mb-3">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">1</span>
                      <span>Tocca <Share className="w-3.5 h-3.5 inline text-indigo-600" /> <strong>Condividi</strong> nella barra Safari</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">2</span>
                      <span>Scorri e tocca <strong>"Aggiungi a schermata Home"</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">3</span>
                      <span>Tocca <strong>"Aggiungi"</strong> in alto a destra</span>
                    </li>
                  </ol>
                  <Button onClick={handleDismiss} variant="outline" className="w-full">
                    Capito
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
