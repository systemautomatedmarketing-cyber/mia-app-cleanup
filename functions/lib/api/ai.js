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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTaskAI = exports.PROMPT_TEMPLATES = void 0;
// src/api/ai.ts
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length)
    admin.initializeApp();
const db = admin.firestore();
// ✅ Prompt templates (uguali a prima)
exports.PROMPT_TEMPLATES = {
    generate_content: (taskTitle, context) => `
Genera contenuto pronto all'uso per: "${taskTitle}".
Contesto utente: ${context}
Tono: professionale ma accessibile. Lunghezza: concisa.
Output ESCLUSIVAMENTE in formato JSON, senza markdown:
{ "content": "testo pronto da copiare", "tips": "1 consiglio di pubblicazione" }
`,
    generate_task: (platform, goal, level, day) => `
Sei un esperto di crescita su ${platform}. Genera UN task pratico per il Giorno ${day}, mirato a: ${goal}. Livello: ${level}.
Requisiti: max 10 min, azione concreta, risultato misurabile.
Output JSON: { "title": "...", "instructions": "...", "estimated_time": "5 min", "task_type": "ACTION", "expected_result": "+X visite", "why_it_works": "..." }
`
};
// ✅ Funzione con Gemini (gratuito)
exports.generateTaskAI = (0, https_1.onCall)({ memory: "256MiB", timeoutSeconds: 30 }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { taskId, variables } = request.data;
    const userId = request.auth.uid;
    // Verifica crediti
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const isFree = userData?.plan === 'FREE';
    const credits = Number(userData?.creditsBalance || 0);
    if (isFree && credits <= 0) {
        throw new https_1.HttpsError('permission-denied', 'Crediti insufficienti');
    }
    const prompt = exports.PROMPT_TEMPLATES.generate_content(variables?.topic || taskId, variables?.context || '');
    try {
        // ✅ CHIAMATA GEMINI (senza librerie esterne, solo fetch)
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey)
            throw new Error('GEMINI_API_KEY not configured');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500,
                    responseMimeType: "application/json" // Gemini 2.0 supporta JSON nativo!
                }
            })
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `Gemini API error: ${response.status}`);
        }
        const geminiData = await response.json();
        const rawOutput = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
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
    }
    catch (error) {
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
});
