// src/lib/taskFilters.ts
import { UserFilterSettings } from "@shared/filters";
import { Task } from "@shared/schema";

// ─────────────────────────────────────
// 🔄 MAPPING: Valori Foglio → Valori Codice
// ─────────────────────────────────────

const EXPERIENCE_MAP: Record<string, string> = {
  "BEGINNER": "Principiante",
  "INTERMEDIATE": "Intermedio",
  "ADVANCED": "Avanzato",
  "EXPERT": "Avanzato", // EXPERT → Avanzato (fallback)
  // Fallback: se già nel formato corretto
  "Principiante": "Principiante",
  "Intermedio": "Intermedio",
  "Avanzato": "Avanzato",
};

const PLATFORM_MAP: Record<string, string> = {
  "ALL": "ALL",
  "Instagram": "Instagram",
  "Facebook": "Facebook", 
  "TikTok": "TikTok",
  "LinkedIn": "LinkedIn",
  "Twitter/X": "Twitter/X",
};

const SALES_TYPE_MAP: Record<string, string> = {
  "ALL": "ALL",
  "Digitale": "Prodotto Digitale",
  "Fisico": "Prodotto Fisico",
  "Affiliazione": "Affiliazione",
  "SaaS": "SaaS",
  "Coaching/Servizio": "Coaching/Servizio",
  // Fallback
  "Prodotto Digitale": "Prodotto Digitale",
  "Prodotto Fisico": "Prodotto Fisico",
};

const GOAL_MAP: Record<string, string> = {
  "ALL": "ALL",
  "DM": "Generare Lead",
  "BRAND": "Costruire il Brand",
  "SALES": "Aumentare le Vendite",
  "FOLLOWER": "Aumentare i Follower",
  // Fallback
  "Generare Lead": "Generare Lead",
  "Costruire il Brand": "Costruire il Brand",
  "Aumentare le Vendite": "Aumentare le Vendite",
  "Aumentare i Follower": "Aumentare i Follower",
};

// Helper per normalizzare un valore tramite mapping
function normalizeValue(value: string | undefined, map: Record<string, string>): string | undefined {
  if (!value) return undefined;
  return map[value] || value; // Fallback: se non in mappa, usa il valore originale
}

// Helper per normalizzare un array di valori
function normalizeValues(values: string[] | undefined, map: Record<string, string>): string[] {
  if (!values) return [];
  return values.map(v => normalizeValue(v, map)).filter(Boolean) as string[];
}

/**
 * Filtra un array di task in base alle impostazioni filtro dell'utente
 * - Applica solo i filtri con enabled: true
 * - Se values è vuoto, non filtra (mostra tutti)
 * - Gestisce automaticamente il mapping foglio → codice
 */
export function filterTasks(tasks: Task[], filterSettings?: UserFilterSettings, userProfile?: Partial<Task>): Task[] {
  if (!filterSettings) return tasks;
  
  return tasks.filter((task) => {
    // ─────────────────────────────────────
    // FILTRO 1: Livello Esperienza (ATTIVO ORA)
    // ─────────────────────────────────────
    if (filterSettings.experienceLevel?.enabled && filterSettings.experienceLevel.values.length > 0) {
      // Normalizza il valore del task dal foglio al formato codice
      const taskLevel = normalizeValue(task.level, EXPERIENCE_MAP);
      
      // ✅ WILDCARD: se il task è "ALL", includilo sempre
      if (taskLevel === "ALL") return true;

      // Se task non ha level, lo includiamo sempre (fallback sicuro)
      if (!taskLevel) return true;
      
      // Match: taskLevel normalizzato deve essere IN values selezionati (già nel formato codice)
      if (!filterSettings.experienceLevel.values.includes(taskLevel)) {
        return false;
      }
    }
    
    // ─────────────────────────────────────
    // FILTRO 2: Piattaforma (PRONTO, DISABILITATO)
    // ─────────────────────────────────────
    if (filterSettings.platform?.enabled && filterSettings.platform.values.length > 0) {
      const taskPlatforms = Array.isArray(task.platform) ? task.platform : [task.platform];
      const normalizedPlatforms = normalizeValues(taskPlatforms as string[], PLATFORM_MAP);

      // ✅ WILDCARD: se il task include "ALL", includilo sempre
      if (normalizedPlatforms.includes("ALL")) return true;

      const hasMatch = normalizedPlatforms.some((p: string) => 
        filterSettings.platform!.values.includes(p)
      );
      if (!hasMatch) return false;
    }
    
    // ─────────────────────────────────────
    // FILTRO 3: Tipologia Vendita (PRONTO, DISABILITATO)
    // ─────────────────────────────────────
    if (filterSettings.salesType?.enabled && filterSettings.salesType.values.length > 0) {
      const taskTypes = Array.isArray(task.product_type) ? task.product_type : [task.product_type];
      const normalizedTypes = normalizeValues(taskTypes as string[], SALES_TYPE_MAP);

      // ✅ WILDCARD: se il task include "ALL", includilo sempre
      if (normalizedTypes.includes("ALL")) return true;      

      const hasMatch = normalizedTypes.some((t: string) => 
        filterSettings.salesType!.values.includes(t)
      );
      if (!hasMatch) return false;
    }
    
    // ─────────────────────────────────────
    // FILTRO 4: Obiettivo Principale (PRONTO, DISABILITATO)
    // ─────────────────────────────────────
    if (filterSettings.mainGoal?.enabled && filterSettings.mainGoal.values.length > 0) {
      const taskGoal = normalizeValue(task.goal, GOAL_MAP);

      // ✅ WILDCARD: se il task è "ALL", includilo sempre
      if (taskGoal === "ALL") return true;
      
      if (!taskGoal) return true; // Fallback: se nessun goal, includi
      if (!filterSettings.mainGoal.values.includes(taskGoal)) {
        return false;
      }
    }
    
    // ✅ Task passato tutti i filtri attivi
    return true;
  });
}

/**
 * Helper: Verifica se un task matcha un singolo filtro (utile per UI)
 */
export function taskMatchesFilter(task: Task, filterKey: keyof UserFilterSettings, selectedValues: string[]): boolean {
  if (selectedValues.length === 0) return true; // Nessun valore = mostra tutto
  
  let taskValue: string | string[] | undefined;
  
  // Mappa filterKey al campo corretto nel task (nomi foglio)
  const fieldMap: Record<string, keyof Task> = {
    experienceLevel: 'level',
    platform: 'platform',
    salesType: 'product_type',
    mainGoal: 'goal',
  };
  
  const fieldName = fieldMap[filterKey];
  if (!fieldName) return true;
  
  taskValue = task[fieldName];
  
  // Normalizza in base al tipo di filtro
  const map: Record<string, Record<string, string>> = {
    experienceLevel: EXPERIENCE_MAP,
    platform: PLATFORM_MAP,
    salesType: SALES_TYPE_MAP,
    mainGoal: GOAL_MAP,
  };
  
  const normalizer = map[filterKey];
  if (!normalizer) return true;
  
  if (Array.isArray(taskValue)) {
    const normalized = normalizeValues(taskValue as string[], normalizer);
    return normalized.some((v: string) => selectedValues.includes(v));
  }
  
  const normalized = normalizeValue(taskValue as string, normalizer);
  return normalized ? selectedValues.includes(normalized) : true;
}