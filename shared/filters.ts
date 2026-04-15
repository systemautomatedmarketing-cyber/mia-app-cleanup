// shared/filters.ts

// ─────────────────────────────────────
// VALORI POSSIBILI PER OGNI CATEGORIA
// ─────────────────────────────────────

export const PLATFORMS = [
  "Instagram",
  "LinkedIn", 
  "Twitter/X",
  "TikTok",
  "Facebook",
] as const;
export type Platform = typeof PLATFORMS[number];

export const SALES_TYPES = [
  "Prodotto Digitale",
  "Coaching/Servizio",
  "Prodotto Fisico",
  "Affiliazione",
  "SaaS",
] as const;
export type SalesType = typeof SALES_TYPES[number];

export const MAIN_GOALS = [
  "Generare Lead",
  "Costruire il Brand",
  "Aumentare le Vendite",
  "Aumentare i Follower",
] as const;
export type MainGoal = typeof MAIN_GOALS[number];

export const EXPERIENCE_LEVELS = [
  "Principiante",
  "Intermedio",
  "Avanzato",
] as const;
export type ExperienceLevel = typeof EXPERIENCE_LEVELS[number];

// ─────────────────────────────────────
// STRUTTURA FILTER SETTINGS (Firestore)
// ─────────────────────────────────────

export interface FilterOption<T extends string> {
  enabled: boolean;      // Toggle on/off
  values: T[];           // Valori selezionati (se enabled)
}

export interface UserFilterSettings {
  platform: FilterOption<Platform>;
  salesType: FilterOption<SalesType>;
  mainGoal: FilterOption<MainGoal>;
  experienceLevel: FilterOption<ExperienceLevel>;
}

// Valori di default (tutti disabilitati tranne experienceLevel per il primo rollout)
export const DEFAULT_FILTER_SETTINGS: UserFilterSettings = {
  platform: { enabled: false, values: [] },
  salesType: { enabled: false, values: [] },
  mainGoal: { enabled: false, values: [] },
  experienceLevel: { enabled: true, values: [] }, // ← Attivato per primo rollout
};