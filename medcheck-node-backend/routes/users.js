const express = require('express');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');
const { User } = require('../models');

const router = express.Router();

// Get Current User (including preferences)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'fullName', 'email', 'preferences']
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get User Error:', error);
    res.status(500).json({ error: 'Sunucu hatası oluştu.' });
  }
});

// Update Current User Info (fullName, etc)
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { fullName } = req.body;
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    if (fullName) user.fullName = fullName;
    
    await user.save();
    
    res.json({ message: 'Kullanıcı bilgileri güncellendi.', user: { id: user.id, fullName: user.fullName, email: user.email } });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ error: 'Kullanıcı bilgileri güncellenirken hata oluştu.' });
  }
});

// Change Password
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Mevcut ve yeni şifre gereklidir.' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Mevcut şifreniz yanlış.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Şifreniz başarıyla güncellendi.' });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ error: 'Şifre güncellenirken bir hata oluştu.' });
  }
});

// Update Preferences
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const { preferences } = req.body;
    
    if (!preferences) {
      return res.status(400).json({ error: 'Tercihler (preferences) objesi eksik.' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    // Merge existing preferences with new ones
    const currentPrefs = user.preferences || {};
    user.preferences = { ...currentPrefs, ...preferences };
    
    // In Sequelize with JSON columns, you sometimes need to trigger a change manually
    user.changed('preferences', true);
    await user.save();

    res.json({ message: 'Tercihiniz güncellendi.', preferences: user.preferences });
  } catch (error) {
    console.error('Update Preferences Error:', error);
    res.status(500).json({ error: 'Tercihler güncellenirken bir hata oluştu.' });
  }
});

module.exports = router;
