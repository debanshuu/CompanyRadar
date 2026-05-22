const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// ── SIGNUP ──
router.post('/signup', async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // Create new user
    const user = new User({ name, username, email, password });
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, name: user.name, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send response FIRST
    res.status(201).json({
      success: true,
      token,
      user: { name: user.name, username: user.username, email: user.email }
    });

    // Email AFTER response — fire and forget
    sendConfirmationEmail(user.name, user.email)
      .then(() => console.log('Email sent'))
      .catch(err => console.error('Email failed:', err.message));

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
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password.' });
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

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;