import { useState } from "react";
import { useLocation } from "wouter";
import { useOnboarding } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Target, TrendingUp, Users, Lightbulb } from "lucide-react";

// Mappa attività → obiettivi consigliati con spiegazione
const GOAL_SUGGESTIONS: Record<string, { goal: string; reason: string }[]> = {
  "Freelance": [
    { goal: "Generare Lead", reason: "I clienti cercano freelance sui social. Più visibilità = più richieste dirette." },
    { goal: "Costruire il Brand", reason: "Il tuo brand personale è il tuo portfolio più potente." },
  ],
  "Piccolo Imprenditore": [
    { goal: "Aumentare le Vendite", reason: "I social sono il canale di acquisizione più economico per PMI." },
    { goal: "Generare Lead", reason: "Costruisci una pipeline di contatti qualificati costantemente." },
  ],
  "Influencer / Creator": [
    { goal: "Aumentare i Follower", reason: "La crescita della community è la base di ogni monetizzazione futura." },
    { goal: "Costruire il Brand", reason: "Un brand riconoscibile attira collaborazioni e partnership." },
  ],
  "Consulente / Coach": [
    { goal: "Generare Lead", reason: "Il tuo contenuto dimostra la tua expertise e attrae clienti premium." },
    { goal: "Costruire il Brand", reason: "L'autorevolezza percepita giustifica tariffe più alte." },
  ],
  "Affiliato / Reseller": [
    { goal: "Aumentare i Follower", reason: "Più audience = più click sui link = più commissioni." },
    { goal: "Aumentare le Vendite", reason: "Contenuti di prodotto mirati convertono direttamente." },
  ],
  "Professionista / Dipendente": [
    { goal: "Costruire il Brand", reason: "Un profilo forte apre porte a nuove opportunità di carriera." },
    { goal: "Generare Lead", reason: "Posizionati come esperto nel tuo settore e attrai offerte." },
  ],
};

const ALL_GOALS = ["Generare Lead", "Costruire il Brand", "Aumentare le Vendite", "Aumentare i Follower"];

const TOTAL_STEPS = 5;

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const mutation = useOnboarding();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<any>({
    platform: [],
    activityType: "",
    productType: [],
    goal: "",
    currentFollowers: "",
    targetFollowers: "",
    targetMonths: "",
  });

  // Step 3: obiettivi suggeriti in base all'attività scelta
  const suggestedGoals = data.activityType
    ? GOAL_SUGGESTIONS[data.activityType] ?? []
    : [];
  const suggestedGoalNames = suggestedGoals.map((s) => s.goal);
  // Gli obiettivi non suggeriti compaiono in fondo senza badge
  const otherGoals = ALL_GOALS.filter((g) => !suggestedGoalNames.includes(g));

  // Validazione per ogni step
  const isStepValid = () => {
    switch (step) {
      case 0: return data.platform.length > 0;
      case 1: return data.activityType !== "";
      case 2: return data.productType.length > 0;
      case 3: return data.goal !== "";
      case 4: {
        const cf = Number(data.currentFollowers);
        const tf = Number(data.targetFollowers);
        const tm = Number(data.targetMonths);
        return cf >= 0 && tf > cf && tm >= 1 && tm <= 36;
      }
      default: return false;
    }
  };

  const handleNext = async () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      return;
    }
    // Step finale: salva
    await mutation.mutateAsync({
      platform: data.platform,
      activityType: data.activityType,
      productType: data.productType,
      goal: data.goal,
      currentFollowers: Number(data.currentFollowers),
      targetFollowers: Number(data.targetFollowers),
      targetMonths: Number(data.targetMonths),
      // Campi legacy per compatibilità con il Worker
      level: "Intermedio",
      target: "Growth",
      tone: "Professional",
    });
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">

        {/* Header */}
        <div className="mb-6 flex justify-between items-center px-1">
          <h1 className="text-xl font-bold text-slate-900">Configura il tuo percorso</h1>
          <span className="text-sm font-medium text-slate-400">
            {step + 1} / {TOTAL_STEPS}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-slate-200 rounded-full mb-8 overflow-hidden">
          <motion.div
            className="h-full bg-indigo-600 rounded-full"
            initial={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >

            {/* ── STEP 0: Piattaforme ── */}
            {step === 0 && (
              <>
                <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
                  Dove si trova il tuo pubblico?
                </h2>
                <p className="text-slate-500 text-center mb-6 text-sm">
                  Seleziona tutte le piattaforme su cui sei attivo o vuoi crescere.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                  {[
                    { name: "Instagram", icon: "📸" },
                    { name: "TikTok", icon: "🎵" },
                    { name: "Facebook", icon: "👥" },
                    { name: "LinkedIn", icon: "💼" },
                    { name: "Twitter/X", icon: "🐦" },
                    { name: "YouTube", icon: "▶️" },
                  ].map(({ name, icon }) => {
                    const selected = data.platform.includes(name);
                    return (
                      <button
                        key={name}
                        onClick={() => {
                          const current = data.platform;
                          setData({
                            ...data,
                            platform: selected
                              ? current.filter((p: string) => p !== name)
                              : [...current, name],
                          });
                        }}
                        className={clsx(
                          "p-4 rounded-2xl border-2 transition-all duration-200 relative flex flex-col items-center gap-2",
                          selected
                            ? "border-indigo-600 bg-indigo-50 shadow-md"
                            : "border-white bg-white hover:border-indigo-200 hover:shadow-sm"
                        )}
                      >
                        <span className="text-2xl">{icon}</span>
                        <span className={clsx("text-sm font-semibold", selected ? "text-indigo-900" : "text-slate-700")}>
                          {name}
                        </span>
                        {selected && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── STEP 1: Tipo di attività ── */}
            {step === 1 && (
              <>
                <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
                  Come ti definiresti?
                </h2>
                <p className="text-slate-500 text-center mb-6 text-sm">
                  Ci aiuta a personalizzare i task e suggerirti l'obiettivo più adatto a te.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                  {[
                    { name: "Freelance", icon: "💻", desc: "Lavori in proprio per clienti" },
                    { name: "Piccolo Imprenditore", icon: "🏪", desc: "Hai un'attività o un team" },
                    { name: "Influencer / Creator", icon: "🎥", desc: "Crei contenuti per un'audience" },
                    { name: "Consulente / Coach", icon: "🎯", desc: "Vendi la tua expertise" },
                    { name: "Affiliato / Reseller", icon: "🔗", desc: "Promuovi prodotti di altri" },
                    { name: "Professionista / Dipendente", icon: "👔", desc: "Costruisci il tuo brand personale" },
                  ].map(({ name, icon, desc }) => {
                    const selected = data.activityType === name;
                    return (
                      <button
                        key={name}
                        onClick={() => {
                          setData({ ...data, activityType: name });
                          setTimeout(() => setStep(2), 280);
                        }}
                        className={clsx(
                          "p-5 rounded-2xl border-2 transition-all duration-200 relative text-left flex items-start gap-3",
                          selected
                            ? "border-indigo-600 bg-indigo-50 shadow-md"
                            : "border-white bg-white hover:border-indigo-200 hover:shadow-sm"
                        )}
                      >
                        <span className="text-2xl mt-0.5">{icon}</span>
                        <div>
                          <p className={clsx("font-semibold", selected ? "text-indigo-900" : "text-slate-800")}>
                            {name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                        </div>
                        {selected && (
                          <div className="absolute top-3 right-3 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── STEP 2: Cosa vendi ── */}
            {step === 2 && (
              <>
                <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
                  Cosa vuoi promuovere?
                </h2>
                <p className="text-slate-500 text-center mb-6 text-sm">
                  Seleziona tutto ciò che si applica alla tua situazione.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                  {[
                    { name: "Prodotto Digitale", icon: "📦", desc: "Corsi, ebook, template, software" },
                    { name: "Coaching/Servizio", icon: "🤝", desc: "Consulenze, sessioni, progetti" },
                    { name: "Prodotto Fisico", icon: "🛍️", desc: "Oggetti, merce, e-commerce" },
                    { name: "Affiliazione", icon: "💰", desc: "Commissioni su prodotti altrui" },
                    { name: "Personal Brand", icon: "⭐", desc: "La tua persona è il prodotto" },
                    { name: "SaaS / App", icon: "🚀", desc: "Software o applicazione" },
                  ].map(({ name, icon, desc }) => {
                    const selected = data.productType.includes(name);
                    return (
                      <button
                        key={name}
                        onClick={() => {
                          const current = data.productType;
                          setData({
                            ...data,
                            productType: selected
                              ? current.filter((p: string) => p !== name)
                              : [...current, name],
                          });
                        }}
                        className={clsx(
                          "p-5 rounded-2xl border-2 transition-all duration-200 relative text-left flex items-start gap-3",
                          selected
                            ? "border-indigo-600 bg-indigo-50 shadow-md"
                            : "border-white bg-white hover:border-indigo-200 hover:shadow-sm"
                        )}
                      >
                        <span className="text-2xl mt-0.5">{icon}</span>
                        <div>
                          <p className={clsx("font-semibold", selected ? "text-indigo-900" : "text-slate-800")}>
                            {name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                        </div>
                        {selected && (
                          <div className="absolute top-3 right-3 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── STEP 3: Obiettivo (con suggerimenti contestuali) ── */}
            {step === 3 && (
              <>
                <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
                  Qual è il tuo obiettivo principale?
                </h2>
                {data.activityType && (
                  <p className="text-slate-500 text-center mb-6 text-sm">
                    Per un <span className="font-medium text-slate-700">{data.activityType}</span> consigliamo:
                  </p>
                )}

                <div className="space-y-3 mb-4">
                  {/* Obiettivi suggeriti — in evidenza */}
                  {suggestedGoals.map(({ goal, reason }) => {
                    const selected = data.goal === goal;
                    return (
                      <button
                        key={goal}
                        onClick={() => {
                          setData({ ...data, goal });
                          setTimeout(() => setStep(4), 280);
                        }}
                        className={clsx(
                          "w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left relative",
                          selected
                            ? "border-indigo-600 bg-indigo-50 shadow-md"
                            : "border-indigo-200 bg-white hover:border-indigo-400 hover:shadow-sm"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Lightbulb className="w-4 h-4 text-indigo-500 mt-1 flex-shrink-0" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={clsx("font-semibold", selected ? "text-indigo-900" : "text-slate-800")}>
                                {goal}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                Consigliato
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">{reason}</p>
                          </div>
                        </div>
                        {selected && (
                          <div className="absolute top-3 right-3 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Altri obiettivi — più discreti */}
                {otherGoals.length > 0 && (
                  <>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3 px-1">
                      Altri obiettivi
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                      {otherGoals.map((goal) => {
                        const selected = data.goal === goal;
                        return (
                          <button
                            key={goal}
                            onClick={() => {
                              setData({ ...data, goal });
                              setTimeout(() => setStep(4), 280);
                            }}
                            className={clsx(
                              "p-4 rounded-2xl border-2 transition-all duration-200 text-left relative",
                              selected
                                ? "border-indigo-600 bg-indigo-50 shadow-md"
                                : "border-white bg-white hover:border-indigo-200 hover:shadow-sm"
                            )}
                          >
                            <span className={clsx("font-semibold text-sm", selected ? "text-indigo-900" : "text-slate-700")}>
                              {goal}
                            </span>
                            {selected && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── STEP 4: Traguardo numerico ── */}
            {step === 4 && (
              <>
                <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
                  Definiamo il tuo traguardo
                </h2>
                <p className="text-slate-500 text-center mb-8 text-sm">
                  Questi dati rendono il piano AI specifico per te. Nessun giudizio — siamo qui per aiutarti a crescere.
                </p>

                <div className="space-y-5 mb-8">
                  {/* Follower attuali */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-slate-500" />
                      <label className="text-sm font-semibold text-slate-700">
                        Follower attuali sulla piattaforma principale
                      </label>
                    </div>
                    <input
                      type="number"
                      min="0"
                      placeholder="Es. 340"
                      value={data.currentFollowers}
                      onChange={(e) => setData({ ...data, currentFollowers: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-400 mt-2">
                      Scrivi 0 se stai partendo da zero — va benissimo.
                    </p>
                  </div>

                  {/* Obiettivo follower */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-indigo-500" />
                      <label className="text-sm font-semibold text-slate-700">
                        Quanti follower vuoi raggiungere?
                      </label>
                    </div>
                    <input
                      type="number"
                      min="1"
                      placeholder="Es. 2000"
                      value={data.targetFollowers}
                      onChange={(e) => setData({ ...data, targetFollowers: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {/* Feedback immediato se l'obiettivo è realistico */}
                    {Number(data.targetFollowers) > 0 && Number(data.currentFollowers) >= 0 && (
                      <p className="text-xs text-indigo-600 mt-2 font-medium">
                        +{(Number(data.targetFollowers) - Number(data.currentFollowers)).toLocaleString()} follower da guadagnare
                      </p>
                    )}
                  </div>

                  {/* Timeframe */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <label className="text-sm font-semibold text-slate-700">
                        In quanti mesi vuoi arrivarci?
                      </label>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 6].map((m) => (
                        <button
                          key={m}
                          onClick={() => setData({ ...data, targetMonths: String(m) })}
                          className={clsx(
                            "py-3 rounded-xl border-2 font-bold text-sm transition-all",
                            data.targetMonths === String(m)
                              ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                              : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200"
                          )}
                        >
                          {m} {m === 1 ? "mese" : "mesi"}
                        </button>
                      ))}
                    </div>
                    {/* Stima realistica */}
                    {Number(data.targetFollowers) > 0 && Number(data.targetMonths) > 0 && Number(data.currentFollowers) >= 0 && (() => {
                      const delta = Number(data.targetFollowers) - Number(data.currentFollowers);
                      const perMonth = Math.ceil(delta / Number(data.targetMonths));
                      const isAggressive = perMonth > 1000;
                      return (
                        <div className={clsx(
                          "mt-3 p-3 rounded-xl text-xs font-medium",
                          isAggressive
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        )}>
                          {isAggressive
                            ? `⚠️ Obiettivo ambizioso: ~${perMonth.toLocaleString()} follower/mese. Raggiungibile con costanza e i task giusti.`
                            : `✅ Obiettivo realistico: ~${perMonth.toLocaleString()} follower/mese. Il percorso è calibrato su questo ritmo.`
                          }
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </>
            )}

            {/* ── Pulsante avanti (non mostrato per step con auto-advance) ── */}
            {step !== 1 && step !== 3 && (
              <div className="flex justify-end">
                <Button
                  size="lg"
                  onClick={handleNext}
                  disabled={!isStepValid() || mutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-base px-8 py-6 rounded-xl disabled:opacity-40"
                >
                  {step === TOTAL_STEPS - 1
                    ? (mutation.isPending ? "Creazione piano..." : "Inizia il percorso →")
                    : (
                      <>
                        Continua
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )
                  }
                </Button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
