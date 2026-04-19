// src/lib/value-tracker.ts
import { Task, UserProgress } from '@shared/schema';

export interface ValueFeedback {
  immediate: string;      // "+23 visite profilo stimate"
  progress: string;       // "Giorno 2 di 7 • 3 task completati"
  momentum?: string;      // "🔥 2 giorni di fila!" (opzionale)
  nextHint: string;       // "Prossimo: Story con CTA → +30% engagement"
}

export function calculateValueFeedback(
  task: Task, 
  progress: UserProgress
): ValueFeedback {
  // Mappa task → risultato stimato (per Instagram MVP)
  const ESTIMATED_RESULTS: Record<string, string> = {
    'bio': '+15-30 profile visits',
    'story': '+20-50 reach',
    'comment': '+3-8 new connections',
    'hashtag': '+10-25 discoverability',
    'default': '+5-15 engagement'
  };

  const resultKey = task.task_type.toLowerCase().includes('bio') 
    ? 'bio' 
    : task.task_type.toLowerCase().includes('story')
    ? 'story'
    : 'default';

  return {
    immediate: ESTIMATED_RESULTS[resultKey] || ESTIMATED_RESULTS.default,
    progress: `Giorno ${progress.currentDay || 1} di 7 • ${progress.completedTasks || 0} task completati`,
    momentum: (progress.streak || 0) >= 2 ? `🔥 ${progress.streak} giorni di fila!` : undefined,
    nextHint: getNextHint(task.platform)
  };
}

function getNextHint(platform?: string | string[]): string {
  const p = Array.isArray(platform) ? platform[0] : platform;
  
  if (p === 'instagram' || p === 'all') {
    return "Prossimo: Story con CTA → +30% engagement";
  }
  return "Prossimo task disponibile tra poche ore";
}

// Helper per convertire i dati dal foglio (se ancora usi Google Sheets)
export function parseTaskFromSheet(data: Record<string, any>): Task {
  return {
    ...data,
    // Conversioni critiche da stringa a tipo corretto:
    pro_only: data.pro_only === 'true' || data.pro_only === true,
    credits_cost: Number(data.credits_cost) || 0,
    ai_variables: typeof data.ai_variables === 'string' 
      ? safeJsonParse(data.ai_variables) 
      : data.ai_variables,
    status: validateStatus(data.status),
  };
}

function safeJsonParse(str: string): Record<string, any> | undefined {
  try {
    return JSON.parse(str);
  } catch {
    return undefined;
  }
}

function validateStatus(s?: string): TaskStatus {
  const valid: TaskStatus[] = ['draft', 'active', 'archived'];
  return valid.includes(s as TaskStatus) ? (s as TaskStatus) : 'active';
}