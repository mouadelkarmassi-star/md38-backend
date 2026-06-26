const express = require('express');
const router = express.Router();
const db = require('../models/db');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET all categories
router.get('/', async (req, res) => {
  try {
    console.log('=== GET /categories ===');
    const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
    console.log('✅ Categories found:', rows.length);
    res.json(rows);
  } catch (e) {
    console.error('❌ GET /categories error:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST create category
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    console.log('=== POST /categories ===');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    const { name, description, image_url } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    let image = null;
    if (req.file) {
      image = '/uploads/' + req.file.filename;
      console.log('✓ Uploaded file:', image);
    } else if (image_url && image_url.trim()) {
      image = image_url.trim();
      console.log('✓ Using URL:', image);
    }
    
    const [result] = await db.query(
      'INSERT INTO categories (name, slug, description, image) VALUES (?, ?, ?, ?)',
      [name, slug, description || '', image]
    );
    
    console.log('✅ Category created, ID:', result.insertId);
    res.json({ id: result.insertId, message: 'Category created' });
  } catch (e) {
    console.error('❌ POST /categories error:', e);
    res.status(500).json({ error: e.message });
  }
});

// PUT update category
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    console.log('=== PUT /categories/:id ===');
    
    const { name, description, image_url } = req.body;
    let image = null;
    
    if (req.file) {
      image = '/uploads/' + req.file.filename;
    } else if (image_url && image_url.trim()) {
      image = image_url.trim();
    } else {
      const [existing] = await db.query('SELECT image FROM categories WHERE id = ?', [req.params.id]);
      image = existing[0]?.image || null;
    }
    
    await db.query(
      'UPDATE categories SET name = ?, description = ?, image = ? WHERE id = ?',
      [name, description || '', image, req.params.id]
    );
    
    console.log('✅ Category updated:', req.params.id);
    res.json({ message: 'Category updated' });
  } catch (e) {
    console.error('❌ PUT error:', e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE category
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    console.log('✅ Category deleted:', req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('❌ DELETE error:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;