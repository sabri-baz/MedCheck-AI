const express = require('express');
const { User, Medicine } = require('../models');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const usersCount = await User.count();
    const medicinesCount = await Medicine.count();

    // Health Checks Count can be a static dummy or we can just send total counts for now.
    res.json({
      healthChecksCount: Math.floor(Math.random() * 100) + 50, // Dummy random for now until HealthCheck model is done
      usersCount,
      medicinesCount
    });
  } catch (error) {
    console.error('Stats Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
