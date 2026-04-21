// src/lib/metrics-explainer.ts

export interface MetricEstimate {
  label: string;
  min: number;
  max: number;
  basis: string;
  confidence: 'low' | 'medium' | 'high';
}

// Stima basata su task_type reale (ACTION, LEARNING, KPI) + parole chiave nel titolo
export function getTaskMetricEstimate(
  taskType: string,
  platform: string,
  taskTitle?: string
): MetricEstimate {

  const title = (taskTitle || '').toLowerCase();
  const type  = (taskType  || '').toLowerCase();
  const plat  = (platform  || '').toLowerCase();

  // --- Keyword matching sul titolo del task ---
  if (title.includes('bio') || title.includes('profilo')) {
    return { label: 'visite profilo', min: 15, max: 40, confidence: 'medium',
      basis: 'Bio ottimizzata aumenta il tasso di conversione da visita a follow del 20-35%' };
  }
  if (title.includes('story') || title.includes('storie')) {
    return { label: 'visualizzazioni story', min: 30, max: 80, confidence: 'medium',
      basis: 'Le story raggiungono in media il 10-15% dei follower per account <1k' };
  }
  if (title.includes('reel') || title.includes('video')) {
    return { label: 'visualizzazioni', min: 80, max: 400, confidence: 'low',
      basis: 'I Reel hanno reach organico più alto dei post statici (2-5x in media)' };
  }
  if (title.includes('commento') || title.includes('comment')) {
    return { label: 'nuove connessioni', min: 3, max: 12, confidence: 'low',
      basis: 'Commento mirato in nicchia: 15-25% di tasso di risposta e follow-back' };
  }
  if (title.includes('hashtag') || title.includes('caption')) {
    return { label: 'reach aggiuntivo', min: 20, max: 60, confidence: 'low',
      basis: 'Hashtag research riduce il tempo per raggiungere persone fuori dai follower' };
  }
  if (title.includes('dm') || title.includes('messaggio') || title.includes('contatt')) {
    return { label: 'conversazioni avviate', min: 2, max: 8, confidence: 'medium',
      basis: 'DM a freddo con contesto: tasso di risposta 20-40% in nicchie di business' };
  }
  if (title.includes('collabor') || title.includes('partner') || title.includes('creator')) {
    return { label: 'follower potenziali', min: 30, max: 150, confidence: 'low',
      basis: 'Una collaborazione con account simile porta visibilità incrociata' };
  }
  if (title.includes('post') || title.includes('pubblica') || title.includes('contenuto')) {
    return { label: 'engagement', min: 8, max: 30, confidence: 'medium',
      basis: 'Post con hook efficace: engagement rate 2-5% su account in crescita' };
  }
  if (title.includes('analytic') || title.includes('insight') || title.includes('statistich')) {
    return { label: 'decisioni migliori', min: 1, max: 1, confidence: 'high',
      basis: 'Leggere gli analytics settimanalmente riduce il tempo sprecato su contenuti inefficaci' };
  }
  if (title.includes('strategia') || title.includes('piano') || title.includes('obiettivo')) {
    return { label: 'ore risparmiate a settimana', min: 1, max: 3, confidence: 'medium',
      basis: 'Un piano editoriale riduce il tempo di creazione contenuti del 30-40%' };
  }
  if (title.includes('follow') || title.includes('audience')) {
    return { label: 'nuovi follower', min: 5, max: 25, confidence: 'low',
      basis: 'Attività mirata di networking organico porta 5-25 follower qualificati a settimana' };
  }

  // --- Fallback per task_type + piattaforma ---
  if (type === 'action') {
    if (plat.includes('tiktok')) {
      return { label: 'visualizzazioni', min: 50, max: 300, confidence: 'low',
        basis: 'TikTok ha reach organico molto alto per account nuovi (algoritmo favorisce nuovi creator)' };
    }
    if (plat.includes('linkedin')) {
      return { label: 'impression', min: 20, max: 80, confidence: 'medium',
        basis: 'Post LinkedIn con hook testuale: 200-500 impression per account <500 connessioni' };
    }
    return { label: 'engagement', min: 5, max: 20, confidence: 'low',
      basis: 'Task azione diretta: impatto variabile in base alla qualità di esecuzione' };
  }

  if (type === 'learning') {
    return { label: 'competenza acquisita', min: 1, max: 1, confidence: 'high',
      basis: 'Il training si traduce in miglioramento misurabile nei contenuti delle settimane successive' };
  }

  // Default finale onesto
  return { label: 'interazioni stimate', min: 3, max: 15, confidence: 'low',
    basis: 'Stima conservativa. Monitora i tuoi analytics per dati precisi sul tuo account' };
}

export function formatEstimate(metric: MetricEstimate): string {
  const icon = { low: '📊', medium: '📈', high: '✅' }[metric.confidence];
  if (metric.min === metric.max && metric.min === 1) {
    return `${icon} ${metric.label}`;
  }
  return `${icon} +${metric.min}–${metric.max} ${metric.label} (stima)`;
}

export function getTransparencyNote(metric: MetricEstimate): string {
  return `${metric.basis}. I risultati reali dipendono dalla tua nicchia, dalla qualità del contenuto e dalla costanza. Usa i tuoi analytics per dati precisi.`;
}
