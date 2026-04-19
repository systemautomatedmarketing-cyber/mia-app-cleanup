// src/api/ai.ts
import { onCall, CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';

// Inizializza Firebase Admin (solo se non già fatto in index.ts)
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// ✅ Inizializza OpenAI con chiave da env
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// ✅ Prompt templates (puoi spostarli in un file condiviso se preferisci)
export const PROMPT_TEMPLATES = {
  generate_content: (taskTitle: string, context: string) => `
Genera contenuto pronto all'uso per: "${taskTitle}".
Contesto utente: ${context}
Tono: professionale ma accessibile. Lunghezza: concisa.
Output ESCLUSIVAMENTE in formato JSON, senza markdown:
{ "content": "testo pronto da copiare", "tips": "1 consiglio di pubblicazione" }
`,
  
  generate_task: (platform: string, goal: string, level: string, day: number) => `
Sei un esperto di crescita su ${platform}.
Genera UN task pratico per il Giorno ${day}, mirato a: ${goal}.
Livello utente: ${level}.

REQUISITI:
• Tempo: max 10 minuti
• Azione concreta, non teorica
• Risultato misurabile (es: "+X visite")

Output JSON:
{
  "title": "titolo chiaro",
  "instructions": "istruzioni passo-passo in 2-3 righe",
  "estimated_time": "5 min",
  "task_type": "ACTION",
  "expected_result": "+15-30 profile visits",
  "why_it_works": "spiegazione in 1 frase"
}
`
} as const;


// ✅ Funzione AI con sintassi v2 CORRETTA
export const generateTaskAI = onCall(
  { memory: "256MiB", timeoutSeconds: 30 }, // regione presa da setGlobalOptions in index.ts
  async (request: CallableRequest<{ taskId: string; variables: Record<string, string> }>) => {
    // ✅ v2: auth è su request.auth, non su un secondo parametro
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Login required');
    }
    
    // ✅ v2: i dati sono su request.data
    const { taskId, variables } = request.data;
    const userId = request.auth.uid;

    // 2. Verifica crediti
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    const isFree = userData?.plan === 'FREE';
    const credits = Number(userData?.creditsBalance || 0);
    
    if (isFree && credits <= 0) {
      // ✅ Usa codice errore valido: 'permission-denied' per crediti insufficienti
      throw new HttpsError('permission-denied', 'Crediti insufficienti');
    }

    // 3. Prepara prompt
    const prompt = PROMPT_TEMPLATES.generate_content(
      variables?.topic || taskId, 
      variables?.context || ''
    );
    
    try {
      // 4. Chiama OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      });

      const rawOutput = completion.choices[0].message.content || '{}';
      
      // 5. Parsa JSON sicuro
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { 
        content: rawOutput, 
        tips: '' 
      };

      // 6. Scala 1 credito (atomico)
      if (isFree) {
        await db.collection('users').doc(userId).update({
          creditsBalance: admin.firestore.FieldValue.increment(-1)
        });
      }

      return { success: true, output: JSON.stringify(parsed) };

    } catch (error: any) {
      console.error('AI generation failed:', error);
      
      // ✅ FALLBACK: ritorna contenuto manuale se AI fallisce (non rompere l'UX)
      return {
        success: true,
        output: JSON.stringify({
          content: `Ecco un template pronto per "${variables?.topic || taskId}":\n\n1. Scrivi 3 frasi sulla tua esperienza\n2. Usa un tono diretto e personale\n3. Chiudi con una domanda per stimolare commenti`,
          tips: 'Pubblica tra le 18:00 e le 20:00 per massimo reach.'
        }),
        fallback: true
      };
    }
  }
);