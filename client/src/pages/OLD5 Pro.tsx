import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Zap, Shield, Clock, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/lib/api";
import { PromoBanner, PriceDisplay } from "@/components/PromoBanner";
import { FULL_PRICES, PROMO_PRICES, isPromoActive, ACTIVE_PROMO } from "@/lib/promo-config";

const FEATURES = [
  { icon: Zap,        text: "Generazione AI illimitata",  detail: "Nessun limite di crediti per i contenuti" },
  { icon: TrendingUp, text: "Percorso 60 e 90 giorni",    detail: "Task avanzati per chi vuole crescere di più" },
  { icon: Shield,     text: "Supporto prioritario",       detail: "Risposta entro 24h via email" },
  { icon: Clock,      text: "Dashboard KPI avanzata",     detail: "Metriche dettagliate e insight AI (presto)" },
];

export default function Pro() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const promoOn = isPromoActive();
  const isPro   = user?.plan === "PRO";

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

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navigation />

      <main className="flex-1 overflow-x-hidden pb-24 md:pb-8 landscape:pb-4">
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-5">

          {/* ── Messaggio urgenza (no countdown) ── */}
          <PromoBanner variant="pro" />

          {/* ── Hero ── */}
          <div className="text-center space-y-2">
            {isPro ? (
              <span className="inline-block bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                ✓ Piano PRO attivo
              </span>
            ) : promoOn ? (
              <span className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                {ACTIVE_PROMO.badge} · -{ACTIVE_PROMO.discountPct}% di sconto
              </span>
            ) : (
              <span className="inline-block bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                Accesso completo
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900">
              Sblocca la Potenza PRO
            </h1>
            <p className="text-slate-500 text-base max-w-md mx-auto">
              Porta la tua crescita al livello successivo con AI illimitata e percorsi avanzati.
            </p>
          </div>

          {/* ── Card principale ── */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">

            {/* Header card scuro — prezzo in bianco su sfondo slate-900 */}
            <div className="bg-slate-900 px-6 py-7 space-y-2">
              {/* PriceDisplay con variant="on-dark" → testo bianco visibile */}
              <PriceDisplay
                fullPrice={FULL_PRICES.pro}
                promoPrice={PROMO_PRICES.pro}
                size="lg"
                variant="on-dark"
              />
              <p className="text-slate-400 text-sm">
                Accesso completo · Una tantum · Per sempre
              </p>
              {promoOn && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <p className="text-amber-400 text-xs font-semibold">
                    {ACTIVE_PROMO.reason} — dopo tornerà a {FULL_PRICES.pro}
                  </p>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="px-6 py-5 space-y-4">
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
                <>
                  <Button
                    size="lg"
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 text-base"
                  >
                    {loading
                      ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Apertura checkout...</>
                      : promoOn
                        ? `Sì, voglio PRO a ${PROMO_PRICES.pro} →`
                        : "Aggiorna a PRO →"}
                  </Button>
                  {promoOn && (
                    <p className="text-center text-xs text-amber-700 font-medium">
                      Al prezzo normale costerebbe {FULL_PRICES.pro}. Stai risparmiando {ACTIVE_PROMO.discountPct}%.
                    </p>
                  )}
                </>
              )}
              <p className="text-center text-xs text-slate-400">
                🔒 Pagamento sicuro via Stripe · Rimborso garantito 14 giorni
              </p>
            </div>
          </div>

          {/* ── FAQ ── */}
          <div className="space-y-3">
            {[
              {
                q: "Cosa succede dopo il pagamento?",
                a: "Il tuo piano viene attivato immediatamente. I task del percorso avanzato e l'AI illimitata diventano disponibili in meno di un minuto.",
              },
              {
                q: "Posso chiedere il rimborso?",
                a: "Sì, entro 14 giorni dal pagamento senza domande. Scrivi a info@webstudioams.it.",
              },
              {
                q: promoOn ? "Perché questo prezzo così basso?" : "Il prezzo include aggiornamenti futuri?",
                a: promoOn
                  ? `Siamo in fase di lancio e vogliamo che i primi utenti diventino i nostri ambasciatori. In cambio del loro feedback e della fiducia, blocchiamo il prezzo. Non sarà sempre così: una volta raggiunto il target di utenti, il PRO tornerà a ${FULL_PRICES.pro}.`
                  : "Sì. Tutte le funzionalità future del piano PRO sono incluse senza costi aggiuntivi.",
              },
              {
                q: "Devo rinnovare ogni anno?",
                a: "No. È un pagamento unico. Non ci sono abbonamenti, non ci sono rinnovi, non ci saranno sorprese in bolletta.",
              },
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
