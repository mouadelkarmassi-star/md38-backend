const express = require('express');
const router = express.Router();
const db = require('../models/db');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM settings');
  const obj = {};
  rows.forEach(r => obj[r.setting_key] = r.setting_value);
  res.json(obj);
});

router.put('/', auth, async (req, res) => {
  for (const [k, v] of Object.entries(req.body)) {
    await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_value = ?', [k, v, v]);
  }
  res.json({ message: 'Saved' });
});

module.exports = router;