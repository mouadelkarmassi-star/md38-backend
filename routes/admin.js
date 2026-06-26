const express = require('express');
const router = express.Router();
const db = require('../models/db');
const auth = require('../middleware/auth');

router.get('/stats', auth, async (req, res) => {
  const [[{ products }]] = await db.query('SELECT COUNT(*) as products FROM products');
  const [[{ orders }]] = await db.query('SELECT COUNT(*) as orders FROM orders');
  const [[{ pending }]] = await db.query('SELECT COUNT(*) as pending FROM orders WHERE status="pending"');
  const [[{ revenue }]] = await db.query('SELECT COALESCE(SUM(total),0) as revenue FROM orders WHERE status="delivered"');
  const [[{ lowStock }]] = await db.query('SELECT COUNT(*) as lowStock FROM products WHERE stock < 10');
  const [[{ newOrders }]] = await db.query('SELECT COUNT(*) as newOrders FROM orders WHERE status="pending" AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)');
  res.json({ products, orders, pending, revenue, lowStock, newOrders });
});

module.exports = router;