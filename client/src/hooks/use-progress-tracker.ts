// src/hooks/use-progress-tracker.ts
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

// Valori stimati per task_type reali del Google Sheet
// ACTION = post/azione diretta, LEARNING = studio, KPI = misurazione
const TASK_VALUES: Record<string, { reach: number; engagement: number; followers: number }> = {
  'action':   { reach: 35, engagement: 12, followers: 6 },
  'learning': { reach: 10, engagement:  3, followers: 1 },
  'kpi':      { reach:  0, engagement:  0, followers: 0 },
  'default':  { reach: 20, engagement:  6, followers: 3 },
};

function getTaskValues(taskType: string) {
  const key = (taskType || '').toLowerCase();
  return TASK_VALUES[key] ?? TASK_VALUES.default;
}

export function calculateProgressMetrics(
  tasks: Task[] = [],
  onboarding?: {
    goal?: string | string[];
    targetFollowers?: number;
    currentFollowers?: number;
    targetMonths?: number;
  },
  completedTaskIds: string[] = [],
  currentDay: number = 1
): ProgressMetrics {

  // --- Obiettivo follower dall'onboarding ---
  const targetFollowers = onboarding?.targetFollowers ?? 500;
  const startingFollowers = onboarding?.currentFollowers ?? 0;
  const targetMonths = onboarding?.targetMonths ?? 3;
  const totalToGain = Math.max(0, targetFollowers - startingFollowers);

  const rawGoal = onboarding?.goal;
  const goalString = typeof rawGoal === 'string'
    ? rawGoal.toLowerCase()
    : Array.isArray(rawGoal)
      ? (rawGoal[0] ?? '').toLowerCase()
      : '';
  const label = goalString.includes('follower') ? 'follower' : 'reach';

  // --- Progresso cumulativo basato sui giorni completati ---
  // Usiamo currentDay - 1 come numero di giorni effettivamente completati
  // (ogni giorno completato = avanzamento proporzionale verso l'obiettivo)
  const totalProgramDays = targetMonths * 30; // es. 3 mesi = 90 giorni
  const daysCompleted = Math.max(0, currentDay - 1);
  const progressRatio = totalProgramDays > 0
    ? Math.min(daysCompleted / totalProgramDays, 1)
    : 0;
  const estimatedFollowersGained = Math.round(totalToGain * progressRatio);

  // Aggiungi il contributo dei task completati OGGI
  const completedTodayTasks = tasks.filter(t =>
    completedTaskIds.includes(t.task_id) &&
    Number(t.day) === currentDay
  );
  const todayFollowerBonus = completedTodayTasks.reduce((sum, t) => {
    return sum + getTaskValues(t.task_type ?? '').followers;
  }, 0);

  const currentFollowersGained = estimatedFollowersGained + todayFollowerBonus;

  const goalProgress = {
    current: currentFollowersGained,
    target: totalToGain,
    percentage: totalToGain > 0
      ? Math.min(Math.round((currentFollowersGained / totalToGain) * 100), 100)
      : 0,
    label,
  };

  // --- Metriche di oggi ---
  const todayMetrics = completedTodayTasks.reduce(
    (acc, task) => {
      const v = getTaskValues(task.task_type ?? '');
      return {
        completedTasks: acc.completedTasks + 1,
        estimatedReach: acc.estimatedReach + v.reach,
        estimatedEngagement: acc.estimatedEngagement + v.engagement,
      };
    },
    { completedTasks: 0, estimatedReach: 0, estimatedEngagement: 0 }
  );

  // --- Streak: giorni consecutivi completati fino ad oggi ---
  // Usiamo currentDay come proxy: se l'utente è al giorno N
  // significa che ha completato N-1 giorni consecutivi
  const streak = Math.max(0, currentDay - 1);

  // --- Messaggi motivazionali ---
  let momentum: { message: string; nextMilestone: string; encouragement: string };

  if (streak >= 7) {
    momentum = {
      message: `🔥 ${streak} giorni di fila!`,
      nextMilestone: `Ancora ${totalToGain - currentFollowersGained} ${label} all'obiettivo`,
      encouragement: 'Sei in modalità crescita automatica. Non fermarti.',
    };
  } else if (streak >= 3) {
    momentum = {
      message: `✨ ${streak} giorni consecutivi!`,
      nextMilestone: `Raggiungi 7 giorni per sbloccare lo streak bonus`,
      encouragement: 'La costanza è la chiave della crescita social.',
    };
  } else if (goalProgress.percentage >= 50) {
    momentum = {
      message: '🎯 Sei a metà strada!',
      nextMilestone: `${totalToGain - currentFollowersGained} ${label} per raggiungere l'obiettivo`,
      encouragement: 'Il grosso è fatto, non mollare ora!',
    };
  } else {
    momentum = {
      message: streak > 0 ? '✨ Buon inizio!' : '🚀 Inizia oggi!',
      nextMilestone: 'Completa i task di oggi per avanzare',
      encouragement: 'Ogni giorno completato ti avvicina al traguardo.',
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
