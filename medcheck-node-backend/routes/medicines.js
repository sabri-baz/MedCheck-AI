const express = require('express');
const { Medicine, MedicineLog } = require('../models');
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
    const { name, dosage, frequency, time, usage_instructions, isActive } = req.body;
    
    if (!name || !dosage || !time) {
      return res.status(400).json({ error: 'Name, dosage, and time are required fields.' });
    }

    const newMedicine = await Medicine.create({
      name,
      dosage,
      frequency,
      time,
      usage_instructions,
      isActive: isActive !== undefined ? isActive : true,
      userId: req.user.id
    });

    res.status(201).json(newMedicine);
  } catch (error) {
    console.error('Add Medicine Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const medicineId = req.params.id;
    const userId = req.user.id;

    const deletedCount = await Medicine.destroy({
      where: {
        id: medicineId,
        userId: userId
      }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'İlaç bulunamadı veya silmeye yetkiniz yok.' });
    }

    res.status(200).json({ message: 'İlaç başarıyla silindi' });
  } catch (error) {
    console.error('Delete Medicine Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/take', authMiddleware, async (req, res) => {
  try {
    const medicineId = req.params.id;
    const userId = req.user.id;

    const medicine = await Medicine.findOne({
      where: {
        id: medicineId,
        userId: userId
      }
    });

    if (!medicine) {
      return res.status(404).json({ error: 'İlaç bulunamadı.' });
    }

    medicine.lastTaken = new Date();
    await medicine.save();

    await MedicineLog.create({
      medicineId: medicine.id,
      userId: userId,
      status: 'taken',
      takenTime: new Date()
    });

    res.status(200).json({ message: 'İlaç alındı olarak işaretlendi.', medicine });
  } catch (error) {
    console.error('Take Medicine Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/time', authMiddleware, async (req, res) => {
  try {
    const medicineId = req.params.id;
    const { time } = req.body;
    
    if (!time) {
      return res.status(400).json({ error: 'Yeni saat gerekli.' });
    }

    const medicine = await Medicine.findOne({
      where: { id: medicineId, userId: req.user.id }
    });

    if (!medicine) {
      return res.status(404).json({ error: 'İlaç bulunamadı.' });
    }

    medicine.time = time;
    await medicine.save();

    res.status(200).json({ message: 'Saat güncellendi', medicine });
  } catch (error) {
    console.error('Update Time Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
