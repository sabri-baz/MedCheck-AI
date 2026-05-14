const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp');
const fdaService = require('../services/fdaService');
const aiService = require('../services/aiService');
const { Medicine, Report, Profile } = require('../models');

const router = express.Router();

router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { drugName, currentMedicines, isQuickCheck, newMedData } = req.body;
    
    if (!drugName) {
      return res.status(400).json({ error: 'Geçersiz veri. "drugName" alanı gereklidir.' });
    }

    // İstemciden gelen mevcut ilaç listesi dizi değilse boş dizi kabul et
    const activeMeds = Array.isArray(currentMedicines) ? currentMedicines : [];

    const formattedMeds = activeMeds.map(med => {
      if (typeof med === 'string') return { name: med, dosage: 'Belirtilmemiş' };
      return med;
    });

    let fdaData = null;
    try {
      fdaData = await fdaService.getDrugInfo(drugName);
    } catch (e) {
      console.warn('FDA verisi alınamadı, isim üzerinden analize devam ediliyor...');
    }

    let patientProfile = null;
    if (req.user && req.user.id) {
      patientProfile = await Profile.findOne({ where: { userId: req.user.id } });
    }

    const analysisResult = await aiService.analyzeRisk(formattedMeds, drugName, patientProfile, fdaData);

    let savedMedicine = null;

    if (req.user && req.user.id) {
      if (!isQuickCheck) {
        if (newMedData) {
          savedMedicine = await Medicine.create({
            userId: req.user.id,
            name: newMedData.name || drugName,
            dosage: newMedData.dosage || 'Standart Doz',
            time: newMedData.time || 'Günde 1',
            totalPills: newMedData.totalPills || 0,
            dailyDose: newMedData.dailyDose || 1
          });
        }

        const allMeds = [...activeMeds.map(m => m.name || m), drugName];
        await Report.create({
          userId: req.user.id,
          medicines: allMeds,
          riskLevel: analysisResult.riskLevel || 'medium_risk',
          aiMessage: analysisResult.aiMessage || 'Analiz sonucu alınamadı.'
        });
      }
    }

    res.json({ 
      risk: analysisResult.riskLevel || 'medium_risk', 
      title: analysisResult.riskTitle || 'İlaç Etkileşimi Riski',
      message: analysisResult.aiMessage || 'Analiz sonucu alınamadı.',
      savedMedicine: savedMedicine ? { ...savedMedicine.toJSON(), aiRiskLevel: analysisResult.riskLevel } : null
    });
    
  } catch (error) {
    console.error('AI Analyze Error:', error.message);
    res.status(500).json({ error: 'Yapay zeka analizi sırasında bir hata oluştu.' });
  }
});

router.post('/scan-image', authMiddleware, async (req, res) => {
  try {
    let { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ success: false, error: 'No image provided.' });
    }

    // Base64 prefix temizliği ve Buffer'a çevirme
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Sharp ile sadece Boyut Küçültme (Optimizasyon)
    console.log('Sharp optimizasyonu (boyut küçültme) başlıyor...');
    const optimizedBuffer = await sharp(imageBuffer)
      .resize({ width: 1000 })
      .jpeg({ quality: 80 })
      .toBuffer();
    console.log('Sharp optimizasyonu tamamlandı.');

    // Yeni Buffer'ı tekrar base64'e çevirme
    const optimizedBase64 = `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`;

    // Gemini AI (Yapay Zeka) ile Görüntü Analizi
    console.log('Gemini AI Görüntü Analizi (OCR) başlıyor...');
    const aiResult = await aiService.analyzePrescriptionImage(optimizedBuffer.toString('base64'));

    // Mobil uygulamaya JSON yanıtını doğrudan dön
    res.json({
      success: true,
      ...aiResult
    });
    
  } catch (error) {
    console.error('Bulut OCR Hatası:', error.message || error);
    res.status(500).json({ success: false, error: 'Resim analiz edilemedi.' });
  }
});

router.get('/fda/:drugName', async (req, res) => {
  try {
    const drugName = req.params.drugName;
    if (!drugName) {
      return res.status(400).json({ error: 'İlaç adı gerekli.' });
    }

    const drugInfo = await fdaService.getDrugInfo(drugName);
    
    if (!drugInfo) {
      return res.status(404).json({ error: 'İlaç OpenFDA veritabanında bulunamadı.' });
    }

    res.json(drugInfo);
  } catch (error) {
    console.error('FDA Route Error:', error.message);
    res.status(500).json({ error: 'FDA servisinden veri alınırken hata oluştu.' });
  }
});

router.post('/analyze-risk', authMiddleware, async (req, res) => {
  try {
    const { newMedicine } = req.body;
    if (!newMedicine || !newMedicine.name) {
      return res.status(400).json({ error: 'Yeni ilaç bilgileri eksik.' });
    }

    // 1. Fetch User Profile
    const profile = await Profile.findOne({ where: { userId: req.user.id } });
    const allergies = profile?.allergies?.length ? profile.allergies.join(', ') : 'Yok';
    const chronicDiseases = profile?.chronicDiseases?.length ? profile.chronicDiseases.join(', ') : 'Yok';

    // 2. Fetch User's Current Medicines
    const currentMeds = await Medicine.findAll({ where: { userId: req.user.id } });
    const currentMedsList = currentMeds.length ? currentMeds.map(m => m.name).join(', ') : 'Yok';

    // 3. Build Prompt
    const prompt = `Sen uzman bir farmakologsun. Hastanın eklemek istediği yeni ilacı, mevcut hastalıkları/alerjileri ve kullandığı diğer ilaçlarla (Örn: Aspirin ve Warfarin etkileşimi gibi) kıyasla. 

Hastanın Profil Bilgileri:
- Mevcut Hastalıkları: ${chronicDiseases}
- Alerjileri: ${allergies}
- Kullandığı Diğer İlaçlar: ${currentMedsList}

Yeni Eklenecek İlaç: ${newMedicine.name} (Doz: ${newMedicine.dosage || 'Belirtilmedi'})

SADECE şu JSON formatında yanıt ver (Asla markdown veya başka metin ekleme):
{
  "status": "safe" veya "danger",
  "title": "Başlık",
  "description": "Detaylı açıklama",
  "recommendation": "Tavsiye"
}`;

    // 4. Call Gemini
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    responseText = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedResult = JSON.parse(jsonMatch[0]);
      return res.json(parsedResult);
    } else {
      throw new Error("Geçerli bir JSON dönmedi.");
    }

  } catch (error) {
    console.error('Analyze Risk API Error:', error);
    res.status(500).json({ error: 'Risk analizi yapılırken sunucu hatası oluştu.' });
  }
});

module.exports = router;
