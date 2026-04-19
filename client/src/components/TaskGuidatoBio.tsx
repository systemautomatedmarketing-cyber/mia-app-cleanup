// src/features/tasks/components/TaskGuidatoBio.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Copy, ExternalLink, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface TaskGuidatoBioProps {
  onComplete: () => void;
  username?: string;
  niche?: string;
  isCompleted?: boolean;  // ← AGGIUNGI QUESTO
}

export function TaskGuidatoBio({ onComplete, username = "tuoprofilo", niche = "il tuo settore", isCompleted = false }: TaskGuidatoBioProps) {
  const { toast } = useToast();
  // ✅ FIX: Array di step completati, non singolo step
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const bioExamples = [
    {
      title: "Freelancer",
      text: `✦ Aiuto ${niche} a ottenere più clienti\n✦ Risultati in 30 giorni o rimborso\n✦ Prenota una call gratuita ↓`,
    },
    {
      title: "Network Marketing",
      text: `✦ Costruisco team di ${niche} motivati\n✦ Formazione gratuita ogni settimana\n✦ Unisciti al gruppo VIP ↓`,
    },
    {
      title: "Piccola Impresa",
      text: `✦ ${niche} di qualità dal [anno]\n✦ Spedizione in 24h • Soddisfatti o rimborsati\n✦ Acquista ora ↓`,
    },
  ];

  // ✅ FIX: Gestione errori per clipboard
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      toast({
        title: "✅ Copiato!",
        description: "Incolla nella tua bio Instagram",
        duration: 3000,
      });
      setTimeout(() => setCopiedField(null), 2000);
    }).catch(() => {
      toast({
        title: "⚠️ Copia fallita",
        description: "Seleziona e copia manualmente il testo",
        variant: "destructive",
        duration: 4000,
      });
    });
  };

  // ✅ FIX: Funzione per segnare step come completato
  const handleStepComplete = (stepNum: number) => {
    if (!completedSteps.includes(stepNum)) {
      setCompletedSteps([...completedSteps, stepNum]);
    }
  };

  const steps = [
    {
      num: 1,
      title: "Vai sul tuo profilo Instagram",
      action: (
        <Button 
          variant="outline" 
          size="sm" 
          asChild
          // ✅ FIX: Avanza allo step successivo al click
          onClick={() => handleStepComplete(1)}
        >
          <a href="https://instagram.com" target="_blank" rel="noreferrer">
            Apri Instagram <ExternalLink className="w-3 h-3 ml-2" />
          </a>
        </Button>
      ),
    },
    {
      num: 2,
      title: "Clicca 'Modifica profilo'",
      action: (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleStepComplete(2)}
          className="mt-2"
        >
          Ho cliccato "Modifica profilo"
        </Button>
      ),
    },
    {
      num: 3,
      title: "Scegli un template e personalizzalo",
      action: (
        <div className="space-y-3 mt-2">
          {bioExamples.map((example, idx) => (
            <Card key={idx} className="cursor-hover hover:border-indigo-300 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{example.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm whitespace-pre-line font-mono bg-slate-50 p-2 rounded mb-2">
                  {example.text}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleCopy(example.text, `bio-${idx}`);
                    // ✅ FIX: Completa step 3 quando copi una bio
                    handleStepComplete(3);
                  }}
                  className="w-full"
                >
                  {copiedField === `bio-${idx}` ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-2 text-green-600" /> Copiato!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-2" /> Copia questa bio
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ),
    },
    {
      num: 4,
      title: "Aggiungi un link nel campo 'Sito web'",
      action: (
        <>
          <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm">
            <Lightbulb className="w-4 h-4 inline mr-1 text-amber-600" />
            <strong>Pro tip:</strong> Usa Linktree, Beacons o il tuo sito. 
            Un link chiaro aumenta le conversioni del 40%.
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleStepComplete(4)}
            className="mt-2"
          >
            Ho aggiunto il link
          </Button>
        </>
      ),
    },
    {
      num: 5,
      title: "Salva e torna qui per confermare",
      action: (
        <Button 
          onClick={() => {
            handleStepComplete(5);
            onComplete();
          }}
          className="w-full bg-green-600 hover:bg-green-700 mt-2"
          // ✅ FIX: Disabilita finché non completi almeno 4 step su 5
          disabled={completedSteps.length < 4}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Ho completato l'ottimizzazione!
        </Button>
      ),
    },
  ];

  // ✅ FIX: Progresso basato su step COMPLETATI, non su step corrente
  const progress = Math.round((completedSteps.length / steps.length) * 100);

  // ✅ FIX: Se il task è completato, mostra riepilogo invece dei step attivi
  if (isCompleted || completedSteps.length === steps.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="font-bold text-lg text-green-900 mb-2">Ottimo lavoro! 🎉</h3>
        <p className="text-sm text-green-700 mb-4">
          La tua bio è ottimizzata per convertire visitatori in follower.
        </p>
        <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-sm">
          <p className="font-medium text-green-900">+15-30 visite profilo stimate</p>
          <p className="text-green-700 mt-1">Continua con il prossimo task per mantenere lo slancio!</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header con valore percepito */}
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
        <h3 className="font-bold text-indigo-900 mb-1">🎯 Perché questo task?</h3>
        <p className="text-sm text-indigo-700">
          Una bio ottimizzata aumenta le <strong>visite al profilo del 30%</strong> e 
          trasforma i visitatori in follower o clienti.
        </p>
      </div>

      {/* Step-by-step */}
      <div className="space-y-4">
        {steps.map((s, idx) => {
          const isCompleted = completedSteps.includes(s.num);
          // ✅ FIX: Mostra azione solo se è lo step corrente (non completato ma tutti i precedenti sì)
          const isCurrent = !isCompleted && completedSteps.length === s.num - 1;
          // ✅ FIX: Grigia gli step futuri non ancora sbloccati
          const isLocked = completedSteps.length < s.num - 1;
          
          return (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: isLocked ? 0.4 : 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className="flex items-start gap-3">
                <div className={clsx(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                  isCompleted ? "bg-green-100 text-green-700" : "bg-indigo-100 text-indigo-700"
                )}>
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <div className="flex-1">
                  <p className={clsx("font-medium text-sm", isLocked && "text-muted-foreground")}>
                    {s.title}
                  </p>
                  {/* ✅ FIX: Mostra azione SOLO se è lo step corrente */}
                  {s.action && isCurrent && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-2"
                    >
                      {s.action}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progress indicator */}
      <div className="pt-4 border-t">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Progresso</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-indigo-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 50 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ✅ FIX: Helper clsx inline se non è importato
function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}