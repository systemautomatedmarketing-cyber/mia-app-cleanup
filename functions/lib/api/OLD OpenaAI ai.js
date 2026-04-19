"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTaskAI = exports.PROMPT_TEMPLATES = void 0;
// src/api/ai.ts
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const openai_1 = __importDefault(require("openai"));
// Inizializza Firebase Admin (solo se non già fatto in index.ts)
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
// ✅ Inizializza OpenAI con chiave da env
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY
});
// ✅ Prompt templates (puoi spostarli in un file condiviso se preferisci)
exports.PROMPT_TEMPLATES = {
    generate_content: (taskTitle, context) => `
Genera contenuto pronto all'uso per: "${taskTitle}".
Contesto utente: ${context}
Tono: professionale ma accessibile. Lunghezza: concisa.
Output ESCLUSIVAMENTE in formato JSON, senza markdown:
{ "content": "testo pronto da copiare", "tips": "1 consiglio di pubblicazione" }
`,
    generate_task: (platform, goal, level, day) => `
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
};
// ✅ Funzione AI con sintassi v2 CORRETTA
exports.generateTaskAI = (0, https_1.onCall)({ memory: "256MiB", timeoutSeconds: 30 }, // regione presa da setGlobalOptions in index.ts
async (request) => {
    // ✅ v2: auth è su request.auth, non su un secondo parametro
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Login required');
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
        throw new https_1.HttpsError('permission-denied', 'Crediti insufficienti');
    }
    // 3. Prepara prompt
    const prompt = exports.PROMPT_TEMPLATES.generate_content(variables?.topic || taskId, variables?.context || '');
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
    }
    catch (error) {
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
});
