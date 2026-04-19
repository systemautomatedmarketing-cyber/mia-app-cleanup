// src/hooks/use-monitization-triggers.ts
import { useState, useEffect } from "react";

export function useMonetizationTriggers(user: any, completedToday: number) {
  const [showProPrompt, setShowProPrompt] = useState(false);
  
  // Leggi localStorage solo al primo mount
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem("proPromptDismissed_v1") === "true"
  );

  useEffect(() => {
    // 🔍 DEBUG: vedi esattamente perché scatta o meno
    console.log("💰 [Monetization] Check:", {
      dismissed,
      plan: user?.plan,
      completedToday,
      isEligible: !dismissed && (user?.plan === "FREE" || user?.plan === "TRIAL") && completedToday >= 3
    });

    // ✅ FIX: Accetta sia "FREE" che "TRIAL"
    if (!dismissed && (user?.plan === "FREE" || user?.plan === "TRIAL") && completedToday >= 3) {
      console.log("🔥 [Monetization] PROMPT ATTIVATO!");
      setShowProPrompt(true);
    }
  }, [completedToday, user?.plan, dismissed]);

  const dismissProPrompt = () => {
    setShowProPrompt(false);
    setDismissed(true);
    localStorage.setItem("proPromptDismissed_v1", "true");
  };

  // 🧪 Utility per test rapidi: forza la visualizzazione
  const forceShowForTesting = () => {
    localStorage.removeItem("proPromptDismissed_v1");
    setDismissed(false);
    setShowProPrompt(true);
  };

  return {
    showProPrompt,
    dismissProPrompt,
    triggerMessage: `Hai completato ${completedToday} task oggi! Vuoi accelerare la tua crescita social?`,
    forceShowForTesting
  };
}