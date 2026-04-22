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
import { Sparkles, Gift, Zap, Loader2 } from "lucide-react";
import { authFetch } from "@/lib/api";

export default function Credits() {
  const { user } = useAuth();
  const { redeemMutation } = useCredits();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [loadingCheckout, setLoadingCheckout] = useState(false);

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

  const handleBuyCredits = async () => {
    if (!user?.id) return;
    setLoadingCheckout(true);
    try {
      const res = await authFetch("/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ uid: user.id, productType: "credits", credits: 100 }),
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
      setLoadingCheckout(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navigation />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <header className="mb-8">
            <h1 className="text-3xl font-display font-bold text-slate-900">Centro Crediti</h1>
            <p className="text-slate-500">Gestisci i tuoi crediti AI e riscatta i premi.</p>
          </header>

          {/* Balance Card */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-indigo-200 font-medium uppercase tracking-wider text-sm mb-1">Saldo Disponibile</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-bold font-display">{user?.creditsBalance}</span>
                <span className="text-xl text-indigo-300">crediti</span>
              </div>
              <p className="mt-4 text-sm text-indigo-100 opacity-80 max-w-sm">
                I crediti vengono utilizzati per la generazione di contenuti AI.
              </p>
            </div>
            <Sparkles className="absolute right-[-20px] top-[-20px] w-64 h-64 text-indigo-500 opacity-20" />
            <br />
            <Button
              size="lg"
              onClick={handleBuyCredits}
              disabled={loadingCheckout}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg h-14 rounded-xl shadow-lg shadow-indigo-200"
            >
              {loadingCheckout
                ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Apertura checkout...</>
                : "Acquista 100 Crediti"}
            </Button>
{/*		&nbsp;
            <Button
              size="lg"
              onClick={handleBuyCredits}
              disabled={loadingCheckout}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg h-14 rounded-xl shadow-lg shadow-indigo-200"
            >
              {loadingCheckout
                ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Apertura checkout...</>
                : "Acquista 200 Crediti"}
            </Button>
		&nbsp;
            <Button
              size="lg"
              onClick={handleBuyCredits}
              disabled={loadingCheckout}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg h-14 rounded-xl shadow-lg shadow-indigo-200"
            >
              {loadingCheckout
                ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Apertura checkout...</>
                : "Acquista 500 Crediti"}
            </Button>
*/}
          </div>

          {/* Redeem */}
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

          {/* Feature */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-dashed border-2 bg-slate-50/50">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-full mb-3">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Generazione Contenuti AI</h3>
                <p className="text-sm text-slate-500">10 crediti / generazione</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
