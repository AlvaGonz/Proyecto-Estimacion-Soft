
import { GoogleGenAI, Type } from "@google/genai";
import { Estimation, RoundStats } from "../types";

export const analyzeConsensus = async (
  estimations: Estimation[],
  stats: RoundStats,
  unit: string
): Promise<{ level: 'Alta' | 'Media' | 'Baja'; recommendation: string; aiInsights: string }> => {
  // Initialize the Gemini API client using the API_KEY from environment variables.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Eres un Facilitador Maestro Senior certificado en el Método Wideband Delphi para Ingeniería de Software.
    Analiza estadísticamente y cualitativamente la siguiente ronda de estimación realizada en DelphiPro UCE:
    
    UNIDAD DE MEDIDA: ${unit}
    ESTADÍSTICAS CALCULADAS:
    - Media Aritmética: ${stats.mean}
    - Mediana: ${stats.median}
    - Desviación Estándar: ${stats.stdDev}
    - Coeficiente de Variación: ${stats.coefficientOfVariation}%
    - Rango Intercuartílico (IQR): ${stats.iqr}
    - Identificados como Outliers: ${stats.outliers.length} valores.

    JUSTIFICACIONES ANÓNIMAS DE LOS EXPERTOS:
    ${estimations.map(e => `- Valor Estimado: ${e.value} ${unit}. Justificación Técnica: "${e.justification}"`).join('\n')}
    
    TU OBJETIVO ES:
    1. Determinar el nivel de convergencia (Alta si CV < 15%, Media si CV < 25%, Baja si > 25%).
    2. Proporcionar una recomendación pragmática: ¿Finalizar o Abrir una Ronda 3/4? 
    3. Analizar las justificaciones para encontrar la causa raíz de la divergencia (por ejemplo: falta de comprensión de requisitos vs diferencias en arquitectura).

    FORMATO DE SALIDA (JSON):
    {
      "level": "Alta" | "Media" | "Baja",
      "recommendation": "Frase corta y directa",
      "aiInsights": "Párrafo analítico profundo enfocado en la mejora de la precisión"
    }
  `;

  try {
    // Generate the consensus analysis using Gemini 3 Pro for advanced reasoning.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            level: { type: Type.STRING, description: 'Nivel de convergencia' },
            recommendation: { type: Type.STRING, description: 'Siguiente paso metodológico' },
            aiInsights: { type: Type.STRING, description: 'Análisis detallado de la dispersión' }
          },
          required: ["level", "recommendation", "aiInsights"],
        },
        // Recommendation: Set both maxOutputTokens and thinkingConfig.thinkingBudget at the same time.
        maxOutputTokens: 6000,
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });

    // Safely parse the generated JSON response using the .text property (not a method).
    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (error) {
    console.error("Error analyzing consensus with Gemini Pro:", error);
    // Robust fallback based on statistical analysis of the CV (RF020).
    const cv = stats.coefficientOfVariation;
    return {
      level: cv < 15 ? 'Alta' : cv < 30 ? 'Media' : 'Baja',
      recommendation: cv < 20 ? 'Consenso alcanzado. Proceder a consolidación final.' : 'Abrir nueva ronda iterativa para reducir varianza.',
      aiInsights: `Análisis estadístico basado en un CV de ${cv}%. Se detecta una dispersión moderada. Se recomienda discutir las justificaciones de los valores atípicos identificados.`
    };
  }
};
