require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./src/config/database');
const errorHandler = require('./src/middleware/errorHandler');

// Route Importları
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');

const app = express();

// --- Middleware Yapılandırması ---
app.use(cors());
app.use(express.json()); // JSON gövdelerini okumak için zorunludur

// --- API Rotaları ---
app.use('/api/auth', authRoutes); // Register ve Login işlemleri
app.use('/api/user', userRoutes); // Kullanıcı profil işlemleri

// --- Temel Kontrol Rotası ---
app.get('/', (req, res) => {
  res.send('🚀 MedCheck AI API is running and healthy!');
});

// --- Merkezi Hata Yakalayıcı ---
// Not: Tüm rotalardan sonra tanımlanmalıdır
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

/**
 * SUNUCU BAŞLATMA VE VERİTABANI SENKRONİZASYONU
 */
async function startServer() {
  try {
    // 1. Adım: Veritabanına fiziksel bağlantı testi
    await sequelize.authenticate();
    console.log('✅ [Database]: Connection has been established successfully.');

    // 2. Adım: Modelleri Veritabanı ile Eşitle
    // 'alter: true' mevcut tabloları bozmadan modeldeki değişiklikleri uygular.
    await sequelize.sync({ alter: true });
    console.log('✅ [Database]: All models were synchronized successfully.');

    // 3. Adım: Dinlemeye Başla
    app.listen(PORT, () => {
      console.log('--------------------------------------------------');
      console.log(`🚀 [Server]: MedCheck AI is live at http://localhost:${PORT}`);
      console.log(`🛠️  [Mode]: Development`);
      console.log('--------------------------------------------------');
    });

  } catch (error) {
    console.error('❌ [Critical Error]: Unable to start the server:', error);
    process.exit(1); // Kritik hata durumunda uygulamayı güvenli bir şekilde kapat
  }
}

// Uygulamayı başlat
startServer();