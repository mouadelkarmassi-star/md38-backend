const express = require('express');
const router = express.Router();
const db = require('../models/db');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Helper functions
function parseSizes(sizes) {
  if (!sizes) return [];
  if (Array.isArray(sizes)) return sizes.map(s => String(s).trim()).filter(Boolean);
  if (typeof sizes === 'string') {
    try {
      const parsed = JSON.parse(sizes);
      if (Array.isArray(parsed)) return parsed.map(s => String(s).trim()).filter(Boolean);
      return [String(parsed).trim()];
    } catch (e) {
      return sizes.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function parseImages(req, imagesJson) {
  if (req.files && req.files.length > 0) {
    return req.files.map(f => '/uploads/' + f.filename);
  }
  if (!imagesJson) return [];
  try {
    const parsed = typeof imagesJson === 'string' ? JSON.parse(imagesJson) : imagesJson;
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    return imagesJson.split(',').map(s => s.trim()).filter(Boolean);
  }
}

function parseCategories(category_ids) {
  if (!category_ids) return [];
  if (Array.isArray(category_ids)) return category_ids.map(id => parseInt(id)).filter(Boolean);
  if (typeof category_ids === 'string') {
    return category_ids.split(',').map(id => parseInt(id.trim())).filter(Boolean);
  }
  return [parseInt(category_ids)].filter(Boolean);
}

function parseBool(val) {
  return val === '1' || val === 1 || val === true || val === 'true' ? 1 : 0;
}

// GET all products
router.get('/', async (req, res) => {
  try {
    const { category, featured, new_arrival, search } = req.query;
    
    let sql = `
      SELECT p.*, 
             GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') as category_names,
             GROUP_CONCAT(DISTINCT c.slug SEPARATOR ',') as category_slugs,
             GROUP_CONCAT(DISTINCT c.id SEPARATOR ',') as category_ids
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE p.status = 'active'
    `;
    
    const params = [];
    
    if (category) {
      sql += ' AND c.slug = ?';
      params.push(category);
    }
    if (featured) sql += ' AND p.featured = 1';
    if (new_arrival) sql += ' AND p.new_arrival = 1';
    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    sql += ' GROUP BY p.id ORDER BY p.created_at DESC';
    
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error('GET /products error:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET single product
router.get('/:slug', async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*, 
             GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') as category_names,
             GROUP_CONCAT(DISTINCT c.id SEPARATOR ',') as category_ids
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE p.slug = ?
      GROUP BY p.id
    `, [req.params.slug]);
    
    if (!products.length) return res.status(404).json({ error: 'Not found' });
    
    const product = products[0];
    const categoryIds = product.category_ids || '';
    
    let related = [];
    if (categoryIds) {
      const [r] = await db.query(`
        SELECT DISTINCT p.*, 
               GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') as category_names
        FROM products p
        LEFT JOIN product_categories pc ON p.id = pc.product_id
        LEFT JOIN categories c ON pc.category_id = c.id
        WHERE pc.category_id IN (${categoryIds})
          AND p.id != ? AND p.status = 'active'
        GROUP BY p.id LIMIT 4
      `, [product.id]);
      related = r;
    }
    
    res.json({ ...product, related });
  } catch (e) {
    console.error('GET /products/:slug error:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST create product
router.post('/', auth, upload.array('images', 10), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    const { 
      name, description, price, old_price, 
      stock, sizes, featured, new_arrival,
      category_ids, images: imagesJson
    } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
    const images = parseImages(req, imagesJson);
    const sizesArray = parseSizes(sizes);
    const categories = parseCategories(category_ids);
    
    console.log('=== CREATE PRODUCT ===');
    console.log('Name:', name);
    console.log('Price:', price);
    console.log('Sizes:', sizesArray);
    console.log('Images:', images);
    console.log('Categories:', categories);
    
    const [result] = await conn.query(
      `INSERT INTO products (name, slug, description, price, old_price, stock, sizes, images, featured, new_arrival)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, slug, description || '', price, old_price || null, stock || 0,
        JSON.stringify(sizesArray),
        JSON.stringify(images),
        parseBool(featured),
        parseBool(new_arrival)
      ]
    );
    
    const productId = result.insertId;
    
    for (const categoryId of categories) {
      await conn.query(
        'INSERT IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)',
        [productId, categoryId]
      );
    }
    
    await conn.commit();
    console.log('✅ Product created, ID:', productId);
    res.json({ id: productId, message: 'Product created' });
  } catch (e) {
    await conn.rollback();
    console.error('❌ POST /products error:', e);
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

// PUT update product
router.put('/:id', auth, upload.array('images', 10), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    const { 
      name, description, price, old_price, 
      stock, sizes, featured, new_arrival,
      category_ids, images: imagesJson
    } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    
    const images = parseImages(req, imagesJson);
    const sizesArray = parseSizes(sizes);
    const categories = parseCategories(category_ids);
    
    console.log('=== UPDATE PRODUCT ===');
    console.log('ID:', req.params.id);
    console.log('Price:', price);
    
    await conn.query(
      `UPDATE products SET 
        name = ?, description = ?, price = ?, old_price = ?, 
        stock = ?, sizes = ?, images = ?, featured = ?, new_arrival = ?
       WHERE id = ?`,
      [
        name, description || '', price, old_price || null, stock || 0,
        JSON.stringify(sizesArray),
        JSON.stringify(images),
        parseBool(featured),
        parseBool(new_arrival),
        req.params.id
      ]
    );
    
    if (category_ids !== undefined) {
      await conn.query('DELETE FROM product_categories WHERE product_id = ?', [req.params.id]);
      for (const categoryId of categories) {
        await conn.query(
          'INSERT IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)',
          [req.params.id, categoryId]
        );
      }
    }
    
    await conn.commit();
    console.log('✅ Product updated:', req.params.id);
    res.json({ message: 'Product updated' });
  } catch (e) {
    await conn.rollback();
    console.error('❌ PUT /products/:id error:', e);
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

// DELETE product
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    console.log('✅ Product deleted:', req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('❌ DELETE error:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;