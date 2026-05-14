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
const analyzeRisk = async (currentMedicines, newMedicine, patientProfile, fdaData) => {
  try {
    const fdaText = fdaData ? `
      - Adı: ${fdaData.brand_name} (${fdaData.generic_name})
      - Uyarılar: ${fdaData.warnings}
      - Etkileşimler: ${fdaData.drug_interactions}
      - Kullanım Amacı: ${fdaData.indications_and_usage}
    ` : `(Sistemde OpenFDA detayı bulunamadı, ancak ilacın farmakolojik adından yola çıkarak analiz yap.)`;

    const currentMedsList = currentMedicines && currentMedicines.length > 0 
      ? currentMedicines.map(m => m.name).join(', ') 
      : 'Yok';

    const allergies = patientProfile && patientProfile.allergies && patientProfile.allergies.length > 0
      ? patientProfile.allergies.join(', ')
      : 'Yok';

    const chronicDiseases = patientProfile && patientProfile.chronicDiseases && patientProfile.chronicDiseases.length > 0
      ? patientProfile.chronicDiseases.join(', ')
      : 'Yok';

    let prompt = `Sen uzman bir klinik farmakologsun. Hastanın mevcut ilaçları: [${currentMedsList}], eklemek istediği ilaç: [${newMedicine}]. Ayrıca hastanın şu alerjileri: [${allergies}] ve şu kronik hastalıkları: [${chronicDiseases}] bulunmaktadır. Sadece ilaç-ilaç etkileşimini değil, bu ilacın hastanın alerjileri veya hastalıklarıyla olan etkileşimini de kontrol et.\n\n`;

    prompt += `Yeni Eklenecek İlaç (FDA Verileri):\n${fdaText}\n\n`;
    prompt += `Lütfen bu bilgileri analiz et ve bana AŞAĞIDAKİ JSON FORMATINDA (SADECE JSON, BAŞKA METİN OLMASIN) Türkçe bir risk raporu döndür. 
Analiz sonucunu aşağıdaki ÜÇ seviyeden birine ayırarak dönmelisin:
- 'high_risk': Ölümcül, kesinlikle birlikte kullanılmaması veya hastanın hastalık/alerji durumunda kontrendike olan durumlar.
- 'medium_risk': Kullanılabilir ama dozaj veya zaman ayarlaması gereken durumlar.
- 'low_risk': Kullanımı genellikle güvenli olan durumlar.

{
  "riskLevel": "high_risk" VEYA "medium_risk" VEYA "low_risk",
  "riskTitle": "Örn: Penisilin Alerjisi Riski veya İlaç Etkileşimi",
  "aiMessage": "Etkileşim veya kullanım durumunu anlatan, hasta için anlaşılır 2-3 cümlelik Türkçe açıklama."
}`;

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
      riskLevel: "medium_risk",
      riskTitle: "Olası Risk Durumu",
      aiMessage: "Yapay zeka servisine ulaşılamadı, ancak risk olabilir. Lütfen doktorunuza danışın."
    };
  }
};

const analyzePrescriptionImage = async (base64Image) => {
  const prompt = `Sen uzman bir eczacısın. Gönderilen reçete veya ilaç kutusu fotoğrafını analiz et. Lütfen metin veya yorum yazma, SADECE aşağıdaki JSON formatında, eksiksiz bir çıktı ver:
{ 
  "name": "İlaç Adı", 
  "dosage": "Örn: 500mg veya 1 Kutu", 
  "frequency": "Örn: Günde 2 Defa", 
  "time": "Örn: 08:00 ve 20:00",
  "usage_instructions": "Bu ilacın farmakolojik standartlarına göre kullanım şeklini (Aç/Tok karnına, bol su ile, sütle içilmez vb.) kısa ve anlaşılır bir Türkçe ile 1-2 cümlelik tavsiye olarak yaz."
}
Eğer fotoğrafta bu verilerden biri okunmuyorsa, o alanın karşısına boş string ("") koy.`;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: "image/jpeg"
          }
        }
      ]);
      let responseText = result.response.text();
      
      responseText = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("AI geçerli bir JSON dönmedi. Gelen yanıt: " + responseText);
      }
    } catch (error) {
      console.error(`[HATA] ${modelName} OCR analizi patladı. Sebep: ${error.message}`);
      continue;
    }
  }
  throw new Error("Hiçbir Gemini modeli fotoğrafı analiz edemedi.");
};

module.exports = {
  analyzeRisk,
  analyzePrescriptionImage
};
