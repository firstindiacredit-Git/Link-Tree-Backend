const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const dbConnect = require('../lib/dbConnect');

// Get user profile by username (public)
router.get('/:username', async (req, res) => {
  await dbConnect();
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -email');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user profile (protected)
router.get('/me/profile', auth, async (req, res) => {
  await dbConnect();
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload avatar (protected)
router.post('/upload-avatar', auth, upload.single('avatar'), async (req, res) => {
  await dbConnect();
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    req.user.avatar = req.file.path;
    await req.user.save();
    
    res.json({ 
      message: 'Avatar uploaded successfully',
      avatar: req.file.path 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile (protected)
router.post('/update', auth, async (req, res) => {
  await dbConnect();
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['bio', 'theme', 'links'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates' });
    }

    updates.forEach(update => {
      req.user[update] = req.body[update];
    });

    await req.user.save();
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user account (protected)
router.delete('/me', auth, async (req, res) => {
  await dbConnect();
  try {
    await req.user.remove();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Increment link clicks (public)
router.post('/:username/links/:index/click', async (req, res) => {
  await dbConnect();
  try {
    const { username, index } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.links[index]) return res.status(404).json({ error: 'Link not found' });
    user.links[index].clicks = (user.links[index].clicks || 0) + 1;
    await user.save();
    res.json({ clicks: user.links[index].clicks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
