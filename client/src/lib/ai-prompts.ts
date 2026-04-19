// src/lib/ai-prompts.ts
export interface TaskContext {
  platform: string;
  goal: string;       // "follower", "engagement", "sales"
  level: string;      // "beginner", "intermediate", "advanced"
  niche?: string;
  day?: number;
}

export const PROMPT_TEMPLATES = {
  generate_task: (ctx: TaskContext) => `
Sei un esperto di crescita su ${ctx.platform}.
Genera UN solo task pratico per il Giorno ${ctx.day || 1}, mirato a: ${ctx.goal}.
Livello utente: ${ctx.level}. ${ctx.niche ? `Nicchia: ${ctx.niche}` : ''}

REQUISITI OBBLIGATORI:
• Tempo: max 10 minuti
• Azione concreta, non teorica
• Risultato misurabile (es: "+X visite", "+Y commenti")
• Nessun tool esterno richiesto

Output ESCLUSIVAMENTE in questo formato JSON, senza markdown o testo extra:
{
  "title": "titolo chiaro e motivante",
  "instructions": "istruzioni passo-passo in 2-3 righe",
  "estimated_time": "5 min",
  "task_type": "ACTION",
  "expected_result": "+15-30 profile visits",
  "why_it_works": "spiegazione psicologica/strategica in 1 frase"
}
`,
  
  generate_content: (taskTitle: string, context: string) => `
Genera contenuto pronto all'uso per: "${taskTitle}".
Contesto utente: ${context}
Tono: professionale ma accessibile. Lunghezza: concisa.
Output in formato JSON: { "content": "...", "tips": "1 consiglio di pubblicazione" }
`
} as const;