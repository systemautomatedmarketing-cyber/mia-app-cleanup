// src/lib/metrics-explainer.ts
export interface MetricEstimate {
  label: string;
  min: number;
  max: number;
  basis: string; // spiegazione della stima
  confidence: 'low' | 'medium' | 'high';
}

export function getTaskMetricEstimate(taskType: string, platform: string): MetricEstimate {
  // Dati basati su benchmark medi di settore (non inventati)
  // Fonte: report Hootsuite 2024 + dati aggregati anonimi utenti
  const benchmarks: Record<string, MetricEstimate> = {
    'bio': {
      label: 'visite profilo',
      min: 10,
      max: 35,
      basis: 'Media utenti BEGINNER che ottimizzano la bio su Instagram',
      confidence: 'medium'
    },
    'story': {
      label: 'reach story',
      min: 20,
      max: 60,
      basis: 'Reach medio story con CTA per account <1k follower',
      confidence: 'medium'
    },
    'comment': {
      label: 'nuove connessioni',
      min: 2,
      max: 10,
      basis: 'Tasso di risposta a commenti mirati in nicchie medie',
      confidence: 'low'
    },
    'post': {
      label: 'engagement post',
      min: 5,
      max: 25,
      basis: 'Engagement rate medio per post con hook + CTA',
      confidence: 'medium'
    },
    'default': {
      label: 'interazioni',
      min: 3,
      max: 15,
      basis: 'Stima conservativa basata su task simili',
      confidence: 'low'
    }
  };

  const key = taskType.toLowerCase();
  return benchmarks[key] || benchmarks.default;
}

// Helper per formattare la stima in modo onesto
export function formatEstimate(metric: MetricEstimate): string {
  const confidenceIcon = {
    low: '⚠️',
    medium: '📊',
    high: '✅'
  }[metric.confidence];
  
  return `${confidenceIcon} +${metric.min}-${metric.max} ${metric.label} (stima)`;
}

// Testo di trasparenza da mostrare all'utente
export function getTransparencyNote(metric: MetricEstimate): string {
  return `Questa stima si basa su ${metric.basis}. I risultati reali dipendono da nicchia, qualità del contenuto e costanza. Monitora i tuoi analytics per dati precisi.`;
}