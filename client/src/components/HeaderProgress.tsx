// src/components/HeaderProgress.tsx
import { motion } from "framer-motion";
import { Target, Sparkles, Flame } from "lucide-react";
import { ProgressMetrics } from "@/hooks/use-progress-tracker";

interface HeaderProgressProps {
  metrics: ProgressMetrics;
  credits: number;
  plan: string;
  currentDay: number;
}

export function HeaderProgress({ metrics, credits, plan, currentDay }: HeaderProgressProps) {
  const goal = metrics.goalProgress;
  const today = metrics.today;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-3 md:gap-4"
    >
      {/* 🎯 Progresso obiettivo */}
      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
        <Target className="w-4 h-4 text-indigo-600" />
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Obiettivo</span>
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-900">
              +{goal.current}/{goal.target}
            </span>
            <span className="text-[10px] text-slate-500">{goal.label}</span>
          </div>
        </div>
        {/* Mini progress bar */}
        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden ml-2">
          <motion.div
            className="h-full bg-indigo-600"
            initial={{ width: 0 }}
            animate={{ width: `${goal.percentage}%` }}
            transition={{ type: "spring", stiffness: 100 }}
          />
        </div>
      </div>

      {/* 📊 Metriche oggi */}
      <div className="hidden md:flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-bold text-slate-900">+{today.estimatedReach}</span>
          <span className="text-[10px] text-slate-500">reach oggi</span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <div className="flex items-center gap-1">
          <Flame className={`w-3.5 h-3.5 ${today.streak >= 3 ? 'text-orange-500' : 'text-slate-400'}`} />
          <span className="text-xs font-bold text-slate-900">{today.streak}</span>
          <span className="text-[10px] text-slate-500">giorni</span>
        </div>
      </div>

      {/* 💎 Crediti + Piano */}
      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
        <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-slate-900 leading-none">{credits}</span>
          <span className="text-[10px] text-slate-400 uppercase leading-none">crediti</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          plan === 'PRO' ? 'bg-indigo-100 text-indigo-700' : 
          plan === 'TRIAL' ? 'bg-amber-100 text-amber-700' : 
          'bg-slate-100 text-slate-600'
        }`}>
          {plan}
        </span>
      </div>

      {/* 📅 Giorno corrente (mobile) */}
{/*      <div className="md:bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100"> */}
{/*        <span className="text-xs font-bold text-indigo-900">Giorno {currentDay}</span> */}
{/*      </div> */}
    </motion.div>
  );
}