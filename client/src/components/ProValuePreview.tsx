// src/components/ProValuePreview.tsx
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Benefit {
  icon: string;
  title: string;
  desc: string;
}

interface ProValuePreviewProps {
  benefits: Benefit[];
  ctaLabel: string;
  ctaUrl: string;
  onClose: () => void;
  triggerMessage: string;
}

export function ProValuePreview({ benefits, ctaLabel, ctaUrl, onClose, triggerMessage }: ProValuePreviewProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="text-lg font-bold text-slate-900">Ottimo lavoro! 🎉</h3>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <p className="text-sm text-slate-600">{triggerMessage}</p>
          </div>

          {/* Benefits List */}
          <div className="p-6 space-y-4">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 text-xl">{b.icon}</div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{b.title}</p>
                  <p className="text-xs text-slate-500">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Footer */}
          <div className="p-6 pt-0 space-y-3">
            <a href={ctaUrl} className="block">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                {ctaLabel} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
            <p className="text-center text-xs text-slate-400">
              Puoi continuare gratuitamente. L'upgrade è sempre disponibile.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
