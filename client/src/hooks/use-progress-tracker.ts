// src/hooks/use-progress-tracker.ts
// ✅ FUNZIONE PURA: nessun hook React interno, solo calcoli
import { Task } from "@shared/schema";

export interface ProgressMetrics {
  goalProgress: {
    current: number;
    target: number;
    percentage: number;
    label: string;
  };
  today: {
    completedTasks: number;
    estimatedReach: number;
    estimatedEngagement: number;
    streak: number;
  };
  momentum: {
    message: string;
    nextMilestone: string;
    encouragement: string;
  };
}

export function calculateProgressMetrics(
  tasks: Task[] = [],
  onboarding?: { goal?: string; targetFollowers?: number },
  completedTaskIds: string[] = [],
  currentDay: number = 1
): ProgressMetrics {
  
  // Mappa task type → valore stimato (per Instagram MVP)
  const TASK_VALUES: Record<string, { reach: number; engagement: number; followers: number }> = {
    'bio': { reach: 25, engagement: 3, followers: 5 },
    'story': { reach: 40, engagement: 8, followers: 3 },
    'comment': { reach: 10, engagement: 12, followers: 2 },
    'hashtag': { reach: 20, engagement: 5, followers: 4 },
    'post': { reach: 35, engagement: 15, followers: 8 },
    'default': { reach: 15, engagement: 4, followers: 2 },
  };

  // Calcola metriche dai task completati OGGI
  const todayTasks = tasks.filter(t => 
    completedTaskIds.includes(t.task_id) && t.day === currentDay
  );

  const todayMetrics = todayTasks.reduce((acc, task) => {
    const values = TASK_VALUES[task.task_type?.toLowerCase()] || TASK_VALUES.default;
    return {
      completedTasks: acc.completedTasks + 1,
      estimatedReach: acc.estimatedReach + values.reach,
      estimatedEngagement: acc.estimatedEngagement + values.engagement,
    };
  }, { completedTasks: 0, estimatedReach: 0, estimatedEngagement: 0 });

  // Calcola progresso verso l'obiettivo principale
  const target = onboarding?.targetFollowers || 500;
//  const label = onboarding?.goal?.toLowerCase().includes('follower') ? 'follower' : 'engagement';
	
// ✅ FIX: Gestione sicura di goal (può essere string, array, o altro)
const rawGoal = onboarding?.goal;
const goalString = typeof rawGoal === 'string' 
  ? rawGoal.toLowerCase() 
  : Array.isArray(rawGoal) 
    ? rawGoal[0]?.toLowerCase() || '' 
    : '';
const label = goalString.includes('follower') ? 'follower' : 'engagement';
  
  const completedTasks = tasks.filter(t => completedTaskIds.includes(t.task_id));
  const estimatedFollowers = completedTasks.reduce((sum, task) => {
    const values = TASK_VALUES[task.task_type?.toLowerCase()] || TASK_VALUES.default;
    return sum + values.followers;
  }, 0);

  const goalProgress = {
    current: estimatedFollowers,
    target,
    percentage: Math.min(Math.round((estimatedFollowers / target) * 100), 100),
    label,
  };

  // Calcola streak (giorni consecutivi con almeno 1 task completato)
  const daysWithTasks = new Set(
    tasks
      .filter(t => completedTaskIds.includes(t.task_id))
      .map(t => t.day)
  );
  
  let streak = 0;
  for (let day = 1; day <= 7; day++) {
    if (daysWithTasks.has(day)) streak++;
    else break;
  }

  // Messaggi di motivazione dinamici
  let momentum: { message: string; nextMilestone: string; encouragement: string };
  if (streak >= 3) {
    momentum = {
      message: `🔥 ${streak} giorni di fila!`,
      nextMilestone: "Completa oggi per raggiungere la prima settimana!",
      encouragement: "La costanza è la chiave della crescita social.",
    };
  } else if (goalProgress.percentage >= 50) {
    momentum = {
      message: "🎯 A metà strada!",
      nextMilestone: `${goalProgress.target - goalProgress.current} ${goalProgress.label} per raggiungere l'obiettivo`,
      encouragement: "Il grosso è fatto, non mollare ora!",
    };
  } else {
    momentum = {
      message: streak > 0 ? "✨ Buon inizio!" : "🚀 Inizia oggi!",
      nextMilestone: "Completa 3 task per sbloccare il primo insight",
      encouragement: "Ogni piccolo passo conta.",
    };
  }

  return {
    goalProgress,
    today: {
      ...todayMetrics,
      streak,
    },
    momentum,
  };
}