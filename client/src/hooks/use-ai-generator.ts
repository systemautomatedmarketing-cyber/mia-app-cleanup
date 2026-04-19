// src/hooks/use-ai-generator.ts
//import { getFunctions, httpsCallable } from "firebase/functions";
import { httpsCallable } from "firebase/functions";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { functions } from "@/lib/firebase"; // ← IMPORTA il tuo instance con regione

// Helper per parsare output AI in modo sicuro
function parseAIOutput(raw: string) {
  try {
    // Se è già un oggetto, restituiscilo
    if (typeof raw === 'object') return raw;
    
    // Estrai JSON da stringa con markdown o testo extra
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { content: raw, tips: "" };
    
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      content: parsed.content || parsed.text || parsed.output || raw,
      tips: parsed.tips || parsed.advice || parsed.note || ""
    };
  } catch {
    return { content: raw, tips: "⚠️ Verifica il formato prima di pubblicare" };
  }
}

export function useAIGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
//  const functions = getFunctions(); // Usa regione default (europe-west1 se impostata in app)

  const generate = async (taskId: string, variables: Record<string, string>) => {
    setIsGenerating(true);
    try {

      const callable = httpsCallable(functions, "generateTaskAI");
      const result = await callable({ taskId, variables });
      
      const data = result.data as any;

      if (data?.success && data?.output) {
//        const parsed = JSON.parse(data.output);
        const parsed = parseAIOutput(data.output);

        // ✅ Mostra il contenuto generato nel toast
        toast({
          title: data.fallback ? "⚡ Template pronto" : "✅ Contenuto generato!",
          description: parsed.content.substring(0, 80) + (parsed.content.length > 80 ? "..." : ""),
          duration: 6000,
        });

        return parsed;
      }
      throw new Error("Formato risposta non valido");
    } catch (error: any) {
      console.error("AI generation failed:", error);

      // ✅ Fallback con template utile (non generico)
      const fallbackContent = `Per "${variables.topic || taskId}":
• Apri con una domanda che stimoli la curiosità
• Condividi un'esperienza personale breve
• Chiudi con una call-to-action chiara

💡 Pubblica tra 18:00-20:00 per massimo reach.`;
      
      toast({
        title: "⚡ Template manuale pronto",
        description: "Contenuto basato su best practice verificate",
        duration: 6000,
      });

      return { content: fallbackContent, tips: "Verifica sempre prima di pubblicare", fallback: true };
    } finally {
      setIsGenerating(false);
    }
  };

  return { generate, isGenerating };
}