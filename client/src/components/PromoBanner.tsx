// client/src/components/PromoBanner.tsx
import { motion } from "framer-motion";
import { AlertTriangle, Tag } from "lucide-react";
import {
  ACTIVE_PROMO, FULL_PRICES, isPromoActive,
} from "@/lib/promo-config";

// Messaggi di urgenza psicologica — ruotano in modo deterministico per giorno
// così non cambiano ad ogni render ma variano nel tempo
const URGENCY_MESSAGES_PRO = [
  {
    headline: "I fondatori pagano meno. Per sempre.",
    body: `Chi entra ora blocca il prezzo di lancio. Quando raggiungiamo i primi 100 utenti, il PRO torna a ${FULL_PRICES.pro} — e non ci saranno eccezioni.`,
  },
  {
    headline: "Stai lasciando soldi sul tavolo.",
    body: `Ogni giorno senza PRO è un giorno con crediti limitati e percorso bloccato al 30°. Il prezzo di lancio non durerà ancora a lungo.`,
  },
  {
    headline: "L'unico momento in cui costa meno è adesso.",
    body: `Non è un trucco di marketing: il prezzo salirà. Chi ha già PRO lo sa. Chi aspetta, lo scoprirà nel modo sbagliato.`,
  },
  {
    headline: "Meno di una cena fuori. Crescita per sempre.",
    body: `${FULL_PRICES.pro} è il prezzo normale. Oggi paghi il 40% in meno e ottieni tutto — AI illimitata, 90 giorni di percorso, KPI avanzati.`,
  },
];

const URGENCY_MESSAGES_CREDITS = [
  {
    headline: "Prezzi di lancio: non resteranno così a lungo.",
    body: "Stiamo tenendo i prezzi bassi per i primi utenti. Appena raggiungiamo il target, i crediti torneranno ai prezzi normali.",
  },
  {
    headline: "I crediti non scadono. Il prezzo sì.",
    body: "Acquista ora al prezzo di lancio e usali quando vuoi. Ogni generazione AI che fai oggi vale molto di più di quello che paghi.",
  },
  {
    headline: "Più ne prendi ora, più risparmi dopo.",
    body: "500 crediti al prezzo attuale equivale a pagare meno di 4 centesimi per generazione AI. Ai prezzi normali sarà quasi il doppio.",
  },
];

function pickByDay<T>(arr: T[]): T {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return arr[dayOfYear % arr.length];
}

interface PromoBannerProps {
  variant?: "pro" | "credits";
}

export function PromoBanner({ variant = "pro" }: PromoBannerProps) {
  if (!isPromoActive()) return null;

  const msg = variant === "pro"
    ? pickByDay(URGENCY_MESSAGES_PRO)
    : pickByDay(URGENCY_MESSAGES_CREDITS);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={
        variant === "pro"
          ? "bg-amber-50 border border-amber-300 rounded-2xl px-5 py-4"
          : "bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
      }
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {variant === "pro"
            ? <AlertTriangle className="w-4 h-4 text-amber-600" />
            : <Tag className="w-4 h-4 text-amber-600" />
          }
        </div>
        <div className="min-w-0">
          <p className="font-bold text-amber-900 text-sm leading-snug">
            {msg.headline}
          </p>
          <p className="text-amber-800 text-xs mt-1 leading-relaxed opacity-90">
            {msg.body}
          </p>
        </div>
        <span className="flex-shrink-0 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full self-start">
          -{ACTIVE_PROMO.discountPct}%
        </span>
      </div>
    </motion.div>
  );
}

/**
 * Mostra prezzo scontato + prezzo barrato.
 * variant="on-dark" → testi bianchi/chiari per sfondi scuri (es. header slate-900)
 * variant="on-light" → testi normali per sfondi bianchi/chiari
 */
export function PriceDisplay({
  fullPrice,
  promoPrice,
  size = "md",
  variant = "on-light",
}: {
  fullPrice: string;
  promoPrice: string;
  size?: "sm" | "md" | "lg";
  variant?: "on-dark" | "on-light";
}) {
  const promoOn = isPromoActive();

  const sizeMap = {
    sm:  { current: "text-xl",  striked: "text-sm"  },
    md:  { current: "text-3xl", striked: "text-base" },
    lg:  { current: "text-5xl", striked: "text-2xl"  },
  };
  const s = sizeMap[size];

  const currentColor = variant === "on-dark" ? "text-white" : "text-slate-900";
  const strikedColor = variant === "on-dark" ? "text-slate-400" : "text-slate-400";
  const badgeClass   = variant === "on-dark"
    ? "bg-amber-400 text-amber-900"
    : "bg-amber-100 text-amber-800";

  if (!promoOn) {
    return (
      <span className={`${s.current} font-display font-bold ${currentColor}`}>
        {promoPrice}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      {/* Prezzo scontato — prominente */}
      <span className={`${s.current} font-display font-bold ${currentColor}`}>
        {promoPrice}
      </span>
      {/* Prezzo barrato */}
      <span className={`${s.striked} ${strikedColor} line-through`}>
        {fullPrice}
      </span>
      {/* Badge risparmio */}
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
        -{ACTIVE_PROMO.discountPct}%
      </span>
    </div>
  );
}
