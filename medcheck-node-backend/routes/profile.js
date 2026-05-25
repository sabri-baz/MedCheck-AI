const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { Profile } = require('../models');

const router = express.Router();

// Get or Create Profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const [profile, created] = await Profile.findOrCreate({
      where: { userId },
      defaults: {
        allergies: [],
        chronicDiseases: [],
        height: null,
        weight: null,
        bloodType: null
      },
      include: [{
        model: require('../models').User,
        as: 'user',
        attributes: ['fullName']
      }]
    });
    
    // findOrCreate doesn't eagerly load includes if created=true, so we fetch it again if needed
    let fullProfile = profile;
    if (created) {
      fullProfile = await Profile.findOne({
        where: { userId },
        include: [{
          model: require('../models').User,
          as: 'user',
          attributes: ['fullName']
        }]
      });
    }

    res.json(fullProfile);
  } catch (error) {
    console.error('Profile fetch/create error:', error);
    res.status(500).json({ error: 'Profil alınırken hata oluştu.' });
  }
});

// Update Profile
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { allergies, chronicDiseases, height, weight, bloodType, age } = req.body;
    
    let profile = await Profile.findOne({ where: { userId } });
    
    const updateData = {};
    if (allergies !== undefined) updateData.allergies = allergies;
    if (chronicDiseases !== undefined) updateData.chronicDiseases = chronicDiseases;
    if (height !== undefined) updateData.height = height;
    if (weight !== undefined) updateData.weight = weight;
    if (bloodType !== undefined) updateData.bloodType = bloodType;
    if (age !== undefined) updateData.age = age;

    if (!profile) {
      profile = await Profile.create({ userId, ...updateData });
    } else {
      await profile.update(updateData);
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profil güncellenirken hata oluştu.' });
  }
});

module.exports = router;
