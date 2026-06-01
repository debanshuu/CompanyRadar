const express = require('express');
const Search = require('../models/Search');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const searches = await Search.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, searches });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Search.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    res.json({ success: true, message: 'Search deleted.' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;