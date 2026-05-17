import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTasks } from "@/hooks/use-tasks";
import { Navigation } from "@/components/Navigation";
import { TaskCard } from "@/components/TaskCard";
import { KPIDialog } from "@/components/KPIDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Trophy, Loader2, Sparkles, PlayCircle } from "lucide-react";
import { clsx } from "clsx";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Menu, LogOut, UserCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { getDeferrals } from "@/lib/deferrals";

import { enablePushNotifications } from "@/lib/push";

import { doc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { filterTasks } from "@/lib/taskFilters";
import type { UserFilterSettings } from "@shared/filters";
import { DEFAULT_FILTER_SETTINGS } from "@shared/filters";

import { FilterSettings } from "@/components/FilterSettings";

import { calculateProgressMetrics } from "@/hooks/use-progress-tracker";
import { getMotivationalMessage } from "@/lib/motivational-messages";
import { ProductTour } from "@/components/ProductTour";
import { useTour } from "@/hooks/use-tour";
import { getDashboardSteps } from "@/lib/tour-steps";
//import { ProgressSummary } from "@/components/ProgressSummary";
import { HeaderProgress } from "@/components/HeaderProgress";

import { useMonetizationTriggers } from "@/hooks/use-monitization-triggers";
import { ProValuePreview } from "@/components/ProValuePreview";

export default function Dashboard() {
//  const { user } = useAuth();
  const { user, logoutMutation  } = useAuth();

const [localFilterSettings, setLocalFilterSettings] = useState<UserFilterSettings | undefined>(undefined);

  useEffect(() => {
    if (!user?.id) return;

    const updateLastSeen = async () => {
      try {
        await setDoc(
          doc(db, "users", user.id),
          {
            lastSeenAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error("Errore aggiornamento lastSeenAt:", error);
      }
    };

    updateLastSeen();
  }, [user?.id]);

// ─────────────────────────────────────────────
// 🔔 AUTO-REGISTRAZIONE NOTIFICHE PUSH
// ─────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const registerNotifications = async () => {
      // Non chiedere se il browser non supporta
      if (!("Notification" in window)) return;

      // Se l'utente ha già risposto alla richiesta (granted o denied), non chiedere di nuovo
      // ma se è "default" (non ancora risposto) chiediamo ad ogni apertura
      if (Notification.permission === "denied") return;

      try {
        const { areNotificationsEnabled, enablePushNotifications, refreshFcmToken } = await import("@/lib/push");
        const alreadyEnabled = await areNotificationsEnabled(user.id);

        if (!alreadyEnabled) {
          // Chiedi il permesso — se l'utente risponde "nega" non torneremo a chiedere
          // (il controllo `Notification.permission === "denied"` sopra lo gestisce)
          await enablePushNotifications(user.id);
        } else {
          // Aggiorna token ogni 7 giorni
          const { getDoc, doc } = await import("firebase/firestore");
          const { db } = await import("@/lib/firebase");
          const snap = await getDoc(doc(db, "users", user.id));
          const lastUpdate = snap.data()?.notificationSettings?.lastTokenUpdate?.toDate?.();
          const daysSince = lastUpdate
            ? (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
            : 999;
          if (daysSince > 7) await refreshFcmToken(user.id);
        }
      } catch {
        // Silenzioso — le notifiche non sono critiche
      }
    };

    const timer = setTimeout(registerNotifications, 3000);
  
    return () => clearTimeout(timer);
  }, [user?.id]);

useEffect(() => {
  if (!user?.id || user?.filterSettings) return; // Già configurato
  
  const initializeFilters = async () => {
    try {
      await updateDoc(doc(db, "users", user.id), {
        filterSettings: DEFAULT_FILTER_SETTINGS,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.warn("⚠️ Impossibile inizializzare filterSettings:", error);
    }
  };
  
  initializeFilters();
}, [user?.id, user?.filterSettings]);

  const { todayQuery, completeDayMutation } = useTasks();
  const { showTour, markSectionDone, restartTour } = useTour("dashboard");
  const [kpiOpen, setKpiOpen] = useState(false);
  const [celebrateOpen, setCelebrateOpen] = useState(false);
  // Traccia se il KPI dialog è già stato mostrato in questa sessione
  // (evita che si riapra ad ogni refetch o refresh della pagina)
  const kpiShownThisSession = useRef(false);

  const { data, isLoading } = todayQuery;

  const day = user?.currentDay ?? 1;

  const deferralsQuery = useQuery({
    queryKey: ["deferrals", user?.id, day],
    enabled: !!user?.id && !!day,
    queryFn: () => getDeferrals(user!.id, day),
  });
  
  const promos = (data?.meta?.promos ?? []) as any[];

  useEffect(() => {
    // Apre il KPI dialog solo se:
    // 1. Non è già stato mostrato in questa sessione
    // 2. Il primo task è di tipo KPI e non è ancora Done
    if (kpiShownThisSession.current) return;
    const first = data?.tasks?.[0];
    if (first?.task_type === "KPI" && first?.status !== "Done") {
      kpiShownThisSession.current = true;
      setKpiOpen(true);
    }
  }, [data?.tasks]);

  const err = todayQuery.error as any;

 // ✅ CALCOLO SICURO (solo per il trigger, non rompe i return)
  const earlyCompletedCount = (data?.tasks || [])
    .filter((t: any) => t.status === "Done")
    .length;

  // ✅ Monetizzazione value-gating
 // ✅ HOOK DEVE ESSERE CHIAMA QUI (prima di qualsiasi return condizionale)
  const { showProPrompt, dismissProPrompt, triggerMessage } = useMonetizationTriggers(user, earlyCompletedCount); 

  if (todayQuery.isError) {
// TEMP    return <div>Errore caricamento: {(todayQuery.error as any)?.message}</div>;
//    return <div>{String((todayQuery.error as any)?.message || todayQuery.error)}</div>

    const isProRequired =
      err?.code === "PRO_REQUIRED" ||
      err?.message === "PRO_REQUIRED" ||
      err?.status === 402;

    if (isProRequired) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-2">🔒 Accesso PRO richiesto</h2>
            <p className="text-slate-600 mb-4">
              Dal giorno 31 in avanti il percorso è disponibile solo con piano PRO.
            </p>

            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => (window.location.href = "/pro")}
            >
              Passa a PRO
            </Button>

            <p className="text-xs text-slate-400 mt-3">
              Errore: {String(err?.message || "PRO_REQUIRED")}
            </p>
          </div>
        </div>
      ); 
    }
    // altri errori veri
    return (
      <div className="p-6 text-red-600">
        Errore: {String(err?.message || err)}
      </div>
    );
  }

// Calcola metriche progresso
  const progressMetrics = useMemo(() => {
    const tasks = todayQuery.data?.tasks || [];
    const completedIds = tasks
      .filter((t: any) => t.status === "Done")
      .map((t: any) => t.task_id);

    return calculateProgressMetrics(
      tasks,
      user?.onboarding,
      completedIds,
      user?.currentDay || 1
    );
  }, [todayQuery.data?.tasks, user?.onboarding, user?.currentDay]);


  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <div className="flex-1 p-8 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const hidden = new Set(deferralsQuery.data?.hiddenTaskIds ?? []);
  const carryOver = deferralsQuery.data?.carryOver ?? [];

  const baseTasks = (todayQuery.data?.tasks ?? []).filter((t: any) => !hidden.has(t.task_id));

// i carryOver li metto in cima e li marco come "virtuali"
  const injectedTasks = carryOver.map((c: any) => ({
    ...c.taskSnapshot,
    __injected: true,
    __carryOriginalTaskId: c.originalTaskId, // ✅ ID della riga carryOver
  }));

  const allTasks = [...injectedTasks, ...baseTasks];

const tasksForUI = filterTasks(
  allTasks,
//  user?.filterSettings,  // Legge da Firestore
  localFilterSettings || user?.filterSettings,  // ← Priorità ai settings locali aggiornati
  {
    // Profilo utente per matching (fallback)
    experienceLevel: user?.experienceLevel,
    platforms: user?.platforms,
    salesTypes: user?.salesTypes,
    mainGoal: user?.mainGoal,
  }

);

  // Calculate progress
//  const totalTasks = data?.tasks.length || 0;
  const totalTasks = tasksForUI.length || 0;

//    data?.tasks.filter(
  const completedTasks =
    tasksForUI.filter(
      (t: any) => t.status === "Done" || t.status === "Skipped",
    ).length || 0;
  
  const isAllComplete = totalTasks > 0 && totalTasks === completedTasks;
  const progress = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;


//const kpiTask = data?.tasks?.find((t: any) => t.task_type === "KPI");
  const kpiTask = tasksForUI?.find((t: any) => t.task_type === "KPI");

  const kpiDone = kpiTask?.status === "Done";

//const lockedAfterKpi = Boolean(data?.meta?.lockedAfterKpi);
  const lockedAfterKpi = Boolean(data?.meta?.lockedAfterKpi) && kpiDone;


  const handleDayComplete = () => {
    if (isAllComplete) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
//      setKpiOpen(true);
      setCelebrateOpen(true);
    }
  };

  const isProRequiredError = (e: any) =>
    e?.code === "PRO_REQUIRED" ||
    e?.message === "PRO_REQUIRED" ||
    e?.status === 402;

  const upgradeUrl = data?.meta?.upgradeUrl || "/pro";
  const lockMessage = data?.meta?.lockMessage || "Per proseguire serve PRO.";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navigation />

      <main className="flex-1 md:ml-0 pb-24 md:pb-8 landscape:pb-4 overflow-x-hidden min-w-0">
        <header className="sticky top-0 z-40 bg-slate-60/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <div> 
{/*            <h2 className="text-2xl font-display font-bold text-slate-900"> */}
{/*              Giorno {user.currentDay} */}
{/*            </h2> */}

      {/* 📅 Giorno corrente (mobile) */}
{/*      <div className="hidden md:block md:bg-indigo-100 px-3 py-1.5 rounded-full border border-indigo-100">  */}
      <div className="hidden md:block md:bg-indigo-100 px-3 py-1.5 border text-center border-indigo-100"> 
        <span className="text-xs font-bold text-indigo-900">Giorno {user.currentDay}</span>
      </div>
            <p className="text-sm text-slate-500 font-medium">
              {new Date().toLocaleDateString("it-IT", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
         </div>

{/* ✅ NUOVO HEADER CON PROGRESS INTEGRATO */}
<HeaderProgress 
  metrics={progressMetrics}
  credits={user?.creditsBalance || 0}
  plan={user?.plan || 'FREE'}
  currentDay={user?.currentDay || 1}
  progress={progress || 0}
/>

{/*            <div className="bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-2"> */}
{/*              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" /> */}
{/*              <span className="font-bold text-slate-700"> */}
{/*                {user.creditsBalance} */}
{/*              </span> */}
{/*              <span className="text-xs text-slate-400 uppercase font-semibold"> */}
{/*                Crediti */}
{/*              </span> */}
{/*            </div> */}

{/*      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
        <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
        <div className="flex flex-col items-end"> */}

{/*            <div className="hidden md:flex flex-col items-end mr-4"> */}
{/*              <span className="text-xs font-bold uppercase text-slate-400"> */}
{/*                Progresso Giornaliero */}
{/*              </span> */}
{/*              <span className="text-[10px] font-bold text-slate-400 uppercase">Progresso Giornaliero</span>
              <div className="w-32 h-2 bg-slate-200 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>  
</div> */}


{/*            <div className="bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-2"> */}
{/*              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" /> */}
{/*              <span className="font-bold text-slate-700">{user.plan}</span> */}
{/*              <span className="text-xs text-slate-400 uppercase font-semibold"> */}
{/*                Piano Utente */}
{/*              </span> */}
{/*            </div>  */}


{/* Mobile hamburger */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button className="bg-white px-3 py-2 rounded-full border border-slate-200 shadow-sm">
                  <Menu className="w-5 h-5 text-slate-700" />
                </button>
              </SheetTrigger>

              <SheetContent side="right" className="w-[320px]">
                <SheetHeader>
                  <SheetTitle>Account</SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-4">
        {/* Brand + Giorno */}
                  <div className="flex items-center gap-2">
{/*                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                      WS
                    </div> */}
<a href="https://www.webstudioams.it" target="_blank" className="flex items-center gap-2">
<div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
      <img src="./icons/wsams-512.png" 
          alt="Logo WebStudioAMS" 
          className="w-full h-full object-contain"
      />
  </div>
                    <span className="font-display font-bold text-lg tracking-tight">
                      WebStudioAMS
                    </span>
</a>
                  </div>

                  <div className="px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mb-1">
                      Giorno Corrente
                    </p>
                    <p className="text-2xl font-bold text-indigo-900">
                      Giorno {user.currentDay}
                    </p>
                  </div>

        {/* Utente */}
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <UserCircle className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-slate-900">
                        {user.email}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {user.plan} Plan
                      </p>
                    </div>
                  </div>

        {/* Sign out */}
                  <button
                    onClick={() => logoutMutation.mutateAsync()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>


        </header>

        <div className="p-3 md:p-8 max-w-5xl mx-auto space-y-4 md:space-y-6">

          {/* Motivation Banner — dinamico e personalizzato */}
          {(() => {
            const { title, message } = getMotivationalMessage(
              user,
              completedTasks,
              totalTasks,
              progressMetrics
            );
            return (
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 md:p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">{title}</h2>
                  <p className="text-indigo-100 max-w-xl">{message}</p>
                </div>
                <Trophy className="absolute right-4 bottom-[-20px] w-40 h-40 text-white opacity-10 rotate-12" />
              </div>
            );
          })()}
{/*
 <FilterSettings 
  onFiltersChanged={(newSettings) => {
    setLocalFilterSettings(newSettings);
    todayQuery.refetch();
  }} 
 />
*/}

          {/* Banner promos TOP — WELCOME in verde, PRO in indigo */}
          {promos.filter(p => p.placement === "TOP").map((p) => {
            const isWelcome = p.kind === "WELCOME";
            const isPromo = p.kind === "PRO";
            return (
              <div
                key={p.id}
                className={`rounded-2xl p-5 md:p-6 shadow-lg relative overflow-hidden ${
                  isWelcome
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-200"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
                  <div className="min-w-0">
                    <p className="font-bold text-white text-base md:text-lg leading-snug">
                      {p.title}
                    </p>
                    <p className={`text-sm mt-1 ${isWelcome ? "text-emerald-100" : "text-indigo-100"}`}>
                      {p.text}
                    </p>
                  </div>
                  <Button
                    className={`flex-shrink-0 font-bold shadow-sm ${
                      isWelcome
                        ? "bg-white text-emerald-700 hover:bg-emerald-50"
                        : "bg-white/20 hover:bg-white/30 text-white border border-white/30"
                    }`}
                    onClick={() => (window.location.href = p.ctaUrl)}
                  >
                    {p.ctaLabel}
                  </Button>
                </div>
                {/* Cerchio decorativo */}
                <div className="absolute right-[-24px] bottom-[-24px] w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
              </div>
            );
          })}

          {/* Task List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Piano d'Azione di Oggi
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">
                  {totalTasks}
                </span>
              </h3>
            </div>

             {tasksForUI.map((task: any) => (
              <TaskCard key={(task.__injected ? "inj-" : "") + task.task_id} task={task} 
                onCompleteClick={(t: any) => {
                  // Se è KPI, apri la modale (solo se non è già Done)
                 if (t?.task_type === "KPI" && t?.status !== "Done") {
                   setKpiOpen(true);
                   return;
                 }
                 // Altrimenti lascia che TaskCard gestisca normalmente (o gestiscilo qui se preferisci)
                }}
              />
            ))}


            {/* Mostra messaggio se tutti i task sono filtrati */}
            {tasksForUI.length === 0 && allTasks.length > 0 && (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed">
                <p className="font-medium">Nessun task corrisponde ai tuoi filtri</p>
                <p className="text-sm mt-1">Prova a disabilitare qualche filtro nelle impostazioni</p>
              </div>
            )}

            {allTasks.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <p>Nessuna attività per oggi. Goditi il riposo!</p>
              </div>
            )}
          </div>


          {promos.filter(p => p.placement === "BOTTOM").map((p) => (
            <div key={p.id} className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">{p.title}</h2> 
                <p className="text-indigo-100 max-w-xl">{p.text}</p>
              </div>

                <Button
                  className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => (window.location.href = p.ctaUrl)}
                >
                  {p.ctaLabel} 
                </Button>
            </div>
          ))}

          {/* Complete Day Button — nel flusso del documento, non sticky */}
          {/* pb-6 md:pb-0: spazio extra per non sovrapporsi alla navbar bottom su mobile */}
          <div className="flex justify-center pt-2 pb-6 md:pb-2">
            <Button
              size="lg"
              onClick={handleDayComplete}
              disabled={!isAllComplete}
              className={clsx(
                "rounded-full px-8 py-6 text-lg font-bold shadow-2xl transition-all transform hover:-translate-y-1 w-full max-w-sm",
                isAllComplete
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed",
              )}
            >
              {isAllComplete ? (
                <>
                  <CheckCircle2 className="w-6 h-6 mr-2" />
                  Completa Giorno {user.currentDay}
                </>
              ) : (
                `Completa ${completedTasks}/${totalTasks} Attività`
              )}
            </Button>
          </div>
	  <div className="space-y-4">
            <button
              onClick={restartTour}
              title="Rivedi il tour guidato"
              className="w-full flex items-center justify-center gap-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium py-1 hover:underline transition-colors" >
              <PlayCircle className="w-3.5 h-3.5" /> Rivedi il tour guidato della Dashboard
            </button>
          </div>

        </div>
      </main>


      <KPIDialog open={kpiOpen} onOpenChange={setKpiOpen} todayDay={user.currentDay} kpiForDay={Math.max(1, user.currentDay - 1)} onSaved={() => todayQuery.refetch()} />


      <Dialog open={celebrateOpen} onOpenChange={setCelebrateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>🎉 Congratulazioni!</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-slate-600">
            Hai completato tutte le attività del giorno. Premi il tasto per passare al giorno successivo di attività!
          </p>

          <DialogFooter>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={completeDayMutation.isPending}
              onClick={async () => {
      	        try {
                  await completeDayMutation.mutateAsync();
                  setCelebrateOpen(false);
                  await todayQuery.refetch(); // ricarica giorno

                } catch (e: any) {
                  if (isProRequiredError(e)) {
    // opzione A: redirect
                    window.location.href = "/pro";
                    return;
                  }
                  console.error("Complete day failed:", e);
                }
              }}
            >
              Vai al giorno successivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ PRO VALUE PREVIEW (appare dopo 3 task completati) */}
      {showProPrompt && (
        <ProValuePreview
          triggerMessage={triggerMessage}
          ctaLabel="Sblocca PRO e accelera →"
          ctaUrl="/pro"
          onClose={dismissProPrompt}
          benefits={[
            { icon: "📊", title: "Analytics avanzati", desc: "Scopri quali task portano più follower e engagement" },
            { icon: "🤖", title: "AI illimitata", desc: "Genera contenuti senza limiti di crediti giornalieri" },
            { icon: "⚡", title: "Auto-scheduler", desc: "Pianifica 7 giorni di attività in 30 secondi" }
          ]}
        />
      )}

      {/* ── Product Tour Dashboard ── */}
      {showTour && user && (
        <ProductTour
          steps={getDashboardSteps({
            firstName: user.firstName,
            activityType: user.onboarding?.activityType,
            platform: user.onboarding?.platform,
            goal: user.onboarding?.goal,
            targetFollowers: user.onboarding?.targetFollowers,
            currentFollowers: user.onboarding?.currentFollowers,
            targetMonths: user.onboarding?.targetMonths,
            creditsBalance: user.creditsBalance,
            currentDay: user.currentDay,
            plan: user.plan,
          })}
          onComplete={markSectionDone}
          onSkip={markSectionDone}
        />
      )}

    </div>

  );
}
