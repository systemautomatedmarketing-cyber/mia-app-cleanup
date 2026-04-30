// client/src/components/LegalDialogs.tsx
// Termini di Servizio e Privacy Policy di Social Growth Engine
// Ultimo aggiornamento: aprile 2026
//
// ⚠️  NOTA: Questo documento è stato generato come base legale standard.
//     Si raccomanda la revisione da parte di un professionista legale
//     prima del lancio pubblico, in particolare per la conformità GDPR.

import { useState, useRef, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, FileText, Shield } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: sezione del documento
// ─────────────────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-bold text-slate-900 text-sm mt-5 first:mt-0">{title}</h3>
      <div className="text-xs text-slate-600 leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TERMINI DI SERVIZIO
// ─────────────────────────────────────────────────────────────────────────────
export function TermsDialog({ trigger }: { trigger: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl w-[calc(100vw-24px)] rounded-2xl p-0 gap-0 max-h-[90dvh] flex flex-col">

        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">Termini di Servizio</DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">Social Growth Engine · Ultimo aggiornamento: aprile 2026</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 overscroll-contain">
          <div className="space-y-1 pb-4">

            <Section title="1. Accettazione dei Termini">
              <p>
                Accedendo o utilizzando la piattaforma Social Growth Engine ("Servizio"), disponibile all'indirizzo
                appsge.webstudioams.it, accetti di essere vincolato dai presenti Termini di Servizio.
                Se non accetti questi termini, ti preghiamo di non utilizzare il Servizio.
              </p>
              <p>
                Il Servizio è fornito da WebStudioAMS, con sede legale in Italia.
                Per qualsiasi comunicazione: info@webstudioams.it
              </p>
            </Section>

            <Section title="2. Descrizione del Servizio">
              <p>
                Social Growth Engine è una piattaforma di crescita social che fornisce:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Piani di azione giornalieri personalizzati per la crescita sui social media</li>
                <li>Generazione di contenuti tramite intelligenza artificiale (AI)</li>
                <li>Tracciamento dei progressi verso obiettivi di crescita definiti dall'utente</li>
                <li>Percorsi guidati da 30, 60 o 90 giorni</li>
                <li>Notifiche e promemoria giornalieri via push notification</li>
              </ul>
            </Section>

            <Section title="3. Account e Registrazione">
              <p>
                Per utilizzare il Servizio è necessario creare un account fornendo un indirizzo
                email valido e una password. 
              </p>
              <p>
              Sei responsabile di:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Mantenere la riservatezza delle credenziali di accesso</li>
                <li>Tutte le attività che si svolgono sotto il tuo account</li>
                <li>Notificare immediatamente WebStudioAMS di qualsiasi accesso non autorizzato</li>
                <li>Fornire informazioni accurate e aggiornate durante la registrazione</li>
              </ul>
              <p>
                WebStudioAMS si riserva il diritto di sospendere o terminare gli account che
                violino i presenti Termini.
              </p>
            </Section>

            <Section title="4. Piani e Pagamenti">
              <p>
                Il Servizio è disponibile nelle seguenti modalità:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Piano Trial:</strong> accesso gratuito per 30 giorni con funzionalità complete</li>
                <li><strong>Piano FREE:</strong> accesso con crediti limitati dopo la scadenza del trial (tramite richiesta)</li>
                <li><strong>Piano PRO:</strong> pagamento una tantum che sblocca tutte le funzionalità senza limiti</li>
                <li><strong>Crediti AI:</strong> acquistabili separatamente per la generazione di contenuti</li>
              </ul>
              <p>
                Tutti i pagamenti sono elaborati in modo sicuro tramite Stripe. Social Growth Engine e WebStudioAMS
                non conservano i dati della tua carta di credito. I prezzi indicati includono l'IVA
                applicabile.
              </p>
            </Section>

            <Section title="5. Politica di Rimborso">
              <p>
                Hai diritto al rimborso completo entro 14 giorni dalla data di acquisto, senza
                necessità di fornire motivazioni, conformemente alla normativa europea sul diritto
                di recesso (Direttiva 2011/83/UE).
              </p>
              <p>
                Per richiedere un rimborso scrivi a info@webstudioams.it indicando il numero
                dell'ordine. Il rimborso verrà elaborato entro 5-10 giorni lavorativi sul metodo
                di pagamento originale. I crediti AI utilizzati non sono rimborsabili.
              </p>
            </Section>

            <Section title="6. Contenuti Generati dall'AI">
              <p>
                I contenuti generati dall'intelligenza artificiale sono forniti a scopo orientativo.
                Social Growth Engine non garantisce che i contenuti generati siano sempre accurati,
                appropriati o idonei allo scopo. L'utente è l'unico responsabile dell'utilizzo
                e della pubblicazione di qualsiasi contenuto generato tramite il Servizio.
              </p>
              <p>
                I contenuti generati dall'AI non devono essere utilizzati per diffondere
                informazioni false, violare diritti di terzi o per qualsiasi scopo illegale.
              </p>
            </Section>

            <Section title="7. Proprietà Intellettuale">
              <p>
                Il Servizio, inclusi logo, design, testi e software, è di proprietà esclusiva
                di WebStudioAMS e protetto dalle leggi sul copyright. È vietata la riproduzione,
                distribuzione o modifica senza autorizzazione scritta.
              </p>
              <p>
                I contenuti che carichi o crei attraverso il Servizio rimangono di tua proprietà.
                Concedi a WebStudioAMS una licenza limitata, non esclusiva, per utilizzare tali
                contenuti esclusivamente al fine di fornire il Servizio.
              </p>
            </Section>

            <Section title="8. Limitazione di Responsabilità">
              <p>
                Nella misura massima consentita dalla legge applicabile, WebStudioAMS non sarà
                responsabile per danni indiretti, incidentali, speciali o conseguenti derivanti
                dall'uso o dall'impossibilità di utilizzare il Servizio, inclusa la perdita di
                dati o profitti.
              </p>
              <p>
                La responsabilità totale di WebStudioAMS nei tuoi confronti non supererà l'importo
                da te pagato per il Servizio negli ultimi 12 mesi.
              </p>
            </Section>

            <Section title="9. Modifiche ai Termini">
              <p>
                WebStudioAMS si riserva il diritto di modificare questi Termini in qualsiasi momento.
                Le modifiche significative saranno comunicate via email con almeno 14 giorni di
                anticipo. L'uso continuato del Servizio dopo la notifica costituisce accettazione
                dei nuovi Termini.
              </p>
            </Section>

            <Section title="10. Legge Applicabile e Foro Competente">
              <p>
                I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia
                derivante dall'utilizzo del Servizio, il foro competente esclusivo è quello del
                luogo di residenza o domicilio del consumatore, conformemente al Codice del Consumo
                (D.Lgs. 206/2005).
              </p>
            </Section>

          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-slate-100 flex-shrink-0">
          <p className="text-xs text-slate-400 text-center w-full">
            Per domande: info@webstudioams.it
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIVACY POLICY
// ─────────────────────────────────────────────────────────────────────────────
export function PrivacyDialog({ trigger }: { trigger: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl w-[calc(100vw-24px)] rounded-2xl p-0 gap-0 max-h-[90dvh] flex flex-col">

        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">Privacy Policy</DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">Social Growth Engine · Informativa GDPR · aprile 2026</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 overscroll-contain">
          <div className="space-y-1 pb-4">

            <Section title="1. Titolare del Trattamento">
              <p>
                Il Titolare del trattamento dei dati personali è WebStudioAMS, raggiungibile
                all'indirizzo email info@webstudioams.it per qualsiasi richiesta relativa
                ai tuoi dati personali.
              </p>
            </Section>

            <Section title="2. Dati che Raccogliamo">
              <p>Raccogliamo le seguenti categorie di dati:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong>Dati di registrazione:</strong> indirizzo email, password (cifrata),
                  nome e cognome (facoltativi)
                </li>
                <li>
                  <strong>Dati di onboarding:</strong> piattaforme social, tipo di attività,
                  obiettivi di crescita, follower attuali e target
                </li>
                <li>
                  <strong>Dati di utilizzo:</strong> task completati, KPI inseriti, giorni
                  di attività, contenuti generati tramite AI
                </li>
                <li>
                  <strong>Dati tecnici:</strong> indirizzo IP, tipo di dispositivo, browser,
                  token per notifiche push (FCM)
                </li>
                <li>
                  <strong>Dati di pagamento:</strong> storico acquisti (elaborati da Stripe;
                  WebStudioAMS e Social Growth Engine non conservano dati delle carte)
                </li>
              </ul>
            </Section>

            <Section title="3. Finalità e Base Giuridica del Trattamento">
              <p>Trattiamo i tuoi dati per le seguenti finalità:</p>
              <ul className="list-disc pl-4 space-y-2">
                <li>
                  <strong>Erogazione del Servizio</strong> (base: esecuzione del contratto)
                  — creazione e gestione dell'account, personalizzazione del percorso,
                  generazione di task e contenuti AI, invio di notifiche push
                </li>
                <li>
                  <strong>Marketing e comunicazioni promozionali</strong> (base: consenso)
                  — invio di email con offerte, promozioni, aggiornamenti sul Servizio
                  e contenuti formativi. Puoi revocare il consenso in qualsiasi momento.
                </li>
                <li>
                  <strong>Analisi e miglioramento del Servizio</strong> (base: legittimo
                  interesse) — analisi aggregata e anonimizzata dell'utilizzo per migliorare
                  le funzionalità
                </li>
                <li>
                  <strong>Obblighi legali</strong> (base: obbligo legale) — conservazione
                  dei dati fiscali e contabili relativi agli acquisti
                </li>
              </ul>
            </Section>

            <Section title="4. Consenso al Marketing">
              <p>
                Registrandoti al Servizio e accettando la presente Privacy Policy, esprimi
                il tuo consenso esplicito al trattamento dei tuoi dati personali per finalità
                di marketing diretto, che include:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Invio di email promozionali su nuove funzionalità, offerte e promozioni</li>
                <li>Comunicazioni personalizzate basate sul tuo utilizzo del Servizio</li>
                <li>Notifiche push relative a offerte e aggiornamenti (se abilitate)</li>
                <li>Invio di contenuti formativi e suggerimenti per la crescita social</li>
              </ul>
              <p>
                Puoi revocare questo consenso in qualsiasi momento scrivendo a
                info@webstudioams.it o cliccando il link di disiscrizione presente in ogni
                email. La revoca del consenso non pregiudica la liceità del trattamento
                effettuato prima della revoca.
              </p>
            </Section>

            <Section title="5. Conservazione dei Dati">
              <p>
                Conserviamo i tuoi dati per il tempo necessario alle finalità indicate:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Dati dell'account: fino alla cancellazione dell'account + 30 giorni</li>
                <li>Dati di utilizzo: 24 mesi dall'ultima attività</li>
                <li>Dati fiscali e di pagamento: 10 anni (obbligo di legge)</li>
                <li>Token FCM per notifiche: rinnovati automaticamente ogni 7 giorni</li>
              </ul>
            </Section>

            <Section title="6. Condivisione dei Dati con Terze Parti">
              <p>
                Non vendiamo i tuoi dati personali. Li condividiamo esclusivamente con:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong>Google Firebase</strong> (autenticazione, database, notifiche push)
                  — UE/USA con garanzie adeguate (Standard Contractual Clauses)
                </li>
                <li>
                  <strong>Stripe</strong> (elaborazione pagamenti) — UE/USA con garanzie adeguate
                </li>
                <li>
                  <strong>Google (Gemini AI)</strong> (generazione contenuti AI) — i prompt
                  inviati all'AI includono dati di contesto del tuo profilo
                </li>
                <li>
                  <strong>Cloudflare</strong> (infrastruttura API) — UE/USA con garanzie adeguate
                </li>
              </ul>
              <p>
                Tutti i fornitori sono vincolati da accordi di trattamento dati (DPA) conformi
                al GDPR.
              </p>
            </Section>

            <Section title="7. Tuoi Diritti (GDPR)">
              <p>
                In quanto interessato, hai i seguenti diritti che puoi esercitare scrivendo
                a info@webstudioams.it:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Accesso:</strong> ottenere copia dei dati che trattiamo su di te</li>
                <li><strong>Rettifica:</strong> correggere dati inesatti o incompleti</li>
                <li><strong>Cancellazione:</strong> richiedere la rimozione dei tuoi dati ("diritto all'oblio")</li>
                <li><strong>Portabilità:</strong> ricevere i tuoi dati in formato strutturato e leggibile da macchina</li>
                <li><strong>Opposizione:</strong> opporti al trattamento per finalità di marketing</li>
                <li><strong>Limitazione:</strong> limitare il trattamento in determinate circostanze</li>
                <li><strong>Revoca del consenso:</strong> revocare in qualsiasi momento il consenso prestato</li>
              </ul>
              <p>
                Hai inoltre il diritto di proporre reclamo al Garante per la Protezione dei
                Dati Personali (www.garanteprivacy.it) se ritieni che il trattamento violi il GDPR.
              </p>
            </Section>

            <Section title="8. Cookie e Tecnologie di Tracciamento">
              <p>
                Il Servizio utilizza:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong>Cookie tecnici essenziali:</strong> necessari per il funzionamento
                  dell'autenticazione e della sessione utente
                </li>
                <li>
                  <strong>LocalStorage/SessionStorage:</strong> per preferenze dell'interfaccia
                  (es. prompt di installazione PWA)
                </li>
              </ul>
              <p>
                Non utilizziamo cookie di profilazione di terze parti né strumenti di analisi
                comportamentale che trasmettano dati a terzi senza il tuo consenso.
              </p>
            </Section>

            <Section title="9. Sicurezza dei Dati">
              <p>
                Adottiamo misure tecniche e organizzative adeguate per proteggere i tuoi dati,
                tra cui:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Crittografia delle comunicazioni (HTTPS/TLS)</li>
                <li>Password cifrate con algoritmi sicuri (gestione affidata a Firebase Auth)</li>
                <li>Regole di accesso al database (Firestore Security Rules)</li>
                <li>Autenticazione tramite token JWT con scadenza automatica</li>
              </ul>
            </Section>

            <Section title="10. Modifiche alla Privacy Policy">
              <p>
                Potremo aggiornare questa informativa periodicamente. Le modifiche
                significative saranno comunicate via email con almeno 14 giorni di anticipo.
                La versione aggiornata sarà sempre disponibile nell'app.
              </p>
            </Section>

          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-slate-100 flex-shrink-0">
          <p className="text-xs text-slate-400 text-center w-full">
            Garante Privacy: www.garanteprivacy.it · Contatti: info@webstudioams.it
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE CONSENSO — da usare in Auth.tsx nel tab registrazione
// Mostra la checkbox di accettazione con link ai dialog
// ─────────────────────────────────────────────────────────────────────────────
export function ConsentCheckbox({
  accepted,
  onChange,
}: {
  accepted: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 bg-slate-50 rounded-xl px-3 py-3 border border-slate-200">
      <button
        type="button"
        onClick={() => onChange(!accepted)}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
          accepted
            ? "bg-indigo-600 border-indigo-600"
            : "bg-white border-slate-300 hover:border-indigo-400"
        }`}
        aria-checked={accepted}
        role="checkbox"
      >
        {accepted && <Check className="w-3 h-3 text-white" />}
      </button>
      <p className="text-xs text-slate-600 leading-relaxed">
        Ho letto e accetto i{" "}
        <TermsDialog
          trigger={
            <button type="button" className="font-semibold text-indigo-600 hover:underline">
              Termini di Servizio
            </button>
          }
        />
        {" "}e la{" "}
        <PrivacyDialog
          trigger={
            <button type="button" className="font-semibold text-indigo-600 hover:underline">
              Privacy Policy
            </button>
          }
        />
        {" "}di Social Growth Engine, incluso il consenso al trattamento dei miei dati
        per finalità di marketing e comunicazioni promozionali.
      </p>
    </div>
  );
}
