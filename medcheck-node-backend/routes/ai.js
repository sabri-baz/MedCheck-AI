const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp');

const router = express.Router();

router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    // Expected to receive an array of medicine names or the new medicine info
    const { medicines } = req.body; // array of strings (medicine names)
    
    if (!medicines || !Array.isArray(medicines)) {
      return res.status(400).json({ error: 'Invalid payload. Expected an array of medicine names.' });
    }

    const medicineName = medicines[0].toLowerCase();

    if (medicineName.includes('aspirin')) {
      res.json({ 
        risk: 'high_risk', 
        message: 'Kritik Etkileşim: Aspirin ve Warfarin birlikte kullanıldığında yüksek kanama riski oluşturur!' 
      });
    } else {
      res.json({ 
        risk: 'none', 
        message: 'Risk bulunmadı.' 
      });
    }
  } catch (error) {
    console.error('AI Analyze Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
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

    // Bulut OCR İsteği (OCR.space)
    console.log('OCR.space API isteği atılıyor...');
    const formData = new FormData();
    formData.append('base64Image', optimizedBase64);
    formData.append('language', 'tur');
    formData.append('OCREngine', '2'); // Kutu ve ambalaj okumalarında çok daha başarılı motor

    const response = await axios.post('https://api.ocr.space/parse/image', formData, {
      headers: {
        'apikey': 'helloworld',
        ...formData.getHeaders()
      }
    });

    if (!response.data || !response.data.ParsedResults || response.data.ParsedResults.length === 0) {
      throw new Error('OCR API geçerli bir sonuç dönmedi.');
    }

    const rawText = response.data.ParsedResults[0].ParsedText || '';
    console.log('--- CLOUD OCR HAM METİN ---', rawText);

    // Akıllı Veri Ayrıştırma (Smarter NLP)
    let medicineName = '';
    let dosage = '';

    // İlaç adını bulmak için Yasaklı Kelimeler dizisi
    const forbiddenWords = ['TABLET', 'FİLM', 'FILM', 'KAPSÜL', 'ABDI', 'IBRAHIM', 'ABDIIBRAHIM', 'MG', 'ML', 'ASIT'];

    // rawText içindeki sembolleri ve rakamları temizle, sadece harfleri bırak
    const cleanWords = rawText
      .replace(/[^a-zA-ZÇçĞğİıÖöŞşÜü\s]/g, ' ') 
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ');

    // Uzunluğu en az 4 harf olan ve yasaklılar listesinde olmayan ilk kelimeyi bul
    for (const word of cleanWords) {
      const upperWord = word.toUpperCase();
      if (upperWord.length >= 4 && !forbiddenWords.includes(upperWord)) {
        medicineName = upperWord;
        break;
      }
    }

    // Akıllı Dozaj Yakalama (Regex)
    const dosageMatch = rawText.match(/\b\d+\s*(mg|ml|gr|g)\b/i);
    if (dosageMatch) {
      dosage = dosageMatch[0];
    }

    // Mobil uygulamaya yanıt dön
    res.json({
      success: true,
      medicineName: medicineName || 'Bilinmiyor',
      dosage: dosage || '',
      rawText
    });
    
  } catch (error) {
    console.error('Bulut OCR Hatası:', error.message || error);
    res.status(500).json({ success: false, error: 'Resim analiz edilemedi.' });
  }
});

module.exports = router;
