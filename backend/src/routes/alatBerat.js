const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /api/alat-berat
router.get('/', async (req, res) => {
  try {
    const { status, jenis_alat } = req.query;
    let query = `SELECT id, nama_alat, jenis_alat, instansi, status, lokasi, latitude, longitude, deskripsi,
      ST_AsGeoJSON(geom) as geojson, created_at, updated_at FROM alat_berat WHERE 1=1`;
    const params = [];
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    if (jenis_alat) { params.push(jenis_alat); query += ` AND jenis_alat = $${params.length}`; }
    query += ' ORDER BY nama_alat';
    const result = await pool.query(query, params);
    const rows = result.rows.map(r => ({ ...r, geojson: r.geojson ? JSON.parse(r.geojson) : null }));
    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/alat-berat/geojson
router.get('/geojson', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nama_alat, jenis_alat, instansi, status, lokasi, ST_AsGeoJSON(geom) as geometry FROM alat_berat WHERE geom IS NOT NULL`
    );
    const features = result.rows.map(r => ({
      type: 'Feature',
      geometry: JSON.parse(r.geometry),
      properties: { id: r.id, nama_alat: r.nama_alat, jenis_alat: r.jenis_alat, instansi: r.instansi, status: r.status, lokasi: r.lokasi }
    }));
    res.json({ type: 'FeatureCollection', features });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT *, ST_AsGeoJSON(geom) as geojson FROM alat_berat WHERE id = $1`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { nama_alat, jenis_alat, instansi, status, lokasi, latitude, longitude, deskripsi } = req.body;
    if (!nama_alat || !jenis_alat || !instansi) return res.status(400).json({ success: false, message: 'Nama, jenis, dan instansi wajib diisi' });
    const geomPart = latitude && longitude ? `ST_SetSRID(ST_MakePoint($8, $7), 4326)` : 'NULL';
    const params = [nama_alat, jenis_alat, instansi, status || 'TERSEDIA', lokasi, latitude, longitude, deskripsi];
    const result = await pool.query(
      `INSERT INTO alat_berat (nama_alat, jenis_alat, instansi, status, lokasi, latitude, longitude, deskripsi, geom)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ${geomPart}) RETURNING *`, params
    );
    res.status(201).json({ success: true, message: 'Data berhasil ditambahkan', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { nama_alat, jenis_alat, instansi, status, lokasi, latitude, longitude, deskripsi } = req.body;
    const result = await pool.query(
      `UPDATE alat_berat SET nama_alat=$1, jenis_alat=$2, instansi=$3, status=$4, lokasi=$5, latitude=$6, longitude=$7, deskripsi=$8,
       geom=CASE WHEN $6 IS NOT NULL THEN ST_SetSRID(ST_MakePoint($7, $6), 4326) ELSE NULL END
       WHERE id = $9 RETURNING *`,
      [nama_alat, jenis_alat, instansi, status, lokasi, latitude, longitude, deskripsi, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, message: 'Data berhasil diupdate', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM alat_berat WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
