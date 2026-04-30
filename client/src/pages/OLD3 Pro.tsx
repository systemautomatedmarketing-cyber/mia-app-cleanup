import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Zap, Shield, Clock, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/lib/api";

const FEATURES = [
  { icon: Zap, text: "Generazione AI illimitata", detail: "Nessun limite di crediti per i contenuti" },
  { icon: TrendingUp, text: "Percorso 60 e 90 giorni", detail: "Task avanzati per chi vuole crescere di più" },
  { icon: Shield, text: "Supporto prioritario", detail: "Risposta entro 24h via email" },
  { icon: Clock, text: "Dashboard KPI avanzata", detail: "Metriche dettagliate e insight AI (presto)" },
];

export default function Pro() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await authFetch("/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ uid: user.id, productType: "pro" }),
      });
      const data = await res.json() as any;
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.message || "Errore checkout");
      }
    } catch (e: any) {
      toast({ title: "Errore checkout", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isPro = user?.plan === "PRO";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navigation />

      <main className="flex-1 overflow-x-hidden pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-12 space-y-6">

          {/* Hero */}
          <div className="text-center space-y-2">
            <span className="inline-block bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
              {isPro ? "✓ Piano attivo" : "Offerta a Tempo Limitato"}
            </span>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900">
              Sblocca la Potenza PRO
            </h1>
            <p className="text-slate-500 text-base max-w-md mx-auto">
              Porta la tua crescita al livello successivo con AI illimitata e percorsi avanzati.
            </p>
          </div>

          {/* Card principale */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Header card scuro */}
            <div className="bg-slate-900 px-6 py-8">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-5xl font-display font-bold text-white">€50</span>
                <span className="text-slate-400 text-lg">/una tantum</span>
              </div>
              <p className="text-slate-400 text-sm">Accesso completo. Senza abbonamenti. Per sempre.</p>
            </div>

            {/* Features */}
            <div className="px-6 py-6 space-y-4">
              {FEATURES.map(({ icon: Icon, text, detail }) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{text}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{detail}</p>
                  </div>
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-1 ml-auto" />
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="px-6 pb-6 space-y-3">
              {isPro ? (
                <div className="w-full h-12 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-emerald-700">Piano PRO attivo</span>
                </div>
              ) : (
                <Button
                  size="lg"
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 text-base"
                >
                  {loading
                    ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Apertura checkout...</>
                    : "Aggiorna a PRO →"}
                </Button>
              )}
              <p className="text-center text-xs text-slate-400">
                🔒 Pagamento sicuro via Stripe · Rimborso garantito 14 giorni
              </p>
            </div>
          </div>

          {/* FAQ mini */}
          <div className="space-y-3">
            {[
              { q: "Cosa succede dopo il pagamento?", a: "Il tuo piano viene attivato immediatamente. I task del percorso avanzato diventano subito disponibili." },
              { q: "Posso chiedere il rimborso?", a: "Sì, entro 14 giorni dal pagamento senza domande. Scrivi a info@webstudioams.it." },
              { q: "Il prezzo include aggiornamenti futuri?", a: "Sì. Tutte le funzionalità future del piano PRO sono incluse senza costi aggiuntivi." },
            ].map(({ q, a }) => (
              <div key={q} className="bg-white rounded-2xl border border-slate-200 px-5 py-4">
                <p className="font-semibold text-slate-900 text-sm mb-1">{q}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{a}</p>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}
