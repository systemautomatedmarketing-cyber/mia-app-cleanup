// src/lib/taskFilters.ts
import { UserFilterSettings } from "@shared/filters";
import { Task } from "@shared/schema";

/**
 * Filtra un array di task in base alle impostazioni filtro dell'utente
 * - Applica solo i filtri con enabled: true
 * - Se values è vuoto, non filtra (mostra tutti)
 */
export function filterTasks(tasks: Task[], filterSettings?: UserFilterSettings, userProfile?: Partial<Task>): Task[] {
  if (!filterSettings) return tasks;
  
  return tasks.filter((task) => {
    // ─────────────────────────────────────
    // FILTRO 1: Livello Esperienza (ATTIVO ORA)
    // ─────────────────────────────────────
    if (filterSettings.experienceLevel?.enabled && filterSettings.experienceLevel.values.length > 0) {
      // Match: task.experienceLevel deve essere IN values selezionati
      // Se task non ha experienceLevel, lo includiamo sempre (fallback sicuro)
      if (task.experienceLevel && !filterSettings.experienceLevel.values.includes(task.experienceLevel)) {
        return false;
      }
    }
    
    // ─────────────────────────────────────
    // FILTRO 2: Piattaforma (PRONTO, DISABILITATO)
    // ─────────────────────────────────────
    if (filterSettings.platform?.enabled && filterSettings.platform.values.length > 0) {
      // Supporta matching su singolo valore o array
      const taskPlatforms = Array.isArray(task.platform) ? task.platform : [task.platform];
      const hasMatch = taskPlatforms.some((p: string) => filterSettings.platform!.values.includes(p as any));
      if (!hasMatch) return false;
    }
    
    // ─────────────────────────────────────
    // FILTRO 3: Tipologia Vendita (PRONTO, DISABILITATO)
    // ─────────────────────────────────────
    if (filterSettings.salesType?.enabled && filterSettings.salesType.values.length > 0) {
      const taskTypes = Array.isArray(task.salesType) ? task.salesType : [task.salesType];
      const hasMatch = taskTypes.some((t: string) => filterSettings.salesType!.values.includes(t as any));
      if (!hasMatch) return false;
    }
    
    // ─────────────────────────────────────
    // FILTRO 4: Obiettivo Principale (PRONTO, DISABILITATO)
    // ─────────────────────────────────────
    if (filterSettings.mainGoal?.enabled && filterSettings.mainGoal.values.length > 0) {
      if (task.mainGoal && !filterSettings.mainGoal.values.includes(task.mainGoal)) {
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
  
  const taskValue = task[filterKey as keyof Task];
  
  if (Array.isArray(taskValue)) {
    return taskValue.some((v: string) => selectedValues.includes(v));
  }
  
  return taskValue ? selectedValues.includes(taskValue as string) : true;
}