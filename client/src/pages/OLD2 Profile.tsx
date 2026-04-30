import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import {
  User, Mail, Lock, Target, Globe, Briefcase,
  TrendingUp, Edit3, Check, X, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";
import { clsx } from "clsx";

// Sezione collassabile
function Section({
  title, icon, children, defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            {icon}
          </div>
          <span className="font-semibold text-slate-900">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-6 pb-6 pt-2 space-y-4 border-t border-slate-100">{children}</div>}
    </div>
  );
}

// Campo read-only con badge
function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</Label>
      <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700 min-h-[38px]">
        {value || <span className="text-slate-400 italic">Non impostato</span>}
      </div>
    </div>
  );
}

// Badge array (per piattaforme, productType)
function TagList({ values }: { values: string[] }) {
  if (!values || values.length === 0) return <span className="text-slate-400 italic text-sm">Nessuno</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((v) => (
        <span key={v} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100">
          {v}
        </span>
      ))}
    </div>
  );
}

export default function Profile() {
  const { user, updateProfileMutation, updateEmailMutation, updatePasswordMutation } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  // --- Dati personali ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // --- Sicurezza ---
  const [newEmail, setNewEmail] = useState("");
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  // --- Obiettivo (editabile senza rifar l'onboarding) ---
  const [targetFollowers, setTargetFollowers] = useState("");
  const [currentFollowers, setCurrentFollowers] = useState("");
  const [targetMonths, setTargetMonths] = useState("");

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setBrandName(user.brandName ?? "");
    setWebsiteUrl(user.websiteUrl ?? "");
    setNewEmail(user.email ?? "");
    setTargetFollowers(String(user.onboarding?.targetFollowers ?? ""));
    setCurrentFollowers(String(user.onboarding?.currentFollowers ?? ""));
    setTargetMonths(String(user.onboarding?.targetMonths ?? ""));
  }, [user]);

  // --- Handlers ---
  const savePersonal = async () => {
    try {
      await updateProfileMutation.mutateAsync({ firstName, lastName });
      // Salva anche brandName e websiteUrl che non sono in use-auth
      const auth = getAuth();
      if (auth.currentUser) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          brandName, websiteUrl, updatedAt: serverTimestamp(),
        });
        qc.invalidateQueries({ queryKey: [api.auth.user.path] });
      }
      toast({ title: "Profilo aggiornato ✓" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Errore", description: e.message });
    }
  };

  const saveEmail = async () => {
    if (!newEmail.trim() || !currentPasswordForEmail) {
      toast({ variant: "destructive", title: "Compila tutti i campi" });
      return;
    }
    try {
      await updateEmailMutation.mutateAsync({ newEmail, currentPassword: currentPasswordForEmail });
      toast({ title: "Email aggiornata ✓" });
      setCurrentPasswordForEmail("");
    } catch (e: any) {
      const msg = e.code === "auth/wrong-password" || e.code === "auth/invalid-credential"
        ? "Password attuale non corretta"
        : e.code === "auth/requires-recent-login"
        ? "Sessione scaduta — effettua il logout e rientra, poi riprova"
        : e.message;
      toast({ variant: "destructive", title: "Errore", description: msg });
    }
  };

  const savePassword = async () => {
    if (newPassword !== newPassword2) {
      toast({ variant: "destructive", title: "Le password non coincidono" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "La password deve essere di almeno 6 caratteri" });
      return;
    }
    try {
      await updatePasswordMutation.mutateAsync({ currentPassword, newPassword });
      toast({ title: "Password aggiornata ✓" });
      setCurrentPassword("");
      setNewPassword("");
      setNewPassword2("");
    } catch (e: any) {
      const msg = e.code === "auth/wrong-password" || e.code === "auth/invalid-credential"
        ? "Password attuale non corretta"
        : e.code === "auth/requires-recent-login"
        ? "Sessione scaduta — effettua il logout e rientra, poi riprova"
        : e.message;
      toast({ variant: "destructive", title: "Errore", description: msg });
    }
  };

  const saveGoal = async () => {
    const tf = Number(targetFollowers);
    const cf = Number(currentFollowers);
    const tm = Number(targetMonths);
    if (tf <= 0 || tm <= 0) {
      toast({ variant: "destructive", title: "Inserisci valori validi" });
      return;
    }
    try {
      const auth = getAuth();
      if (!auth.currentUser) throw new Error("Non autenticato");
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        "onboarding.currentFollowers": cf,
        "onboarding.targetFollowers": tf,
        "onboarding.targetMonths": tm,
        updatedAt: serverTimestamp(),
      });
      qc.invalidateQueries({ queryKey: [api.auth.user.path] });
      toast({ title: "Obiettivo aggiornato ✓" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Errore", description: e.message });
    }
  };

  // Piano e trial
  const plan = user?.plan ?? "FREE";
  const trialEndsAt = user?.trialEndsAt;
  const trialEndDate = trialEndsAt
    ? new Date(typeof trialEndsAt.toMillis === "function" ? trialEndsAt.toMillis() : trialEndsAt)
    : null;
  const daysLeftInTrial = trialEndDate
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const onb = user?.onboarding;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navigation />

      <main className="flex-1 pb-24 md:pb-8">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-5">
          <h1 className="text-xl font-bold text-slate-900">Il mio profilo</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Giorno {user?.currentDay ?? 1} · {plan}
            {daysLeftInTrial !== null && plan === "TRIAL" && (
              <span className="ml-2 text-amber-600 font-medium">
                · {daysLeftInTrial} giorni rimanenti al trial
              </span>
            )}
          </p>
        </div>

        <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-4">

          {/* ── DATI PERSONALI ── */}
          <Section title="Dati personali" icon={<User className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Il tuo nome" />
              </div>
              <div className="space-y-1.5">
                <Label>Cognome</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Il tuo cognome" />
              </div>
              <div className="space-y-1.5">
                <Label>Nome brand / progetto</Label>
                <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Es. Studio Rossi, FitCoach Marco..." />
              </div>
              <div className="space-y-1.5">
                <Label>Sito web o link bio</Label>
                <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <Button
              onClick={savePersonal}
              disabled={updateProfileMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Salva dati personali
            </Button>
          </Section>

          {/* ── OBIETTIVO (editabile) ── */}
          <Section title="Il mio obiettivo" icon={<Target className="w-4 h-4" />}>
            <p className="text-xs text-slate-500">
              Aggiorna il tuo traguardo senza dover rifare l'onboarding. Le metriche di progresso si ricalcolano automaticamente.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Follower attuali</Label>
                <Input
                  type="number" min="0"
                  value={currentFollowers}
                  onChange={(e) => setCurrentFollowers(e.target.value)}
                  placeholder="Es. 340"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Obiettivo follower</Label>
                <Input
                  type="number" min="1"
                  value={targetFollowers}
                  onChange={(e) => setTargetFollowers(e.target.value)}
                  placeholder="Es. 2000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Timeframe (mesi)</Label>
                <Input
                  type="number" min="1" max="36"
                  value={targetMonths}
                  onChange={(e) => setTargetMonths(e.target.value)}
                  placeholder="Es. 3"
                />
              </div>
            </div>
            {/* Feedback in tempo reale */}
            {Number(targetFollowers) > 0 && Number(targetMonths) > 0 && (
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-xs text-indigo-700 font-medium">
                ~{Math.ceil((Number(targetFollowers) - Number(currentFollowers)) / Number(targetMonths)).toLocaleString("it-IT")} follower/mese necessari
              </div>
            )}
            <Button onClick={saveGoal} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Check className="w-4 h-4 mr-2" />
              Aggiorna obiettivo
            </Button>
          </Section>

          {/* ── DATI ONBOARDING (read-only, con link a modifica) ── */}
          <Section title="Impostazioni percorso" icon={<Briefcase className="w-4 h-4" />} defaultOpen={false}>
            <p className="text-xs text-slate-500 mb-2">
              Questi dati guidano i task e i contenuti AI. Per cambiarli in modo completo,{" "}
              <a href="/onboarding" className="text-indigo-600 underline">rifai l'onboarding</a>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReadOnlyField label="Tipo di attività" value={onb?.activityType ?? ""} />
              <ReadOnlyField label="Obiettivo principale" value={
                Array.isArray(onb?.goal) ? onb.goal.join(", ") : (onb?.goal ?? "")
              } />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Piattaforme</Label>
              <TagList values={onb?.platform ?? []} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cosa promuovi</Label>
              <TagList values={onb?.productType ?? []} />
            </div>
          </Section>

          {/* ── SICUREZZA ── */}
          <Section title="Sicurezza" icon={<Lock className="w-4 h-4" />} defaultOpen={false}>

            {/* Email */}
            <div className="space-y-3 pb-4 border-b border-slate-100">
              <p className="text-sm font-medium text-slate-700">Cambia email</p>
              <ReadOnlyField label="Email attuale" value={user?.email ?? ""} />
              <div className="space-y-1.5">
                <Label>Nuova email</Label>
                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="nuova@email.it" />
              </div>
              <div className="space-y-1.5">
                <Label>Password attuale (richiesta per conferma)</Label>
                <Input type="password" value={currentPasswordForEmail} onChange={(e) => setCurrentPasswordForEmail(e.target.value)} placeholder="••••••••" />
              </div>
              <Button
                onClick={saveEmail}
                disabled={updateEmailMutation.isPending}
                variant="outline"
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                {updateEmailMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                Aggiorna email
              </Button>
            </div>

            {/* Password */}
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-slate-700">Cambia password</p>
              <div className="space-y-1.5">
                <Label>Password attuale</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nuova password</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="min. 6 caratteri" />
                </div>
                <div className="space-y-1.5">
                  <Label>Conferma password</Label>
                  <Input
                    type="password"
                    value={newPassword2}
                    onChange={(e) => setNewPassword2(e.target.value)}
                    placeholder="••••••••"
                    className={clsx(newPassword2 && newPassword !== newPassword2 && "border-red-300 focus-visible:ring-red-400")}
                  />
                  {newPassword2 && newPassword !== newPassword2 && (
                    <p className="text-xs text-red-500 flex items-center gap-1"><X className="w-3 h-3" /> Non coincidono</p>
                  )}
                </div>
              </div>
              <Button
                onClick={savePassword}
                disabled={updatePasswordMutation.isPending || (!!newPassword2 && newPassword !== newPassword2)}
                variant="outline"
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                {updatePasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                Cambia password
              </Button>
            </div>
          </Section>

          {/* ── PIANO ── */}
          <Section title="Piano e crediti" icon={<TrendingUp className="w-4 h-4" />} defaultOpen={false}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Piano", value: plan },
                { label: "Giorno corrente", value: `${user?.currentDay ?? 1}` },
                { label: "Crediti", value: `${user?.creditsBalance ?? 0}` },
                { label: "Trial scade", value: trialEndDate ? trialEndDate.toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-lg font-bold text-slate-900">{value}</p>
                </div>
              ))}
            </div>
            {plan !== "PRO" && (
              <a href="/pro">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-2">
                  Passa a PRO →
                </Button>
              </a>
            )}
          </Section>

        </div>
      </main>
    </div>
  );
}

