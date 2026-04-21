// src/lib/value-tracker.ts
import { Task } from '@shared/schema';

export interface ValueFeedback {
  immediate: string;
  progress: string;
  momentum?: string;
  nextHint: string;
}

// Restituisce una stima contestuale leggendo il titolo del task
function getImmediateFeedback(task: Task): string {
  const title = (task.title || '').toLowerCase();
  const type  = (task.task_type || '').toLowerCase();
  const plat  = (Array.isArray(task.platform) ? task.platform[0] : task.platform || '').toLowerCase();

  if (title.includes('bio') || title.includes('profilo'))
    return '+15–40 visite profilo stimate';
  if (title.includes('reel') || title.includes('video'))
    return '+80–400 visualizzazioni stimate';
  if (title.includes('story') || title.includes('storie'))
    return '+30–80 visualizzazioni story';
  if (title.includes('dm') || title.includes('messaggio') || title.includes('contatt'))
    return '+2–8 conversazioni avviate';
  if (title.includes('commento') || title.includes('comment'))
    return '+3–12 nuove connessioni';
  if (title.includes('hashtag') || title.includes('caption'))
    return '+20–60 reach aggiuntivo';
  if (title.includes('collabor') || title.includes('partner'))
    return '+30–150 follower potenziali';
  if (title.includes('post') || title.includes('pubblica'))
    return '+8–30 engagement';
  if (title.includes('analytic') || title.includes('insight'))
    return 'Dati raccolti per decisioni migliori';
  if (title.includes('follow') || title.includes('audience'))
    return '+5–25 follower qualificati';
  if (title.includes('strategia') || title.includes('piano'))
    return '1–3 ore risparmiate a settimana';

  // Fallback per tipo + piattaforma
  if (type === 'learning')
    return 'Competenza acquisita ✓';
  if (type === 'action' && plat.includes('tiktok'))
    return '+50–300 visualizzazioni';
  if (type === 'action' && plat.includes('linkedin'))
    return '+20–80 impression';
  if (type === 'action')
    return '+5–20 engagement';

  return '+3–15 interazioni stimate';
}

export function calculateValueFeedback(
  task: Task,
  progress: { currentDay?: number; completedTasks?: number; streak?: number }
): ValueFeedback {
  const immediate = getImmediateFeedback(task);
  const day = progress.currentDay || 1;
  const completed = progress.completedTasks || 0;
  const streak = progress.streak || 0;

  return {
    immediate,
    progress: `Giorno ${day} • ${completed} task completati oggi`,
    momentum: streak >= 2 ? `🔥 ${streak} giorni di fila!` : undefined,
    nextHint: getNextHint(task.platform),
  };
}

function getNextHint(platform?: string | string[]): string {
  const p = (Array.isArray(platform) ? platform[0] : platform || '').toLowerCase();
  if (p.includes('instagram')) return 'Prossimo: Story con CTA → +30% engagement';
  if (p.includes('tiktok'))   return 'Prossimo: Duetto o risposta a video trending';
  if (p.includes('linkedin')) return 'Prossimo: Commenta 3 post di leader del settore';
  return 'Prossimo task disponibile';
}
