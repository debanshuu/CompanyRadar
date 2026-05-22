const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendConfirmationEmail } = require('../utils/mailer');
const router = express.Router();

// ── SIGNUP ──
router.post('/signup', async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Email or username already taken.' });
    }

    // Create new user
    const user = new User({ name, username, email, password });
    await user.save();
    await sendConfirmationEmail(user.name, user.email);

    // Generate token
    const token = jwt.sign(
      { userId: user._id, name: user.name, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: { name: user.name, username: user.username, email: user.email }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── LOGIN ──
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, name: user.name, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: { name: user.name, username: user.username, email: user.email }
    });
    res.status(201).json({
      success: true,
      token,
      user: { name: user.name, email: user.email }
    });

    // Fire and forget
    sendConfirmationEmail(user.name, user.email)
      .then(() => console.log('Email sent'))
      .catch(err => console.error('Email failed:', err.message));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;