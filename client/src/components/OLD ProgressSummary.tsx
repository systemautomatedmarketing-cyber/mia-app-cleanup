// src/components/ProgressSummary.tsx
import { motion } from "framer-motion";
import { Target, TrendingUp, Flame, CheckCircle2 } from "lucide-react";
import { ProgressMetrics } from "@/hooks/use-progress-tracker";

interface ProgressSummaryProps {
  metrics: ProgressMetrics;
  className?: string;
}

export function ProgressSummary({ metrics, className = "" }: ProgressSummaryProps) {
  // 🔍 DEBUG: logga quando il componente viene renderizzato
  console.log("🎨 [ProgressSummary] Render con metrics:", metrics);

  // ✅ FIX: Defensive coding - se metrics è undefined, mostra fallback
  if (!metrics) {
    console.warn("⚠️ [ProgressSummary] metrics è undefined!");
    return (
      <div className={`p-4 bg-amber-50 border border-amber-200 rounded-xl ${className}`}>
        <p className="text-sm text-amber-800">⏳ Caricamento progresso...</p>
      </div>
    );
  }

  // ✅ FIX: Estrai valori con fallback per evitare crash
  const goal = metrics.goalProgress || { current: 0, target: 500, percentage: 0, label: 'follower' };
  const today = metrics.today || { completedTasks: 0, estimatedReach: 0, estimatedEngagement: 0, streak: 0 };
  const momentum = metrics.momentum || { message: '', nextMilestone: '', encouragement: 'Continua così!' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-4 ${className}`}
    >
      {/* 🎯 Obiettivo principale */}
      <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            <h3 className="font-bold">Il tuo obiettivo</h3>
          </div>
          <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
            {goal.percentage}%
          </span>
        </div>
        
        <div className="text-2xl font-bold mb-1">
          +{goal.current} / {goal.target} {goal.label}
        </div>
        
        <div className="h-2 bg-white/30 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-white"
            initial={{ width: 0 }}
            animate={{ width: `${goal.percentage}%` }}
            transition={{ type: "spring", stiffness: 50, delay: 0.2 }}
          />
        </div>
        
        <p className="text-xs text-white/80 mt-2">
          {momentum.encouragement}
        </p>

<p className="text-[10px] text-white/70 mt-2 italic">
  * Le stime si basano su benchmark medi. I tuoi risultati possono variare.
</p>
      </div>

      {/* 📊 Metriche di oggi */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-slate-50 rounded-lg border text-center">
          <TrendingUp className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-slate-900">+{today.estimatedReach}</div>
          <div className="text-xs text-slate-500">visite stimate</div>
        </div>
        
        <div className="p-3 bg-slate-50 rounded-lg border text-center">
          <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-slate-900">{today.completedTasks}</div>
          <div className="text-xs text-slate-500">task oggi</div>
        </div>
        
        <div className="p-3 bg-slate-50 rounded-lg border text-center">
          <Flame className={`w-4 h-4 mx-auto mb-1 ${today.streak >= 3 ? 'text-orange-500' : 'text-slate-400'}`} />
          <div className="text-lg font-bold text-slate-900">{today.streak}</div>
          <div className="text-xs text-slate-500">giorni di fila</div>
        </div>
      </div>

      {/* 💡 Momentum message */}
      {momentum.message && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <span className="text-lg">💡</span>
          <div>
            <p className="font-medium text-amber-900 text-sm">{momentum.message}</p>
            <p className="text-xs text-amber-700 mt-1">{momentum.nextMilestone}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}