const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/users/join — upsert user by sessionId
router.post('/join', async (req, res) => {
  try {
    const { sessionId, name } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (name.trim().length > 30) {
      return res.status(400).json({ error: 'name must be 30 characters or fewer' });
    }

    // Detect country from IP
    let country = '';
    try {
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
      if (ip && ip !== '::1' && ip !== '127.0.0.1' && !ip.startsWith('192.168')) {
        const resp = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`);
        const data = await resp.json();
        if (data.countryCode) country = data.countryCode;
      }
      if (!country) country = 'IL'; // Default for localhost
    } catch { country = 'IL'; }

    const user = await User.findOneAndUpdate(
      { sessionId },
      {
        $set: { name: name.trim(), lastSeenAt: new Date(), country },
        $setOnInsert: { joinedAt: new Date(), streak: 0 },
      },
      { upsert: true, new: true }
    );

    res.json(user);
  } catch (err) {
    console.error('POST /api/users/join error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/online — users seen in last 5 minutes
router.get('/online', async (req, res) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const users = await User.find(
      { lastSeenAt: { $gte: fiveMinutesAgo } },
      { sessionId: 1, name: 1, lastSeenAt: 1, streak: 1 }
    ).sort({ lastSeenAt: -1 });

    res.json(users);
  } catch (err) {
    console.error('GET /api/users/online error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
