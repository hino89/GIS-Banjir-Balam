const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware, adminOnly, superAdminOnly } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// GET /api/users - Admin
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/users - SuperAdmin
router.post('/', authMiddleware, superAdminOnly, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at`,
      [name, email, hashed, role || 'OPERATOR']
    );
    res.status(201).json({ success: true, message: 'User berhasil dibuat', data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, message: 'Email sudah digunakan' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/users/:id - SuperAdmin
router.put('/:id', authMiddleware, superAdminOnly, async (req, res) => {
  try {
    const { name, email, role, is_active, password } = req.body;
    let query, params;
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      query = `UPDATE users SET name=$1, email=$2, role=$3, is_active=$4, password=$5 WHERE id=$6 RETURNING id, name, email, role, is_active`;
      params = [name, email, role, is_active, hashed, req.params.id];
    } else {
      query = `UPDATE users SET name=$1, email=$2, role=$3, is_active=$4 WHERE id=$5 RETURNING id, name, email, role, is_active`;
      params = [name, email, role, is_active, req.params.id];
    }
    const result = await pool.query(query, params);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    res.json({ success: true, message: 'User berhasil diupdate', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/users/:id - SuperAdmin
router.delete('/:id', authMiddleware, superAdminOnly, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ success: false, message: 'Tidak bisa menghapus akun sendiri' });
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
