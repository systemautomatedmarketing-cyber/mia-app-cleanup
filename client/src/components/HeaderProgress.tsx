// src/components/HeaderProgress.tsx
import { motion } from "framer-motion";
import { Target, Sparkles, Flame } from "lucide-react";
import { ProgressMetrics } from "@/hooks/use-progress-tracker";
import { filterTasks } from "@/lib/taskFilters";
import { useQuery } from "@tanstack/react-query";

interface HeaderProgressProps {
  metrics: ProgressMetrics;
  credits: number;
  plan: string;
  currentDay: number;
  progress: number;
}

export function HeaderProgress({ metrics, credits, plan, currentDay, progress }: HeaderProgressProps) {
  const goal = metrics.goalProgress;
  const today = metrics.today;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-2 md:gap-3"
    >
      {/* 📅 Giorno corrente (mobile) */}
{/*      <div className="md:bg-indigo-100 px-3 py-1.5 rounded-full border border-indigo-100"> */}
      <div className="md:hidden md:bg-indigo-100 px-3 py-1.5 rounded-full border text-center border-indigo-100"> 

        <span className="text-xs font-bold text-indigo-900">Giorno {currentDay}</span>
      </div> 

      {/* Crediti + Piano */}
      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-full border border-slate-200 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
        <span className="text-xs font-bold text-slate-900">{credits}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
          plan === "PRO" ? "bg-indigo-100 text-indigo-700" :
          plan === "TRIAL" ? "bg-amber-100 text-amber-700" :
          "bg-slate-100 text-slate-600"
        }`}>
          {plan}
        </span>
      </div>

      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
        <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
        <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Progresso Giornaliero</span>
              <div className="w-32 h-2 bg-slate-200 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div> 
      </div> 


      {/* Progresso obiettivo — sempre visibile */}
      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm min-w-0">
        <Target className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
        <span className="text-xs font-bold text-slate-900 whitespace-nowrap">
          +{goal.current}/{goal.target}
        </span>
        <span className="text-[10px] text-slate-500 sm:inline">{goal.label}</span>
        <div className="w-20 md:w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden ml-1 flex-shrink-0">
          <motion.div
            className="h-full bg-indigo-600"
            initial={{ width: 0 }}
            animate={{ width: `${goal.percentage}%` }}
            transition={{ type: "spring", stiffness: 100 }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm min-w-0">
        {/* Reach oggi — ora visibile anche su mobile */}
        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-full border border-slate-200 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-900">+{today.estimatedReach}</span>
          <span className="text-[10px] text-slate-500">reach</span>
        </div>

        {/* Streak — ora visibile anche su mobile */}
        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-full border border-slate-200 shadow-sm">
          <Flame className={`w-3.5 h-3.5 flex-shrink-0 ${today.streak >= 3 ? "text-orange-500" : "text-slate-400"}`} />
          <span className="text-xs font-bold text-slate-900">{today.streak}</span>
          <span className="text-[10px] text-slate-500">gg</span>
        </div>
      </div>

      {/* Reach oggi — ora visibile anche su mobile */}
{/*      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-full border border-slate-200 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
        <span className="text-xs font-bold text-slate-900">+{today.estimatedReach}</span>
        <span className="text-[10px] text-slate-500">reach</span>
      </div> */}

      {/* Streak — ora visibile anche su mobile */}
{/*      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-full border border-slate-200 shadow-sm">
        <Flame className={`w-3.5 h-3.5 flex-shrink-0 ${today.streak >= 3 ? "text-orange-500" : "text-slate-400"}`} />
        <span className="text-xs font-bold text-slate-900">{today.streak}</span>
        <span className="text-[10px] text-slate-500">gg</span>
      </div> */}


    </motion.div>
  );
}
