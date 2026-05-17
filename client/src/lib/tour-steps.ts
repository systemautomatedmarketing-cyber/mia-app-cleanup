// client/src/lib/tour-steps.ts
// Step del tour per ogni sezione — personalizzati con i dati dell'utente

import { TourStep } from "@/components/ProductTour";

interface UserContext {
  firstName?: string;
  activityType?: string;
  platform?: string[];
  goal?: string;
  targetFollowers?: number;
  currentFollowers?: number;
  targetMonths?: number;
  creditsBalance?: number;
  currentDay?: number;
  plan?: string;
}

// ── DASHBOARD ────────────────────────────────────────────────────────────────
export function getDashboardSteps(user: UserContext): TourStep[] {
  const name = user.firstName ? `, ${user.firstName}` : "";
  const platform = user.platform?.[0] ?? "i tuoi social";
  const goal = user.goal ?? "crescere";
  const target = user.targetFollowers ?? 1000;
  const months = user.targetMonths ?? 3;

  return [
    {
      id: "welcome",
      targetSelector: null,
      title: `Benvenuto${name}! 🎉`,
      content: `Il tuo percorso per ${goal.toLowerCase()} su ${platform} inizia oggi. In ${months} mesi puntiamo a ${target.toLocaleString("it-IT")} follower — e ogni giorno ti diremo esattamente cosa fare. Questo tour ti mostra come in 60 secondi.`,
      position: "center",
      color: "indigo",
    },
    {
      id: "motivation-banner",
      targetSelector: ".bg-gradient-to-r.from-indigo-600",
      title: "Il tuo messaggio del giorno",
      content: "Ogni giorno trovi un messaggio personalizzato in base al tuo progresso. Cambia quotidianamente e tiene traccia di dove sei nel percorso verso il tuo obiettivo.",
      position: "bottom",
      color: "violet",
    },
    {
      id: "header-progress",
      targetSelector: "header .flex.items-center.gap-3",
      title: "I tuoi progressi in tempo reale",
      content: `Qui vedi: l'avanzamento verso ${target.toLocaleString("it-IT")} follower, il reach stimato di oggi, i giorni consecutivi completati (streak) e i tuoi crediti AI. Si aggiornano ogni volta che completi un task.`,
      position: "bottom",
      color: "emerald",
    },
    {
      id: "task-card",
      targetSelector: ".task-card, [class*='TaskCard'], .border.rounded-2xl:first-of-type",
      title: "I task di oggi",
      content: "Ogni giorno hai 3 attività specifiche per il tuo profilo. Espandile per leggere le istruzioni dettagliate. Puoi completarle, rimandarle a domani, o sostituirle con un'alternativa.",
      position: "bottom",
      color: "indigo",
    },
    {
      id: "ai-badge",
      targetSelector: ".bg-purple-100.border-purple-200",
      title: "Task potenziati dall'AI 🤖",
      content: `I task con il badge viola generano contenuti pronti da pubblicare su ${platform}: caption, bio, DM, guide passo-passo. Cliccaci sopra per generarli con un clic. Usano crediti — ne hai ${user.creditsBalance ?? 0} disponibili.`,
      position: "bottom",
      color: "violet",
    },
    {
      id: "complete-day",
      targetSelector: "button:has(.w-6.h-6.mr-2), button[class*='emerald'], button[class*='slate-200']",
      title: "Completa la giornata",
      content: "Quando hai fatto tutti i task, il pulsante in fondo si accende verde. Cliccalo per avanzare al giorno successivo e aggiornare il tuo progresso verso l'obiettivo.",
      position: "top",
      color: "emerald",
    },
    {
      id: "notifications",
      targetSelector: null,
      title: "Notifiche giornaliere 🔔",
      content: "Ti consigliamo di attivare le notifiche: ogni mattina riceverai il task prioritario del giorno direttamente sullo smartphone, anche a schermo bloccato. Puoi farlo nelle impostazioni del telefono → Notifiche → Social Growth Engine.",
      position: "center",
      color: "amber",
    },
  ];
}

// ── CREDITI ──────────────────────────────────────────────────────────────────
export function getCreditSteps(user: UserContext): TourStep[] {
  const plan = user.plan ?? "TRIAL";
  const credits = user.creditsBalance ?? 0;

  return [
    {
      id: "credits-balance",
      targetSelector: ".from-slate-900.to-indigo-900",
      title: "Il tuo saldo crediti",
      content: `Hai ${credits} crediti disponibili. I crediti si usano per generare contenuti AI nei task della dashboard. Non scadono mai — puoi accumularli e usarli quando vuoi.`,
      position: "bottom",
      color: "indigo",
    },
    {
      id: "credits-packages",
      targetSelector: ".grid.grid-cols-2",
      title: "Pacchetti crediti",
      content: "Hai 3 opzioni: 100, 200 o 500 crediti. Ogni generazione AI costa 10 crediti. Il pacchetto da 500 è quello con il miglior costo per generazione — ideale se pubblichi ogni giorno.",
      position: "top",
      color: "violet",
    },
    {
      id: "credits-redeem",
      targetSelector: ".bg-white.rounded-2xl:last-of-type",
      title: "Hai un codice promozionale?",
      content: "Se hai ricevuto un codice (es. WELCOME-100), inseriscilo qui per ricevere crediti gratuiti immediatamente. I codici sono case-sensitive — copialo esattamente come ti è stato inviato.",
      position: "top",
      color: "amber",
    },
    ...(plan !== "PRO" ? [{
      id: "credits-pro",
      targetSelector: null,
      title: "Con PRO, AI illimitata",
      content: "Il piano PRO elimina completamente il sistema a crediti: generi contenuti AI senza limiti per ogni task. Se pubblichi ogni giorno, PRO si ripaga in meno di 2 settimane.",
      position: "center" as const,
      color: "emerald" as const,
    }] : []),
  ];
}

// ── PROFILO ──────────────────────────────────────────────────────────────────
export function getProfileSteps(user: UserContext): TourStep[] {
  const platform = user.platform?.[0] ?? "il tuo social";
  const target = user.targetFollowers ?? 1000;

  return [
    {
      id: "profile-personal",
      targetSelector: ".bg-white.rounded-2xl:first-of-type",
      title: "I tuoi dati personali",
      content: "Qui puoi aggiornare nome, cognome, nome del tuo brand e il link che usi nella bio. Queste informazioni vengono usate dall'AI per personalizzare i contenuti generati.",
      position: "bottom",
      color: "indigo",
    },
    {
      id: "profile-goal",
      targetSelector: ".bg-white.rounded-2xl:nth-child(2)",
      title: "Aggiorna il tuo obiettivo",
      content: `Stai puntando a ${target.toLocaleString("it-IT")} follower su ${platform}. Se l'obiettivo cambia, aggiornalo qui — la barra di progresso nella dashboard si ricalcola automaticamente.`,
      position: "bottom",
      color: "emerald",
    },
    {
      id: "profile-security",
      targetSelector: null,
      title: "Sicurezza dell'account",
      content: "Nella sezione Sicurezza puoi cambiare email e password. Ti verrà chiesta la password attuale per conferma — è una misura di protezione standard.",
      position: "center",
      color: "violet",
    },
    {
      id: "profile-legal",
      targetSelector: ".bg-white.rounded-2xl:last-of-type",
      title: "Note legali sempre accessibili",
      content: "Termini di Servizio e Privacy Policy sono sempre disponibili qui in basso. Puoi rileggerli in qualsiasi momento, inclusa la sezione sul consenso marketing.",
      position: "top",
      color: "amber",
    },
  ];
}
