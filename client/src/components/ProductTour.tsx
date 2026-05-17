// client/src/components/ProductTour.tsx
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export interface TourStep {
  id: string;
  targetSelector: string | null;
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
  color?: "indigo" | "violet" | "emerald" | "amber" | "pink";
}

const COLOR_MAP = {
  indigo:  { bg: "bg-indigo-600",  light: "bg-indigo-50",  border: "border-indigo-200",  text: "text-indigo-700",  dot: "bg-indigo-600"  },
  violet:  { bg: "bg-violet-600",  light: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-700",  dot: "bg-violet-600"  },
  emerald: { bg: "bg-emerald-600", light: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-600" },
  amber:   { bg: "bg-amber-500",   light: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",  dot: "bg-amber-500"   },
  pink:    { bg: "bg-pink-600",    light: "bg-pink-50",    border: "border-pink-200",    text: "text-pink-700",   dot: "bg-pink-600"    },
};

interface ProductTourProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
}

const isMobile = () => window.innerWidth < 768;

export function ProductTour({ steps, onComplete, onSkip }: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});

  const step   = steps[currentStep];
  const isLast  = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;
  const colors  = COLOR_MAP[step.color ?? "indigo"];

  useEffect(() => {
    // Su mobile o step senza target → sempre in basso a schermo intero
    if (isMobile() || !step.targetSelector) {
      setHighlightStyle({});
      setTooltipStyle({
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        borderRadius: "20px 20px 0 0",
        // Su desktop senza target → centrato
        ...(!isMobile() && !step.targetSelector ? {
          bottom: "auto",
          top: "50%",
          left: "50%",
          right: "auto",
          transform: "translate(-50%, -50%)",
          width: "min(90vw, 400px)",
          borderRadius: "20px",
        } : {}),
      });
      return;
    }

    // Desktop con target — posizionamento relativo all'elemento
    const el = document.querySelector(step.targetSelector) as HTMLElement;
    if (!el) {
      setHighlightStyle({});
      setTooltipStyle({
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(90vw, 400px)",
        borderRadius: "20px",
        zIndex: 9999,
      });
      return;
    }

    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const rect   = el.getBoundingClientRect();
    const pad    = 8;
    const tW     = Math.min(window.innerWidth * 0.88, 380);
    const tH     = 210;
    const pos    = step.position ?? "bottom";

    // Highlight ring
    setHighlightStyle({
      position: "fixed",
      top:    rect.top    - pad,
      left:   rect.left   - pad,
      width:  rect.width  + pad * 2,
      height: rect.height + pad * 2,
      borderRadius: "12px",
      zIndex: 9998,
      pointerEvents: "none",
      boxShadow: `0 0 0 4px ${step.color === "indigo" ? "#4f46e533" : "#7c3aed33"}`,
    });

    let top = 0, left = 0;
    if (pos === "bottom") { top = rect.bottom + pad + 8; left = rect.left + rect.width / 2 - tW / 2; }
    else if (pos === "top") { top = rect.top - tH - pad - 8; left = rect.left + rect.width / 2 - tW / 2; }
    else if (pos === "right") { top = rect.top + rect.height / 2 - tH / 2; left = rect.right + pad + 8; }
    else { top = rect.top + rect.height / 2 - tH / 2; left = rect.left - tW - pad - 8; }

    left = Math.max(12, Math.min(left, window.innerWidth  - tW - 12));
    top  = Math.max(12, Math.min(top,  window.innerHeight - tH - 12));

    setTooltipStyle({
      position: "fixed",
      top,
      left,
      width: tW,
      borderRadius: "16px",
      zIndex: 9999,
    });
  }, [currentStep, step]);

  const goNext = () => {
    if (isLast) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ["#4f46e5", "#7c3aed", "#059669"] });
      setTimeout(onComplete, 400);
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const goPrev = () => setCurrentStep((s) => Math.max(0, s - 1));

  return (
    <>
      {/* Highlight ring (solo desktop con target) */}
      <AnimatePresence>
        {step.targetSelector && !isMobile() && (
          <motion.div
            key={`hl-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`border-2 ${colors.border}`}
            style={highlightStyle}
          />
        )}
      </AnimatePresence>

      {/* Tooltip / Sheet */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={isMobile() ? { y: "100%" } : { opacity: 0, y: 8, scale: 0.97 }}
          animate={isMobile() ? { y: 0 }       : { opacity: 1, y: 0, scale: 1 }}
          exit={isMobile()    ? { y: "100%" }   : { opacity: 0, y: -8, scale: 0.97 }}
          transition={{ type: isMobile() ? "spring" : "tween", stiffness: 300, damping: 30, duration: 0.2 }}
          style={tooltipStyle}
          className="bg-white border border-slate-200 shadow-2xl overflow-hidden"
        >
          {/* Handle drag su mobile */}
          {isMobile() && (
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>
          )}

          {/* Header */}
          <div className={`${colors.light} ${colors.border} border-b px-4 py-3 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <span className={`${colors.bg} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                {currentStep + 1} / {steps.length}
              </span>
              <span className={`text-xs font-semibold ${colors.text}`}>{step.title}</span>
            </div>
            <button
              onClick={onSkip}
              className="text-slate-400 hover:text-slate-600 transition-colors p-2 -mr-1 rounded-full hover:bg-slate-100"
              aria-label="Chiudi tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Contenuto */}
          <div className="px-4 py-4">
            <p className="text-sm text-slate-700 leading-relaxed">{step.content}</p>
          </div>

          {/* Footer */}
          <div className="px-4 pb-5 flex items-center justify-between gap-3">
            {/* Indicatori */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep ? `w-4 ${colors.dot}` : "w-1.5 bg-slate-200"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <Button size="sm" variant="ghost" onClick={goPrev} className="h-9 text-xs text-slate-500">
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Indietro
                </Button>
              )}
              <Button size="sm" onClick={goNext} className={`h-9 text-sm font-semibold text-white ${colors.bg} hover:opacity-90 px-4`}>
                {isLast ? <><Sparkles className="w-3.5 h-3.5 mr-1.5" /> Inizia!</> : <>Avanti <ChevronRight className="w-3.5 h-3.5 ml-1" /></>}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
