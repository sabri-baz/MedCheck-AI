const express = require('express');
const { Medicine } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const medicines = await Medicine.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(medicines);
  } catch (error) {
    console.error('Fetch Medicines Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, dosage, time, isActive } = req.body;
    
    if (!name || !dosage || !time) {
      return res.status(400).json({ error: 'Name, dosage, and time are required fields.' });
    }

    const newMedicine = await Medicine.create({
      name,
      dosage,
      time,
      isActive: isActive !== undefined ? isActive : true,
      userId: req.user.id
    });

    res.status(201).json(newMedicine);
  } catch (error) {
    console.error('Add Medicine Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
