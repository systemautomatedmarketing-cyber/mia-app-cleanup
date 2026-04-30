import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Loader2, Eye, EyeOff, Check, TrendingUp,
  Zap, Shield, Target, Star,
} from "lucide-react";
import { isPromoActive, ACTIVE_PROMO, PROMO_PRICES, FULL_PRICES } from "@/lib/promo-config";
import { motion } from "framer-motion";
import { TermsDialog, PrivacyDialog, ConsentCheckbox } from "@/components/LegalDialogs";

// ── Validazione password ────────────────────────────────────────────────────
function getPasswordStrength(pwd: string): {
  score: number; // 0-4
  label: string;
  color: string;
  bg: string;
} {
  if (pwd.length === 0) return { score: 0, label: "", color: "", bg: "" };
  let score = 0;
  if (pwd.length >= 6)  score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9!@#$%^&*]/.test(pwd)) score++;

  const levels = [
    { label: "Troppo corta",  color: "text-red-600",    bg: "bg-red-500"    },
    { label: "Debole",        color: "text-orange-600",  bg: "bg-orange-400" },
    { label: "Discreta",      color: "text-amber-600",   bg: "bg-amber-400"  },
    { label: "Buona",         color: "text-emerald-600", bg: "bg-emerald-500"},
    { label: "Ottima",        color: "text-emerald-700", bg: "bg-emerald-600"},
  ];
  return { score, ...levels[score] };
}

// ── Componente campo password con toggle visibilità ─────────────────────────
function PasswordInput({
  id, value, onChange, placeholder = "••••••••", showStrength = false,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  showStrength?: boolean;
}) {
  const [show, setShow] = useState(false);
  const strength = getPasswordStrength(value);

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
          required
          minLength={6}
          autoComplete={id.includes("confirm") ? "new-password" : id.includes("reg") ? "new-password" : "current-password"}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label={show ? "Nascondi password" : "Mostra password"}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {showStrength && value.length > 0 && (
        <div className="space-y-1">
          {/* Barra forza */}
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i <= strength.score ? strength.bg : "bg-slate-200"
                }`}
              />
            ))}
          </div>
          <p className={`text-xs font-medium ${strength.color}`}>
            Password {strength.label}
            {strength.score < 2 && " — usa almeno 6 caratteri"}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Lato marketing (desktop) ────────────────────────────────────────────────
function MarketingSide() {
  const promoOn = isPromoActive();

  const benefits = [
    { icon: Target,     text: "Piano personalizzato basato sul tuo obiettivo" },
    { icon: Zap,        text: "Task giornalieri generati dall'AI" },
    { icon: TrendingUp, text: "Crescita misurabile giorno per giorno" },
    { icon: Shield,     text: "Percorso da 30, 60 o 90 giorni" },
  ];

  return (
    <div className="lg:flex flex-col justify-center px-10 py-12 bg-gradient-to-br from-indigo-600 to-purple-700 text-white relative overflow-hidden">

      {/* Sfere decorative */}
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/10 rounded-full" />

      <div className="relative z-10 space-y-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src="/icons/icon-192.png" alt="Social Growth Engine" className="w-10 h-10 rounded-xl object-cover" />
          <span className="text-xl font-display font-bold">Social Growth Engine</span>
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h2 className="text-3xl font-display font-bold leading-tight">
            Cresci sui social<br />con un piano reale.
          </h2>
          <p className="text-indigo-100 text-sm leading-relaxed">
            Non un corso. Non una teoria. Un percorso guidato con task specifici
            generati dall'AI per il tuo profilo e il tuo obiettivo.
          </p>
        </div>

        {/* Benefit list */}
        <ul className="space-y-3">
          {benefits.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm text-indigo-50">{text}</span>
            </li>
          ))}
        </ul>

        {/* Promo badge */}
        {promoOn && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-400/20 border border-amber-300/40 rounded-2xl px-4 py-3 space-y-1"
          >
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span className="text-amber-200 text-xs font-bold uppercase tracking-wide">
                {ACTIVE_PROMO.badge}
              </span>
            </div>
            <p className="text-white text-sm font-semibold">
              PRO a {PROMO_PRICES.pro} invece di {FULL_PRICES.pro}
            </p>
            <p className="text-amber-200 text-xs">{ACTIVE_PROMO.reason}</p>
          </motion.div>
        )}

        {/* Social proof placeholder */}
        <p className="text-indigo-200 text-xs">
          🔒 I tuoi dati sono al sicuro. Nessuna carta di credito richiesta per iniziare.
        </p>
      </div>
    </div>
  );
}

// ── Pagina principale ────────────────────────────────────────────────────────
export default function AuthPage() {
  const { loginMutation, registerMutation, resetPasswordMutation } = useAuth();
  const { toast } = useToast();

  // State SEPARATI per login e registrazione — non si contaminano tra tab
  const [loginEmail, setLoginEmail]       = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regEmail, setRegEmail]           = useState("");
  const [regPassword, setRegPassword]     = useState("");
  const [regConfirm, setRegConfirm]       = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);

  const [resetOpen, setResetOpen]         = useState(false);
  const [resetEmail, setResetEmail]       = useState("");

  const passwordsMatch = regPassword === regConfirm;
  const regStrength    = getPasswordStrength(regPassword);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginMutation.mutateAsync({ email: loginEmail.trim().toLowerCase(), password: loginPassword });
    } catch (err: any) {
      const msg = err.code === "auth/invalid-credential" || err.code === "auth/wrong-password"
        ? "Email o password non corretti. Riprova."
        : err.code === "auth/too-many-requests"
          ? "Troppi tentativi. Attendi qualche minuto o reimposta la password."
          : err.message;
      toast({ variant: "destructive", title: "Accesso fallito", description: msg });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regStrength.score < 1) {
      toast({ variant: "destructive", title: "Password troppo corta", description: "Usa almeno 6 caratteri." });
      return;
    }
    if (!passwordsMatch) {
      toast({ variant: "destructive", title: "Le password non coincidono", description: "Ricontrolla la conferma password." });
      return;
    }
    if (!consentAccepted) {
      toast({ variant: "destructive", title: "Consenso richiesto", description: "Devi accettare i Termini di Servizio e la Privacy Policy per continuare." });
      return;
    }
    try {
      await registerMutation.mutateAsync({ email: regEmail.trim().toLowerCase(), password: regPassword });
    } catch (err: any) {
      const msg = err.code === "auth/email-already-in-use"
        ? "Questa email è già registrata. Prova ad accedere."
        : err.code === "auth/invalid-email"
          ? "Formato email non valido."
          : err.message;
      toast({ variant: "destructive", title: "Registrazione fallita", description: msg });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToUse = (resetEmail || loginEmail).trim().toLowerCase();
    if (!emailToUse) {
      toast({ variant: "destructive", title: "Inserisci la tua email", description: "Scrivi l'email nel campo qui sopra." });
      return;
    }
    try {
      await resetPasswordMutation.mutateAsync({ email: emailToUse });
      toast({
        title: "Email inviata ✓",
        description: (
          <span>
            Controlla la posta per {emailToUse} —{" "}
            <span className="font-semibold text-indigo-600">anche nella cartella Spam</span>.
          </span>
        ),
      });
      setResetOpen(false);
      setResetEmail("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Errore", description: err.message || "Impossibile inviare l'email." });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 lg:p-0 relative overflow-hidden">
      {/* Background blobs su mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none lg:hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        <div className="absolute top-0 -right-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        <div className="absolute -bottom-20 left-20 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25" />
      </div>

      {/* Layout: colonna destra su mobile, 2 colonne su desktop */}
      <div className="relative z-10 w-full max-w-5xl lg:h-screen lg:max-h-[780px] lg:grid lg:grid-cols-2 lg:rounded-3xl lg:shadow-2xl lg:overflow-hidden lg:border lg:border-slate-200">

        {/* ── Lato sinistro: form ── */}
        <div className="flex flex-col justify-center bg-white px-6 py-8 md:px-10 overflow-y-auto">

          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img src="/icons/icon-192.png" alt="Social Growth Engine" className="w-10 h-10 rounded-xl object-cover shadow-lg" />
            <span className="text-xl font-display font-bold text-slate-900">Social Growth Engine</span>
          </div>

          {/* Titolo */}
          <div className="mb-6">
            <h1 className="text-2xl font-display font-bold text-slate-900">Bentornato</h1>
            <p className="text-slate-500 text-sm mt-1">Il tuo piano di crescita ti aspetta.</p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Accedi</TabsTrigger>
              <TabsTrigger value="register">Crea account</TabsTrigger>
            </TabsList>

            {/* ── LOGIN ── */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="tu@esempio.it"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <Dialog open={resetOpen} onOpenChange={(o) => {
                      setResetOpen(o);
                      if (o) setResetEmail(loginEmail);
                    }}>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                          Password dimenticata?
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reimposta la password</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleResetPassword} className="space-y-4 mt-2">
                          <div className="space-y-1.5">
                            <Label htmlFor="reset-email">La tua email</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="tu@esempio.it"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              required
                            />
                            <p className="text-xs text-slate-500">
                              Riceverai un link per scegliere una nuova password.
                            </p>
                          </div>
                          <Button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                            disabled={resetPasswordMutation.isPending}
                          >
                            {resetPasswordMutation.isPending
                              ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              : null}
                            Invia link
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <PasswordInput
                    id="login-password"
                    value={loginPassword}
                    onChange={setLoginPassword}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 font-semibold"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    : null}
                  Accedi
                </Button>
              </form>
            </TabsContent>

            {/* ── REGISTRAZIONE ── */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="tu@esempio.it"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-password">Password</Label>
                  <PasswordInput
                    id="reg-password"
                    value={regPassword}
                    onChange={setRegPassword}
                    showStrength
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-confirm">Conferma password</Label>
                  <PasswordInput
                    id="reg-confirm"
                    value={regConfirm}
                    onChange={setRegConfirm}
                  />
                  {regConfirm.length > 0 && (
                    <p className={`text-xs flex items-center gap-1 font-medium ${
                      passwordsMatch ? "text-emerald-600" : "text-red-500"
                    }`}>
                      {passwordsMatch
                        ? <><Check className="w-3 h-3" /> Le password coincidono</>
                        : "Le password non coincidono"}
                    </p>
                  )}
                </div>

                {/* Vantaggi iscrizione */}
                <div className="bg-indigo-50 rounded-xl px-4 py-3 space-y-1.5 text-xs text-indigo-800">
                  <p className="font-semibold">Cosa ottieni subito:</p>
                  <ul className="space-y-1">
                    {[
                      "30 giorni di accesso gratuito",
                      "Piano AI personalizzato basato sui tuoi obiettivi",
                      "Task giornalieri per crescere sui social",
                    ].map((v) => (
                      <li key={v} className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                        {v}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 font-semibold"
                  disabled={registerMutation.isPending || !passwordsMatch || regStrength.score < 1 || !consentAccepted}
                >
                  {registerMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    : null}
                  Crea il mio account gratuito
                </Button>

                <ConsentCheckbox
                  accepted={consentAccepted}
                  onChange={setConsentAccepted}
                />
              </form>
            </TabsContent>
          </Tabs>
        </div>
        {/* ── Lato destro marketing (solo desktop / in basso per mobile) ── */}
        <MarketingSide />
      </div>
    </div>
  );
}
