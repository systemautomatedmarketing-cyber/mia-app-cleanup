// src/api/ai.ts
import { onCall, CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// ✅ Prompt templates (uguali a prima)
export const PROMPT_TEMPLATES = {
  generate_content: (taskTitle: string, context: string) => `
Genera contenuto pronto all'uso per: "${taskTitle}".
Contesto utente: ${context}
Tono: professionale ma accessibile. Lunghezza: concisa.
Output ESCLUSIVAMENTE in formato JSON, senza markdown:
{ "content": "testo pronto da copiare", "tips": "1 consiglio di pubblicazione" }
`,
  generate_task: (platform: string, goal: string, level: string, day: number) => `
Sei un esperto di crescita su ${platform}. Genera UN task pratico per il Giorno ${day}, mirato a: ${goal}. Livello: ${level}.
Requisiti: max 10 min, azione concreta, risultato misurabile.
Output JSON: { "title": "...", "instructions": "...", "estimated_time": "5 min", "task_type": "ACTION", "expected_result": "+X visite", "why_it_works": "..." }
`
} as const;

// ✅ Funzione con Gemini (gratuito)
export const generateTaskAI = onCall(
  { memory: "256MiB", timeoutSeconds: 30 },
  async (request: CallableRequest<{ taskId: string; variables: Record<string, string> }>) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
    
    const { taskId, variables } = request.data;
    const userId = request.auth.uid;

    // Verifica crediti
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const isFree = userData?.plan === 'FREE' || userData?.plan === 'TRIAL';
    const credits = Number(userData?.creditsBalance || 0);
    
    if (isFree && credits <= 0) {
      throw new HttpsError('permission-denied', 'Crediti insufficienti');
    }

    const prompt = PROMPT_TEMPLATES.generate_content(
      variables?.topic || taskId, 
      variables?.context || ''
    );
    
    try {
      // ✅ CHIAMATA GEMINI (senza librerie esterne, solo fetch)
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: output }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
              responseMimeType: "application/json" // Gemini 2.0 supporta JSON nativo!
            }
          })
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Gemini API error: ${response.status}`);
      }

      const geminiData = await response.json();
      const rawOutput = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || output; // '{}';

      return json({ output: aiOutput, creditsDeducted: isPro ? 0 : cost }, 200, origin);

      // Parsa JSON (Gemini 2.0 lo restituisce già parsato se usi responseMimeType)
      const parsed = typeof rawOutput === 'string' 
        ? JSON.parse(rawOutput.match(/\{[\s\S]*\}/)?.[0] || '{}') 
        : rawOutput;

      // Scala credito
      if (isFree) {
        await db.collection('users').doc(userId).update({
          creditsBalance: admin.firestore.FieldValue.increment(-1)
        });
      }

      return { 
        success: true, 
        output: JSON.stringify({
          content: parsed.content || parsed.text || rawOutput,
          tips: parsed.tips || parsed.advice || ''
        })
      };

    } catch (error: any) {
      console.error('Gemini generation failed:', error);
      
      // ✅ FALLBACK manuale (mai lasciare l'utente a mani vuote)
      return {
        success: true,
        output: JSON.stringify({
          content: `Template per "${variables?.topic || taskId}":\n\n1. Scrivi 3 frasi sulla tua esperienza\n2. Usa un tono diretto e personale\n3. Chiudi con una domanda per stimolare commenti`,
          tips: 'Pubblica tra 18:00-20:00 per massimo reach.',
        }),
        fallback: true,
        error: error.message
      };
    }
  }
);