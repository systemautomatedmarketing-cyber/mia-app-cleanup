import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-tasks";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Gift, Zap, Loader2, Star } from "lucide-react";
import { authFetch } from "@/lib/api";
import { ProductTour } from "@/components/ProductTour";
import { useTour } from "@/hooks/use-tour";
import { getCreditSteps } from "@/lib/tour-steps";
import { clsx } from "clsx";
import { PromoBanner, PriceDisplay } from "@/components/PromoBanner";
import { FULL_PRICES, PROMO_PRICES, isPromoActive } from "@/lib/promo-config";

// Definizione pacchetti crediti — prezzi da promo-config
const CREDIT_PACKAGES = [
  {
    credits: 100,
    get price() { return isPromoActive() ? PROMO_PRICES.credits_100 : FULL_PRICES.credits_100; },
    fullPrice: FULL_PRICES.credits_100,
    productType: "credits_100",
    label: "Starter",
    description: "10 generazioni AI",
    color: "indigo",
    badge: null,
  },
  {
    credits: 200,
    get price() { return isPromoActive() ? PROMO_PRICES.credits_200 : FULL_PRICES.credits_200; },
    fullPrice: FULL_PRICES.credits_200,
    productType: "credits_200",
    label: "Plus",
    description: "20 generazioni AI",
    color: "violet",
    badge: "Più popolare",
  },
  {
    credits: 500,
    get price() { return isPromoActive() ? PROMO_PRICES.credits_500 : FULL_PRICES.credits_500; },
    fullPrice: FULL_PRICES.credits_500,
    productType: "credits_500",
    label: "Pro",
    description: "50 generazioni AI",
    color: "emerald",
    badge: "Miglior valore",
  },
] as const;

type CreditPackage = typeof CREDIT_PACKAGES[number];

// Stili per colore pacchetto
const PACKAGE_STYLES = {
  indigo: {
    card: "border-indigo-200 hover:border-indigo-400 hover:shadow-indigo-100",
    icon: "bg-indigo-100 text-indigo-600",
    amount: "text-indigo-700",
    button: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200",
    badge: "bg-indigo-100 text-indigo-700",
    loading: "text-indigo-300",
  },
  violet: {
    card: "border-violet-200 hover:border-violet-400 hover:shadow-violet-100",
    icon: "bg-violet-100 text-violet-600",
    amount: "text-violet-700",
    button: "bg-violet-600 hover:bg-violet-700 shadow-violet-200",
    badge: "bg-violet-100 text-violet-700",
    loading: "text-violet-300",
  },
  emerald: {
    card: "border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100",
    icon: "bg-emerald-100 text-emerald-600",
    amount: "text-emerald-700",
    button: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    loading: "text-emerald-300",
  },
} as const;

export default function Credits() {
  const { user } = useAuth();
  const { redeemMutation } = useCredits();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [loadingPackage, setLoadingPackage] = useState<string | null>(null);
  const { showTour, markSectionDone } = useTour("credits");

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    try {
      const result = await redeemMutation.mutateAsync(code);
      toast({
        title: "Successo!",
        description: `Riscattati ${result.creditsAdded} crediti. Nuovo saldo: ${result.newBalance}`,
      });
      setCode("");
    } catch (err: any) {
      toast({ title: "Riscatto fallito", description: err.message, variant: "destructive" });
    }
  };

  const handleBuyCredits = async (pkg: CreditPackage) => {
    if (!user?.id) return;
    setLoadingPackage(pkg.productType);
    try {
      const res = await authFetch("/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({
          uid: user.id,
          productType: pkg.productType,
          credits: pkg.credits,
        }),
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
      setLoadingPackage(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navigation />
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto space-y-8">

          {/* Banner promo — compatto, sopra tutto */}
          <PromoBanner variant="credits" />

          <header>
            <h1 className="text-3xl font-display font-bold text-slate-900">Centro Crediti</h1>
            <p className="text-slate-500">Gestisci i tuoi crediti AI e riscatta i premi.</p>
          </header>

          {/* Saldo */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-indigo-200 font-medium uppercase tracking-wider text-sm mb-1">Saldo Disponibile</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-bold font-display">{user?.creditsBalance ?? 0}</span>
                <span className="text-xl text-indigo-300">crediti</span>
              </div>
              <p className="mt-3 text-sm text-indigo-100 opacity-80">
                10 crediti per ogni generazione AI · {Math.floor((user?.creditsBalance ?? 0) / 10)} generazioni disponibili
              </p>
            </div>
            <Sparkles className="absolute right-[-20px] top-[-20px] w-64 h-64 text-indigo-500 opacity-20" />
          </div>

          {/* Pacchetti crediti */}
          <div>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Acquista crediti</h2>
              {isPromoActive() && (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                  Prezzi di lancio
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CREDIT_PACKAGES.map((pkg, idx) => {
                const styles = PACKAGE_STYLES[pkg.color];
                const isLoading = loadingPackage === pkg.productType;
                const isAnyLoading = loadingPackage !== null;
                // Su mobile: l'ultimo pacchetto (indice 2) occupa entrambe le colonne
                const isLast = idx === CREDIT_PACKAGES.length - 1;

                return (
                  <div
                    key={pkg.productType}
                    className={clsx(
                      "relative flex flex-col rounded-2xl border-2 bg-white p-4 transition-all duration-200 hover:shadow-lg cursor-pointer",
                      styles.card,
                      isLast && "col-span-2 md:col-span-1",
                    )}
                    onClick={() => !isAnyLoading && handleBuyCredits(pkg)}
                  >
                    {/* Badge */}
                    {pkg.badge && (
                      <span className={clsx(
                        "absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full whitespace-nowrap",
                        styles.badge
                      )}>
                        {pkg.badge}
                      </span>
                    )}


                    {/* Icona + label */}
                    <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center mb-3", styles.icon)}>
                      {pkg.color === "emerald" ? <Star className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                    </div>

                    {/* Quantità crediti */}
                    <p className={clsx("text-3xl font-bold font-display leading-none mb-1", styles.amount)}>
                      {pkg.credits}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">crediti</p>
                    <p className="text-xs text-slate-400 mb-4">{pkg.description}</p>

                    {/* Prezzo con barrato durante promo */}
                    <div className="mt-auto">
                      <div className="mb-2">
                      <PriceDisplay
                        fullPrice={(pkg as any).fullPrice ?? pkg.price}
                        promoPrice={pkg.price}
                        size="sm"
                      />
                      </div>
                      <Button
                        size="sm"
                        disabled={isAnyLoading}
                        className={clsx("w-full text-white text-xs font-bold shadow-sm", styles.button)}
                        onClick={(e) => { e.stopPropagation(); handleBuyCredits(pkg); }}
                      >
                        {isLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          `Acquista ${pkg.credits} Crediti`
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Nota equivalenza */}
            <p className="text-xs text-slate-400 mt-3 text-center">
              1 credito = 0,1 generazione AI · I crediti non scadono
            </p>
          </div>

          {/* Riscatta codice */}
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                <Gift className="w-6 h-6" />
              </div>
              <CardTitle>Riscatta Codice</CardTitle>
              <CardDescription>Hai un codice promozionale? Inseriscilo qui.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRedeem} className="flex gap-3">
                <Input
                  placeholder="INSERISCI-CODICE-QUI"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="uppercase font-mono tracking-widest"
                />
                <Button
                  type="submit"
                  disabled={redeemMutation.isPending || !code}
                  className="bg-slate-900 text-white hover:bg-slate-800"
                >
                  {redeemMutation.isPending ? "..." : "Riscatta"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {showTour && user && (
        <ProductTour
          steps={getCreditSteps({
            creditsBalance: user.creditsBalance,
            plan: user.plan,
          })}
          onComplete={markSectionDone}
          onSkip={markSectionDone}
        />
      )}
    </div>

  );
}

