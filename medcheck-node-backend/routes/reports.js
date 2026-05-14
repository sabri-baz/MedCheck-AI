const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { Report } = require('../models');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const reports = await Report.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
    res.json(reports);
  } catch (error) {
    console.error('Raporları getirme hatası:', error.message);
    res.status(500).json({ error: 'Raporlar yüklenirken bir hata oluştu.' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { medicines, riskLevel, aiMessage } = req.body;

    if (!medicines || !aiMessage) {
      return res.status(400).json({ error: 'İlaçlar ve AI mesajı gereklidir.' });
    }

    const newReport = await Report.create({
      userId,
      medicines,
      riskLevel: riskLevel || 'low_risk',
      aiMessage
    });

    res.status(201).json(newReport);
  } catch (error) {
    console.error('Rapor ekleme hatası:', error.message);
    res.status(500).json({ error: 'Rapor eklenirken bir hata oluştu.' });
  }
});

module.exports = router;
