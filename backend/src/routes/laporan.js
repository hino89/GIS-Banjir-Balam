const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => cb(null, `laporan-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/laporan - Admin
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    let query = `SELECT id, nama_pelapor, no_telp, lokasi, latitude, longitude, jenis_kejadian, deskripsi, foto_url, status, admin_notes, created_at, updated_at FROM laporan_warga WHERE 1=1`;
    const params = [];
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, total: result.rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/laporan/geojson - Admin
router.get('/geojson', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nama_pelapor, lokasi, jenis_kejadian, status, ST_AsGeoJSON(geom) as geometry FROM laporan_warga WHERE geom IS NOT NULL`
    );
    const features = result.rows.map(r => ({
      type: 'Feature',
      geometry: JSON.parse(r.geometry),
      properties: { id: r.id, nama_pelapor: r.nama_pelapor, lokasi: r.lokasi, jenis_kejadian: r.jenis_kejadian, status: r.status }
    }));
    res.json({ type: 'FeatureCollection', features });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/laporan - Public (submit laporan)
router.post('/', upload.single('foto'), async (req, res) => {
  try {
    const { nama_pelapor, no_telp, lokasi, latitude, longitude, jenis_kejadian, deskripsi } = req.body;
    if (!nama_pelapor || !lokasi || !jenis_kejadian || !deskripsi) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    }
    const foto_url = req.file ? `/uploads/${req.file.filename}` : null;
    const geomPart = latitude && longitude ? `ST_SetSRID(ST_MakePoint($8, $7), 4326)` : 'NULL';
    const result = await pool.query(
      `INSERT INTO laporan_warga (nama_pelapor, no_telp, lokasi, latitude, longitude, jenis_kejadian, deskripsi, foto_url, geom)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ${latitude && longitude ? `ST_SetSRID(ST_MakePoint($5, $4), 4326)` : 'NULL'}) RETURNING *`,
      [nama_pelapor, no_telp, lokasi, latitude, longitude, jenis_kejadian, deskripsi, foto_url]
    );
    res.status(201).json({ success: true, message: 'Laporan berhasil dikirim. Terima kasih!', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/laporan/:id/verifikasi - Admin
router.put('/:id/verifikasi', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    if (!['DIVERIFIKASI', 'DITOLAK'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status harus DIVERIFIKASI atau DITOLAK' });
    }
    const result = await pool.query(
      `UPDATE laporan_warga SET status = $1, admin_notes = $2 WHERE id = $3 RETURNING *`,
      [status, admin_notes, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, message: `Laporan berhasil ${status === 'DIVERIFIKASI' ? 'diverifikasi' : 'ditolak'}`, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/laporan/:id - Admin
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM laporan_warga WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, message: 'Laporan berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
