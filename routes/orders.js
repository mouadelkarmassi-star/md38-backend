const express = require('express');
const router = express.Router();
const db = require('../models/db');
const auth = require('../middleware/auth');

function genOrderNumber() {
  return 'MD38-' + Date.now().toString().slice(-8);
}

// Public: create order
router.post('/', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { first_name, last_name, phone, address, city, items, notes } = req.body;
    let total = 0;
    for (const it of items) total += it.price * it.quantity;
    const order_number = genOrderNumber();
    const [r] = await conn.query(
      'INSERT INTO orders (order_number, first_name, last_name, phone, address, city, total, notes) VALUES (?,?,?,?,?,?,?,?)',
      [order_number, first_name, last_name, phone, address, city, total, notes || '']
    );
    const orderId = r.insertId;
    for (const it of items) {
      await conn.query('INSERT INTO order_items (order_id, product_id, product_name, size, quantity, price) VALUES (?,?,?,?,?,?)',
        [orderId, it.product_id, it.name, it.size, it.quantity, it.price]);
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [it.quantity, it.product_id]);
    }
    await conn.commit();
    res.json({ success: true, order_number });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
});

// Admin: list
router.get('/', auth, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
  res.json(rows);
});

router.get('/:id', auth, async (req, res) => {
  const [o] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
  res.json({ ...o[0], items });
});

router.put('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ message: 'Updated' });
});

router.delete('/:id', auth, async (req, res) => {
  await db.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;