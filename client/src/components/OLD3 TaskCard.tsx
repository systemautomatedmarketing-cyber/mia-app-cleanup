import { useState } from "react";
import { type Task } from "@shared/schema";
import { useTasks } from "@/hooks/use-tasks";
import { useAuth } from "@/hooks/use-auth";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  SkipForward,
  Clock,
  Bot,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@shared/routes";

import { deferTask, setInjectedTaskStatus } from "@/lib/deferrals";
import { useQueryClient } from "@tanstack/react-query";

import { REPLACEMENT_POOL } from "@/lib/replacementPool";
import { useToast } from "@/hooks/use-toast";

import { calculateValueFeedback } from '@/lib/value-tracker';

import { TaskGuidatoBio } from "./TaskGuidatoBio";
import { getTaskMetricEstimate, formatEstimate, getTransparencyNote } from '@/lib/metrics-explainer';

interface TaskCardProps {
  task: Task;
}

//export function TaskCard({ task }: TaskCardProps) {
export function TaskCard({ task, onCompleteClick, }: { task: any; onCompleteClick?: (task: any) => void; }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const { updateStatusMutation, generateAiMutation } = useTasks();

  const [generatedOutput, setGeneratedOutput] = useState<{content: string, tips: string} | null>(null);

  const isCompleted = task.status === "Done";
  const isSkipped = task.status === "Skipped";
  const isPending = task.status === "Pending" || !task.status;

  const isLockedKPI = task?.task_type === "KPI"; 
// 🔢 Conta quante volte il task è stato rimandato (per avviso ≥3)
//  const deferCount = task?.__deferCount ?? 0;
  const deferCount = user.currentDay - task.day ?? 0;
  const isHeavilyDeferred = deferCount >= 2;

  const qc = useQueryClient();
  const [selectedReplacementId, setSelectedReplacementId] = useState("");

  const { toast } = useToast();
  const handleGenerateAI = async () => {
    try {
      const variables = {
        topic: task.title,
        context: `Piattaforma: ${task.platform}, Obiettivo: ${task.goal}`,
      };

      // Usa il Worker Cloudflare (generateAiMutation) — sistema unico e corretto
      const result = await generateAiMutation.mutateAsync({
        taskId: task.task_id,
        variables,
      });

      if (result?.output) {
        // Il Worker restituisce output come stringa (testo o JSON)
        let content = result.output;
        let tips = "";

        // Prova a parsare se è JSON
        try {
          const jsonMatch = result.output.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            content = parsed.content || parsed.text || parsed.output || result.output;
            tips = parsed.tips || parsed.advice || "";
          }
        } catch {
          // Non è JSON — usa il testo direttamente
          content = result.output;
        }

        setGeneratedOutput({ content, tips });
        setAiModalOpen(false);

        toast({
          title: "✅ Contenuto generato!",
          description: content.substring(0, 80) + (content.length > 80 ? "..." : ""),
          duration: 5000,
        });

        // Invalida user per aggiornare il saldo crediti in UI
        qc.invalidateQueries({ queryKey: [api.auth.user.path] });
      }
    } catch (e: any) {
      const isInsufficientCredits =
        e?.message?.includes("Insufficient credits") ||
        e?.status === 403 ||
        e?.code === 403;

      if (isInsufficientCredits) {
        toast({
          title: "Crediti insufficienti",
          description: "Acquista crediti per usare l'AI su questo task.",
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: "Errore generazione AI",
          description: e?.message || "Riprova tra qualche secondo.",
          variant: "destructive",
          duration: 4000,
        });
      }
    }
  };

const handleComplete = async () => {
  try {
    // ✅ Se task è "iniettato" (rimandato o sostitutivo) -> aggiorna Firestore, NON backend
    if (task.__injected) {
      if (!user) return;

      await setInjectedTaskStatus({
        uid: user.id,
        day: user.currentDay ?? task.day,
        carryOriginalTaskId: task.__carryOriginalTaskId,
        status: "Done",
      });

      // ricarica deferrals così la UI vede status Done
      await qc.invalidateQueries({
        queryKey: ["deferrals", user.id, user.currentDay ?? task.day],
      });

      // ✅ MOSTRA FEEDBACK VALORE anche per task iniettati
      const feedback = calculateValueFeedback(task, {
        currentDay: user?.currentDay ?? task.day,
        completedTasks: 0, // valore minimo, verrà sovrascritto da query reale
        streak: 0
      });
      
      toast({
        title: "✅ Task completato!",
        description: feedback.immediate,
        duration: 5000,
        className: "bg-green-50 border-green-200 text-green-900",
      });

      return;
    }
    
    // ✅ Se KPI: apri modale invece di segnare Done subito
    if (task?.task_type === "KPI" && task?.status !== "Done") {
      onCompleteClick?.(task);
      return;
    }

    // ✅ Tutti gli altri task: comportamento normale
    await updateStatusMutation.mutateAsync({
      taskId: task.task_id,
      status: "Done",
      day: task.day,
    });

    // ✅ MOSTRA FEEDBACK VALORE IMMEDIATO
    const feedback = calculateValueFeedback(task, {
      currentDay: user?.currentDay ?? task.day,
      completedTasks: 0,
      streak: 0
    });
    
    toast({
      title: "✅ Task completato!",
      description: feedback.immediate,
      duration: 5000,
      className: "bg-green-50 border-green-200 text-green-900",
    });

  } catch (error) {
    console.error("Errore completamento task:", error);
    toast({
      title: "⚠️ Qualcosa è andato storto",
      description: "Riprova tra poco",
      variant: "destructive",
      duration: 4000,
    });
  }
};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "rounded-2xl border transition-all duration-300 overflow-hidden",
        isCompleted
          ? "bg-slate-50 border-slate-200"
          : "bg-white border-border shadow-sm hover:shadow-md hover:border-indigo-200",
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={clsx(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  {
                    "bg-indigo-50 text-indigo-600 border-indigo-100":
                      task.task_type === "ACTION",
                    "bg-emerald-50 text-emerald-600 border-emerald-100":
                      task.task_type === "KPI",
                    "bg-amber-50 text-amber-600 border-amber-100":
                      task.task_type === "LEARNING",
                  },
                )}
              >
                {task.task_type === "ACTION"
                  ? "AZIONE"
                  : task.task_type === "KPI"
                    ? "KPI"
                    : "APPRENDIMENTO"}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {task.estimated_time}
              </span>
              {task.ai_support_available === "YES" && (
                <span className="text-xs font-semibold text-purple-600 flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                  <Bot className="w-3 h-3" /> Potenziato da AI
                </span>
              )}
            </div>

            <h3
              className={clsx(
                "text-lg font-bold font-display mb-1 transition-colors",
                isCompleted ? "text-slate-400 line-through" : "text-foreground",
              )}
            >
              {task.title}
            </h3>

            <p
              className={clsx(
                "text-sm text-muted-foreground line-clamp-2",
                expanded && "line-clamp-none",
              )}
            >
              {task.instructions}
            </p>


{/* ✅ NUOVO: Task guidato per "Ottimizza bio Instagram" */}
{expanded && task.task_id === "bio_instagram_001" && (
  <div className="mt-4 pt-4 border-t">
    <TaskGuidatoBio 
      onComplete={() => {
        handleComplete();
        setExpanded(false);
      }}
      username={user?.username || "tuoprofilo"}
      niche={user?.onboarding?.niche || "il tuo settore"}
      isCompleted={isCompleted}  // ← AGGIUNGI QUESTO
    />
  </div>
)}
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-primary transition-colors p-1"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-dashed border-slate-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Obiettivo
                  </span>
                  <p className="font-medium">{task.goal}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Piattaforma
                  </span>
                  <p className="font-medium">{task.platform}</p>
                </div>
                {task.kpi_target && (
                  <div className="col-span-2 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <span className="text-xs font-bold text-emerald-700 uppercase flex items-center gap-1 mb-1">
                      <TrendingUp className="w-3 h-3" /> Metrica di Successo
                    </span>
                    <p className="font-medium text-emerald-900">
                      {task.kpi_target} {task.kpi_name}
                    </p>
                  </div>
                )}
              </div>

              {task.ai_support_available === "YES" && !isCompleted && (
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-5 h-5 text-purple-600" />
                    <h4 className="font-bold text-purple-900">
                      Assistente AI Disponibile
                    </h4>
                  </div>
                  <p className="text-sm text-purple-700 mb-3">
                    Usa l'AI per generare istantaneamente contenuti per questa
                    attività.
                  </p>


                {!generatedOutput ? (
 
                  <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white border-none shadow-lg shadow-purple-200">
                        <Zap className="w-4 h-4 mr-2" />
                        Genera con AI
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Bot className="w-5 h-5 text-purple-600" />
                          Assistente AI
                        </DialogTitle>
                      </DialogHeader>
  
                      <div className="space-y-5 py-4">
                        {/* ✅ ANTEPRIMA VALORE */}
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Cosa otterrai:</p>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>Contenuto pronto da copiare e pubblicare</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>Spiegazione del <strong>perché funziona</strong> per il tuo obiettivo</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>Stima del risultato: <strong>+{task.expected_result || "10-20 engagement"}</strong></span>
                            </li>
                          </ul>
                        </div>

                        {/* ✅ COSTO & CREDITI RESIDUI */}
                        {(() => {
                          const creditsNeeded = Number(task.credits_cost) || 0;
                          const balance = user?.creditsBalance ?? 0;
                          const remaining = balance - creditsNeeded;

                          return (
                            <div className={`p-3 rounded-lg border ${
                              remaining < 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                            }`}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-600">Costo operazione</span>
                                <span className="font-bold text-slate-900">{creditsNeeded} crediti</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Dopo questa operazione</span>
                                <span className={`font-bold ${remaining < 0 ? 'text-red-600' : 'text-amber-700'}`}>
                                  {remaining} crediti
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <DialogFooter className="flex-col sm:flex-row gap-2">
                        {/* Link acquisto crediti (solo se FREE e insufficienti) */}
                        {(user?.plan === "FREE"  || user?.plan === "TRIAL")  && (Number(user?.creditsBalance ?? 0) < Number(task.credits_cost || 0)) && (
                          <a href="https://buy.stripe.com/fZu9ATb2v43f1Vz4zT7AI03" target="_blank" rel="noreferrer" className="w-full">
                            <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50">
                              💎 Acquista 100 Crediti
                            </Button>
                          </a>
                        )}

                        <Button
                          onClick={handleGenerateAI}
                          disabled={generateAiMutation.isPending || (Number(user?.creditsBalance ?? 0) < Number(task.credits_cost || 0))}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {generateAiMutation.isPending ? "Generazione in corso..." : "Genera con AI"}
                        </Button>

                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 bg-white p-3 rounded-lg border border-purple-100 shadow-sm"
                    >
                      <p className="text-sm whitespace-pre-wrap text-slate-700">
                        {generatedOutput!.content}
                      </p>
                      {generatedOutput!.tips && (
                        <p className="text-xs text-slate-500 italic border-t pt-2 mt-2">
                          💡 {generatedOutput!.tips}
                        </p>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full"
                        onClick={() =>
                          navigator.clipboard.writeText(generatedOutput!.content)
                        }
                      >
                        Copia negli Appunti
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}


              <div className="flex gap-2 justify-end pt-2 border-t border-border">



                {isPending && (
                  <>
  {isLockedKPI ? (
                    <Button
                      onClick={handleComplete}
                      disabled={updateStatusMutation.isPending}
		      className="bg-emerald-600 hover:bg-emerald-700 text-white animate- pulse" 
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Completa KPI Obbligatorio
                    </Button>
  ) : (
	<>
	    <select
              className="border rounded px-2 py-1 text-sm bg-white hover:border-indigo-300 transition-colors"
	      value={selectedReplacementId}
	      onChange={(e) => setSelectedReplacementId(e.target.value)}
	    >
	      <option value="">Sostituisci con… (opzionale)</option>
	      {REPLACEMENT_POOL.map((r) => (
	        <option key={r.task_id} value={r.task_id}>
	          {r.title}
 	        </option>
	      ))}
	    </select>
                    <Button
                      variant="ghost"
                      onClick={async () => {

//                        if (!user) return;

                        // Qui (per ora) rimando senza sostituzione

  if (!user) {
    console.error("❌ [DEBUG] user is undefined");
    return;
  }
  if (!user.id) {
    console.error("❌ [DEBUG] user.id is undefined - forse è user.uid?");
    return;
  }
  if (task.day === undefined) {
    console.error("❌ [DEBUG] task.day is undefined");
    return;
  }

  try {
 const replacement = selectedReplacementId
        ? REPLACEMENT_POOL.find((x) => x.task_id === selectedReplacementId)
        : undefined;


                        await deferTask({
                          uid: user.id, 	
                          fromDay: user.currentDay ?? task.day, //task.day,
                          task,
replacementTaskSnapshot: replacement
          ? { ...replacement, day: task.day } // 👈 per farlo risultare “di oggi”
          : undefined,
                        });


  const targetDay = user.currentDay ?? task.day;
    
                        // ricarico deferrals + today
//                          await qc.invalidateQueries({ queryKey: ["deferrals", user.id, user.currentDay ?? task.day] });

  await qc.invalidateQueries({ queryKey: ["deferrals", user.id, targetDay] });

                        await qc.invalidateQueries({ queryKey: [api.tasks.today.path] });


 // reset select dopo l'azione
      setSelectedReplacementId("");
} catch (error: any) {
    console.error("❌ [DEBUG] Errore in deferTask:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack?.split('\n')[0],
      fullError: error,
    });
    // Optional: mostra un toast all'utente
//     toast.error("Errore nel rimandare l'attività");
     toast({
                 title: "Errore nel rimandare l'attività!",
                description: `Errore nel rimandare l'attività`,
                variant: "default",
    });
  }
                      }}
                      disabled={updateStatusMutation.isPending || isCompleted}
		      className="text-slate-600 hover:text-slate-800"
                    >

                      <SkipForward className="w-4 h-4 mr-2" />
                      Rimanda a domani
                    </Button>

                    <Button

                      onClick={handleComplete}
                      disabled={updateStatusMutation.isPending}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Segna come completato
                    </Button>
                  </>
                )}
 	   </>
	)}
 {isCompleted && (
   <div className="space-y-3">
    {/* Bottone stato */}
    <Button
      variant="outline"
      disabled
      className="text-green-600 border-green-200 bg-green-50"
    >
      <CheckCircle2 className="w-4 h-4 mr-2" />
      Completato
    </Button>
    
    {/* ✅ NUOVO: Box feedback valore */}

 <motion.div 
    initial={{ opacity: 0, y: 8 }} 
    animate={{ opacity: 1, y: 0 }}
    className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200"
  >
    <div className="flex items-start gap-2">
      <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
      <div className="text-sm">
        <p className="font-medium text-green-900">
          {formatEstimate(getTaskMetricEstimate(task.task_type, String(task.platform)))}
        </p>
        <details className="mt-1 group">
          <summary className="text-xs text-green-700 cursor-pointer hover:underline list-none">
            Come calcoliamo questa stima? ▸
          </summary>
          <p className="text-xs text-green-600 mt-2 pl-2 border-l-2 border-green-300">
            {getTransparencyNote(getTaskMetricEstimate(task.task_type, String(task.platform)))}
          </p>
        </details>
      </div>
    </div>
  </motion.div>
  </div>
)}

                {isSkipped && (
                  <Button
                    variant="outline"
                    disabled
                    className="text-amber-600 border-amber-200 bg-amber-50"
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Saltato
                  </Button>
                )}
              </div>

{/* ─────────────────────────────────────────────
    AVVISO: Task rimandato ≥ 3 volte (BONUS)
    ───────────────────────────────────────────── */}
{isHeavilyDeferred && isPending && !isLockedKPI && (
  <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2">
    <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
    <p className="text-xs text-rose-800">
      <strong>Attenzione:</strong> questa attività è stata rimandata {deferCount} volte. 
      Considera di completarla oggi o sostituirla per mantenere il piano efficace.
    </p>
  </div>
)}

{/* ─────────────────────────────────────────────
    MESSAGGIO INFO PER KPI BLOCCATI
    ───────────────────────────────────────────── */}
{isLockedKPI && isPending && (
  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
    <p className="text-xs text-amber-800">
      <strong>KPI obbligatorio:</strong> questo indicatore del giorno precedente deve essere compilato oggi. 
      Non può essere rimandato o sostituito per garantire la continuità del monitoraggio.
    </p>
  </div>
)}

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!expanded && !isCompleted && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <span className="text-xs font-medium text-slate-500">
            {task.goal} • {task.platform}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-0 h-auto font-medium"
            onClick={() => setExpanded(true)}
          >
            Inizia Attività →
          </Button>
        </div>
      )}
    </motion.div>
  );
}
