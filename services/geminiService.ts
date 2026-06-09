
import { GoogleGenAI } from "@google/genai";
import { DecisionState } from "../types";

export const analyzeDecision = async (state: DecisionState): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Sen uzman bir çok kriterli karar destek sistemleri danışmanısın. Aşağıdaki karar matrisini değerlendir ve Türkçe olarak açıkla.

    Kriterler:
    ${state.criteria.map(c => `- ${c.name}: ${Math.round(c.weight * 100)}% ağırlık, ${c.isBenefit ? 'yüksek daha iyi' : 'düşük daha iyi'}`).join('\n')}

    Alternatifler:
    ${state.results.map((r) => {
      const alt = state.alternatives.find((a) => a.id === r.alternativeId);
      return `- ${r.rank}. ${r.name} (Skor: ${r.totalScore.toFixed(3)}) | ${JSON.stringify(alt?.scores)}`;
    }).join('\n')}

    Aşağıdaki başlıklarda kısa, net ve kurumsal bir açıklama yaz:
    1. Bu karar neden alındı? (En güçlü kriterler ve öne çıkan alternatifler)
    2. Hangi kriterler çatışıyor ve nerede trade-off var?
    3. Eğer bir kriterin ağırlığı yüksekse nasıl değişir?
    4. Tavsiye ve dikkat edilmesi gereken stratejik risk.

    Cevabı kısa ama etkili tut, 4-5 cümle içinde olsun.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "Analiz üretilemedi.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI analizi sırasında bir hata oluştu. Lütfen tekrar deneyin.";
  }
};
