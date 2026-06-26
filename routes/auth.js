const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models/db');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: admin.id, username: admin.username, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, admin: { id: admin.id, username: admin.username, full_name: admin.full_name, role: admin.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/me', require('../middleware/auth'), async (req, res) => {
  const [rows] = await db.query('SELECT id, username, email, full_name, role FROM admins WHERE id = ?', [req.admin.id]);
  res.json(rows[0] || {});
});

module.exports = router;