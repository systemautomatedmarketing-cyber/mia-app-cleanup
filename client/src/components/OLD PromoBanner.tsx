// client/src/components/PromoBanner.tsx
// Banner countdown riutilizzabile — usato in Pro.tsx e Credits.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Zap } from "lucide-react";
import {
  ACTIVE_PROMO, isPromoActive, getCountdown, type Countdown,
} from "@/lib/promo-config";

interface PromoBannerProps {
  /** Variante compatta (per Credits) o espansa (per Pro) */
  variant?: "compact" | "full";
}

export function PromoBanner({ variant = "full" }: PromoBannerProps) {
  const [countdown, setCountdown] = useState<Countdown>(getCountdown());
  const promoOn = isPromoActive();

  useEffect(() => {
    if (!promoOn) return;
    const id = setInterval(() => setCountdown(getCountdown()), 1000);
    return () => clearInterval(id);
  }, [promoOn]);

  if (!promoOn) return null;

  // ── Variante compatta (una riga sola) ──────────────────────────────────────
  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Zap className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="font-semibold text-amber-900 truncate">
            {ACTIVE_PROMO.badge} — {ACTIVE_PROMO.reason}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span className="font-bold text-amber-800 tabular-nums text-xs">
            {countdown.formatted}
          </span>
        </div>
      </motion.div>
    );
  }

  // ── Variante full (per la pagina Pro) ──────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 md:p-5 text-white shadow-lg shadow-amber-200"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 flex-shrink-0" />
            <span className="font-bold text-sm uppercase tracking-wide">
              {ACTIVE_PROMO.badge}
            </span>
          </div>
          <p className="text-amber-50 text-sm">
            {ACTIVE_PROMO.reason}. L'offerta scade tra:
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <span className="bg-white/20 rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-wide">
            -{ACTIVE_PROMO.discountPct}%
          </span>
        </div>
      </div>

      {/* Countdown a 4 colonne */}
      <div className="grid grid-cols-4 gap-2 mt-4">
        {[
          { value: countdown.days,    label: "Giorni" },
          { value: countdown.hours,   label: "Ore" },
          { value: countdown.minutes, label: "Minuti" },
          { value: countdown.seconds, label: "Secondi" },
        ].map(({ value, label }) => (
          <div key={label} className="bg-white/20 rounded-xl py-2 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={value}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                className="text-2xl md:text-3xl font-bold tabular-nums leading-none"
              >
                {String(value).padStart(2, "0")}
              </motion.div>
            </AnimatePresence>
            <div className="text-[10px] text-amber-100 uppercase tracking-wide mt-1">
              {label}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/** Mostra il prezzo barrato + prezzo scontato inline */
export function PriceDisplay({
  fullPrice,
  promoPrice,
  size = "md",
}: {
  fullPrice: string;
  promoPrice: string;
  size?: "sm" | "md" | "lg";
}) {
  const promoOn = isPromoActive();
  const sizeMap = {
    sm:  { current: "text-xl",  striked: "text-sm"  },
    md:  { current: "text-3xl", striked: "text-base" },
    lg:  { current: "text-5xl", striked: "text-xl"  },
  };
  const s = sizeMap[size];

  if (!promoOn) {
    return (
      <span className={`${s.current} font-display font-bold text-slate-900`}>
        {promoPrice}
      </span>
    );
  }

  return (
    <div className="flex items-baseline gap-2">
      <span className={`${s.current} font-display font-bold text-slate-900`}>
        {promoPrice}
      </span>
      <span className={`${s.striked} text-slate-400 line-through`}>
        {fullPrice}
      </span>
    </div>
  );
}
