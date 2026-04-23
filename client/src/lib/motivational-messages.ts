// client/src/lib/motivational-messages.ts
//
// ─────────────────────────────────────────────────────────────────────────────
// COME AGGIUNGERE O MODIFICARE I MESSAGGI
// ─────────────────────────────────────────────────────────────────────────────
//
// I messaggi sono organizzati in POOL tematici. Ogni pool è un array di oggetti
// { title, message } che vengono selezionati in modo deterministico in base al
// giorno dell'anno (così cambia ogni giorno senza essere casuale ad ogni render).
//
// Per aggiungere un nuovo messaggio: aggiungi un oggetto al pool più adatto.
// Per cambiare un messaggio esistente: modifica il testo direttamente.
//
// I pool disponibili sono:
//   MESSAGES_BEGINNER     → utente al giorno 1-7
//   MESSAGES_STREAK       → utente con streak attivo (giorno > 7)
//   MESSAGES_ALMOST_DONE  → ha completato >70% dei task oggi
//   MESSAGES_GOAL_*       → basati sull'obiettivo dell'onboarding
//   MESSAGES_PLATFORM_*   → basati sulla piattaforma principale
//   MESSAGES_DEFAULT      → fallback generico
//
// ─────────────────────────────────────────────────────────────────────────────

import { ProgressMetrics } from "@/hooks/use-progress-tracker";

interface MotivationalMessage {
  title: string;
  message: string;
}

// Seleziona un elemento da un array in modo deterministico (cambia ogni giorno)
function pickByDay<T>(arr: T[]): T {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  return arr[dayOfYear % arr.length];
}

// ── Pool messaggi ──────────────────────────────────────────────────────────

const MESSAGES_BEGINNER: MotivationalMessage[] = [
  { title: "Benvenuto nel percorso! 🚀", message: "Ogni grande risultato inizia da un primo passo. Sei già avanti rispetto a chi non ha ancora iniziato." },
  { title: "Giorno 1: si parte! 🌱", message: "Le abitudini si costruiscono nei primi giorni. Completa i task di oggi e metti le fondamenta per la tua crescita." },
  { title: "Il momento migliore è adesso ⚡", message: "Non aspettare la condizione perfetta. Inizia con quello che hai, dove sei, con quello che sai." },
];

const MESSAGES_STREAK: MotivationalMessage[] = [
  { title: "Sei inarrestabile! 🔥", message: "La costanza è il tuo superpotere. Chi vede i tuoi contenuti ogni giorno inizia a fidarsi di te." },
  { title: "Il momentum è dalla tua parte 📈", message: "Gli algoritmi premiano chi pubblica con regolarità. Stai costruendo qualcosa di solido." },
  { title: "Mantieni il ritmo! ⚡", message: "Ogni giorno completato aggiunge credibilità al tuo profilo. Continua così." },
  { title: "La disciplina batte il talento 💪", message: "Non chi è più bravo vince sui social, ma chi è più costante. E tu lo stai dimostrando." },
];

const MESSAGES_ALMOST_DONE: MotivationalMessage[] = [
  { title: "Quasi al traguardo! 🎯", message: "Hai fatto la parte difficile. Finisci quello che hai iniziato — l'inerzia è dalla tua parte." },
  { title: "Manca poco! 💫", message: "Chi arriva al 100% oggi costruisce l'abitudine di chi arriva al 100% domani." },
  { title: "Sprint finale! 🏁", message: "Sei già oltre la metà. Non lasciare punti sul tavolo — completa la giornata." },
];

const MESSAGES_GOAL_FOLLOWER: MotivationalMessage[] = [
  { title: "Ogni task avvicina al tuo obiettivo 🎯", message: "I follower non arrivano per caso: sono il risultato di azioni quotidiane come quelle che stai facendo." },
  { title: "Costruisci la tua audience 👥", message: "Ogni contenuto che pubblichi oggi raggiunge qualcuno che non ti conosceva ieri." },
  { title: "La crescita si accumula 📊", message: "Non giudicare i risultati di settimane di lavoro dopo un solo giorno. Guarda il trend, non il singolo dato." },
];

const MESSAGES_GOAL_LEAD: MotivationalMessage[] = [
  { title: "I lead si costruiscono con la fiducia 🤝", message: "Ogni contenuto di valore che crei oggi è un seme che potrebbe portare un cliente domani o tra 6 mesi." },
  { title: "Visibilità = opportunità 💼", message: "Più persone ti vedono, più aumentano le possibilità che qualcuno abbia bisogno esattamente di quello che offri." },
  { title: "Il contenuto lavora per te anche mentre dormi 🌙", message: "I post di oggi possono portare richieste tra settimane. Pubblica con costanza." },
];

const MESSAGES_GOAL_BRAND: MotivationalMessage[] = [
  { title: "Il brand si costruisce giorno per giorno 🏗️", message: "Le persone si fidano di chi vedono spesso e che condivide valore. Stai costruendo quella fiducia oggi." },
  { title: "Coerenza = riconoscibilità 🎨", message: "Un brand forte non si costruisce in un giorno, ma con giorni come questo." },
  { title: "Sei la tua migliore pubblicità ⭐", message: "Ogni azione che fai oggi rafforza l'immagine che le persone hanno di te." },
];

const MESSAGES_PLATFORM_INSTAGRAM: MotivationalMessage[] = [
  { title: "Instagram premia chi è presente 📸", message: "L'algoritmo favorisce gli account attivi. Ogni interazione di oggi aumenta la tua visibilità di domani." },
  { title: "I Reel stanno esplodendo 🎬", message: "I video brevi hanno il reach organico più alto di qualsiasi altro formato. Sfruttalo finché dura." },
];

const MESSAGES_PLATFORM_TIKTOK: MotivationalMessage[] = [
  { title: "Su TikTok chiunque può diventare virale 🎵", message: "L'algoritmo non guarda i follower che hai, ma quanto coinvolge il tuo contenuto. Crea con intenzione." },
  { title: "La costanza su TikTok paga doppio ⚡", message: "I creator che pubblicano ogni giorno crescono 3-5x più velocemente di chi pubblica saltuariamente." },
];

const MESSAGES_PLATFORM_LINKEDIN: MotivationalMessage[] = [
  { title: "LinkedIn è il social meno affollato di valore 💼", message: "La maggior parte delle persone consuma senza creare. Chi pubblica contenuti utili si distingue immediatamente." },
  { title: "Il tuo profilo LinkedIn lavora 24/7 🌐", message: "Ogni contenuto professionale che crei oggi può essere trovato da un potenziale cliente tra mesi." },
];

const MESSAGES_DEFAULT: MotivationalMessage[] = [
  { title: "Mantieni il ritmo! 💪", message: "La crescita sui social non è lineare, ma chi non molla vince sempre nel lungo periodo." },
  { title: "Piccoli passi, grandi risultati 🌱", message: "Non serve fare tutto in un giorno. Serve fare qualcosa ogni giorno." },
  { title: "Stai costruendo qualcosa di reale 🏗️", message: "Ogni task completato è un mattone. Non si vede subito, ma la struttura cresce." },
  { title: "La tua community ti aspetta 👋", message: "Ci sono persone là fuori che hanno bisogno di quello che solo tu puoi condividere." },
];

// ── Funzione principale ────────────────────────────────────────────────────

export function getMotivationalMessage(
  user: any,
  completedTasks: number,
  totalTasks: number,
  metrics: ProgressMetrics
): MotivationalMessage {
  const day = user?.currentDay ?? 1;
  const streak = metrics.today.streak;
  const goal = (user?.onboarding?.goal ?? "").toLowerCase();
  const platforms: string[] = user?.onboarding?.platform ?? [];
  const mainPlatform = platforms[0]?.toLowerCase() ?? "";
  const completionRatio = totalTasks > 0 ? completedTasks / totalTasks : 0;

  // Priorità decrescente

  // 1. Quasi finita la giornata
  if (completionRatio >= 0.7 && completedTasks > 0 && completedTasks < totalTasks) {
    return pickByDay(MESSAGES_ALMOST_DONE);
  }

  // 2. Primissimi giorni
  if (day <= 3) {
    return pickByDay(MESSAGES_BEGINNER);
  }

  // 3. Streak attivo
  if (streak >= 5) {
    return pickByDay(MESSAGES_STREAK);
  }

  // 4. Obiettivo specifico
  if (goal.includes("follower") || goal.includes("audience")) {
    return pickByDay(MESSAGES_GOAL_FOLLOWER);
  }
  if (goal.includes("lead")) {
    return pickByDay(MESSAGES_GOAL_LEAD);
  }
  if (goal.includes("brand")) {
    return pickByDay(MESSAGES_GOAL_BRAND);
  }

  // 5. Piattaforma principale
  if (mainPlatform.includes("instagram")) {
    return pickByDay(MESSAGES_PLATFORM_INSTAGRAM);
  }
  if (mainPlatform.includes("tiktok")) {
    return pickByDay(MESSAGES_PLATFORM_TIKTOK);
  }
  if (mainPlatform.includes("linkedin")) {
    return pickByDay(MESSAGES_PLATFORM_LINKEDIN);
  }

  // 6. Fallback
  return pickByDay(MESSAGES_DEFAULT);
}
