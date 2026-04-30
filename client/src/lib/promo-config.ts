// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURAZIONE PROMOZIONI
// ─────────────────────────────────────────────────────────────────────────────
//
// Per cambiare o attivare una promozione modifica ACTIVE_PROMO qui sotto.
// Il resto dell'app (Pro.tsx, Credits.tsx) si aggiorna automaticamente.
//
// CAMPI:
//   label        → nome della promo (es. "Lancio", "Black Friday", "Estate")
//   endsAt       → data e ora di scadenza in formato ISO — usa UTC
//   discountPct  → percentuale di sconto da mostrare (solo visivo, non calcola)
//   badge        → testo del badge urgenza
//   reason       → spiegazione del perché c'è lo sconto (max 60 caratteri)
//
// Per DISATTIVARE la promo: imposta endsAt a una data nel passato,
// oppure metti active: false.
//
// ESEMPI di date:
//   "2024-12-31T23:59:00Z"  → 31 dicembre 2024 mezzanotte UTC
//   "2025-06-30T20:00:00Z"  → 30 giugno 2025 ore 22:00 italiane (UTC+2)
// ─────────────────────────────────────────────────────────────────────────────

export interface PromoConfig {
  active: boolean;
  label: string;
  endsAt: string;       // ISO date string
  discountPct: number;  // es. 40 = "40% di sconto"
  badge: string;        // es. "🔥 Prezzo di Lancio"
  reason: string;       // es. "Solo per i primi utenti"
}

// ── MODIFICA QUI PER CAMBIARE LA PROMO ──────────────────────────────────────
export const ACTIVE_PROMO: PromoConfig = {
  active: true,
  label: "Lancio",
  endsAt: "2026-07-31T21:59:00Z",   // ← Cambia questa data
  discountPct: 66,
  badge: "🔥 Prezzo di Lancio",
  reason: "Solo per i primi iscritti",
};
// ────────────────────────────────────────────────────────────────────────────

// Prezzi reali (senza sconto) — mostrati barrati durante la promo
export const FULL_PRICES = {
  pro: "€150",
  credits_100: "€30,00",
  credits_200: "€60,00",
  credits_500: "€120,00",
};

// Prezzi scontati (quelli effettivi su Stripe)
export const PROMO_PRICES = {
  pro: "€50",
  credits_100: "€10,00",
  credits_200: "€20,00",
  credits_500: "€40,00",
};

// ── Funzioni di utilità ──────────────────────────────────────────────────────

/** Restituisce true se la promo è attiva e non è scaduta */
export function isPromoActive(): boolean {
  if (!ACTIVE_PROMO.active) return false;
  return Date.now() < new Date(ACTIVE_PROMO.endsAt).getTime();
}

export interface Countdown {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Stringa formattata es. "3g 14h 22m" */
  formatted: string;
}

/** Calcola il countdown alla scadenza della promo */
export function getCountdown(): Countdown {
  const diff = new Date(ACTIVE_PROMO.endsAt).getTime() - Date.now();

  if (diff <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0, formatted: "Scaduta" };
  }

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const parts = [];
  if (days > 0)    parts.push(`${days}g`);
  if (hours > 0)   parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  if (days === 0)  parts.push(`${seconds}s`);

  return { expired: false, days, hours, minutes, seconds, formatted: parts.join(" ") };
}
