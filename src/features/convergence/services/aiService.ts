import { Estimation, RoundStats } from '../../../types';

/**
 * Orquestador de IA para el análisis de convergencia.
 * Utiliza exclusivamente Groq (Llama 3) para máxima velocidad.
 * Fallback a análisis estadístico local en caso de ausencia de API Key.
 */
export const analyzeConsensus = async (
  estimations: Estimation[],
  stats: RoundStats,
  unit: string,
  signal?: AbortSignal
): Promise<{ level: 'Alta' | 'Media' | 'Baja'; recommendation: string; aiInsights: string }> => {
  
  // @ts-ignore - Vite env
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
  
  // 1. Prioridad: Groq (Llama 3.3 70B)
  if (groqApiKey) {
    try {
      return await analyzeWithGroq(estimations, stats, unit, groqApiKey, signal);
    } catch (error) {
      if ((error as any).name === 'AbortError') throw error;
      console.error("Groq Analysis failed, falling back to Statistics:", error);
    }
  }

  // 2. Fallback: Análisis Estadístico Local (Sin IA / No requiere API Keys)
  return fallbackAnalysis(stats) as { level: 'Alta' | 'Media' | 'Baja'; recommendation: string; aiInsights: string };
};

/**
 * Implementación con Groq (Format compatible con OpenAI vía fetch nativo)
 */
async function analyzeWithGroq(estimations: Estimation[], stats: RoundStats, unit: string, apiKey: string, signal?: AbortSignal) {
  const prompt = buildAnalysisPrompt(estimations, stats, unit);
  
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { 
          role: "system", 
          content: "Eres un Facilitador Maestro Senior experto en el Método Delphi. Responde siempre en JSON." 
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    }),
    signal
  });

  if (!response.ok) throw new Error(`Groq API error: ${response.statusText}`);
  
  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content) as { level: 'Alta' | 'Media' | 'Baja'; recommendation: string; aiInsights: string };
}

function buildAnalysisPrompt(estimations: Estimation[], stats: RoundStats, unit: string) {
  // B-012: Asegurar que el prompt no exceda los tokens (limitar justificaciones a 400 chars)
  const MAX_JUSTIFICATION_LENGTH = 400;
  
  const justificationContext = estimations
    .map(e => {
      const truncated = e.justification.length > MAX_JUSTIFICATION_LENGTH
        ? e.justification.substring(0, MAX_JUSTIFICATION_LENGTH) + ' (truncado...)'
        : e.justification;
      return `- Valor: ${e.value} ${unit}. Justificación: "${truncated}"`;
    })
    .join('\n');

  return `
    Analiza la convergencia de la siguiente ronda de estimación en EstimaPro:
    
    UNIDAD: ${unit}
    ESTADÍSTICAS:
    - Media: ${stats.mean} | Mediana: ${stats.median}
    - Desviación: ${stats.stdDev} | CV: ${stats.coefficientOfVariation}%
    - IQR: ${stats.iqr} | Outliers: ${stats.outlierEstimationIds.length}

    JUSTIFICACIONES:
    ${justificationContext}
    
    Genera un dictamen formal en JSON:
    {
      "level": "Alta" | "Media" | "Baja",
      "recommendation": "Acción inmediata recomendada",
      "aiInsights": "Análisis profundo de la dispersión de datos y coherencia técnica."
    }
  `;
}

/**
 * Fallback heurístico basado en estadísticas de dispersión
 */
const fallbackAnalysis = (stats: RoundStats) => {
  const cv = stats.coefficientOfVariation;
  const isHighConformity = cv < 15;
  const isModerateConformity = cv < 25;

  return {
    level: isHighConformity ? 'Alta' : isModerateConformity ? 'Media' : 'Baja',
    recommendation: isHighConformity 
      ? 'Consenso alcanzado. Proceder a consolidación.' 
      : isModerateConformity 
        ? 'Discutir discrepancias en la próxima ronda Delphi.' 
        : 'Revisar requisitos de la tarea detalladamente.',
    aiInsights: `Análisis automático: Coeficiente de Variación=${cv.toFixed(2)}%. Dispersión ${isHighConformity ? 'mínima' : isModerateConformity ? 'aceptable' : 'elevada'}.`
  };
};
