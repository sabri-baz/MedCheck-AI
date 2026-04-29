require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const modelsToTry = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];

/**
 * Gemini AI kullanarak ilaçlar arası risk analizi yapar.
 * @param {Object} fdaData OpenFDA servisinden dönen yeni ilaç verileri
 * @param {Array} currentMedicines Kullanıcının halihazırda kullandığı ilaçlar listesi
 * @returns {Object} JSON formatında risk analizi
 */
const analyzeRisk = async (fdaData, currentMedicines) => {
  try {
    const fdaText = fdaData ? `
      - Adı: ${fdaData.brand_name} (${fdaData.generic_name})
      - Uyarılar: ${fdaData.warnings}
      - Etkileşimler: ${fdaData.drug_interactions}
      - Kullanım Amacı: ${fdaData.indications_and_usage}
    ` : `(Sistemde OpenFDA detayı bulunamadı, ancak ilacın farmakolojik adından yola çıkarak analiz yap.)`;

    const currentMedsText = currentMedicines && currentMedicines.length > 0 
      ? currentMedicines.map(m => `- ${m.name} (${m.dosage})`).join('\n') 
      : 'Kullanıcının sisteme kayıtlı başka ilacı yok.';

    const prompt = `
      Sen uzman bir klinik farmakologsun. Amacın, hastanın listesine yeni eklenen bir ilacın mevcut ilaçlarıyla etkileşimini analiz etmektir.
      
      Yeni Eklenecek İlaç (FDA Verileri):
      ${fdaText}

      Hastanın Mevcut İlaçları:
      ${currentMedsText}

      Lütfen bu bilgileri analiz et ve bana AŞAĞIDAKİ JSON FORMATINDA (SADECE JSON, BAŞKA METİN OLMASIN) Türkçe bir risk raporu döndür. 
      Eğer kritik ve tehlikeli bir etkileşim varsa 'high_risk' olarak işaretle.
      
      {
        "risk_score": 1 ile 100 arasında bir sayı (risk düzeyi),
        "risk_level": "high_risk" VEYA "medium_risk" VEYA "low_risk",
        "short_explanation": "Etkileşim durumunu anlatan, hasta için anlaşılır 2-3 cümlelik Türkçe açıklama."
      }
    `;

    // Modelleri sırayla dene (Fallback mekanizması)
    console.log('🔑 API Key Durumu:', process.env.GEMINI_API_KEY ? 'Yüklendi (Gizli)' : 'BULUNAMADI - .env hatası!');
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        let responseText = result.response.text();
        
        // Sadece JSON kısmını ayıkla ve Markdown işaretlerini temizle
        responseText = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("AI geçerli bir JSON dönmedi. Gelen yanıt: " + responseText);
        }
      } catch (error) {
        console.error(`[HATA] ${modelName} patladı. Sebep: ${error.message}`);
        continue; // Sonraki modele geç
      }
    }

    // Döngü biterse ve hiçbir model çalışmazsa
    throw new Error("Hiçbir Gemini modeli yanıt vermedi.");

  } catch (error) {
    console.error('Gemini AI Hatası:', error);
    // Güvenlik amaçlı varsayılan hata yanıtı
    return {
      risk_score: 50,
      risk_level: "Bilinmiyor",
      short_explanation: "Yapay zeka servisine ulaşılamadı, ancak risk olabilir. Lütfen doktorunuza danışın."
    };
  }
};

module.exports = {
  analyzeRisk
};
