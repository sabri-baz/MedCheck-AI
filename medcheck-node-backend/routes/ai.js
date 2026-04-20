const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    // Expected to receive an array of medicine names or the new medicine info
    const { medicines } = req.body; // array of strings (medicine names)
    
    if (!medicines || !Array.isArray(medicines)) {
      return res.status(400).json({ error: 'Invalid payload. Expected an array of medicine names.' });
    }

    const lowerCaseMedicines = medicines.map(m => typeof m === 'string' ? m.toLowerCase() : '');

    let warningLevel = 'Low';
    let message = 'No known significant interactions detected based on the current data.';

    // Simulated rule-based logic
    if (lowerCaseMedicines.includes('aspirin') && lowerCaseMedicines.includes('warfarin')) {
      warningLevel = 'High';
      message = 'Yüksek Kanama Riski! Aspirin ve Warfarin birlikte kullanımı kanama riskini ciddi oranda artırabilir.';
    } else if (lowerCaseMedicines.includes('lisinopril') && lowerCaseMedicines.includes('potasyum')) {
      warningLevel = 'Medium';
      message = 'Orta Risk! Lisinopril ve Potasyum takviyesi hiperkalemi (yüksek potasyum) riskini artırabilir.';
    }

    res.json({
      level: warningLevel,
      message
    });
  } catch (error) {
    console.error('AI Analyze Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
