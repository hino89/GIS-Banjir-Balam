const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /api/pengungsian
router.get('/', async (req, res) => {
  try {
    const { kecamatan, status_aktif } = req.query;
    let query = `SELECT id, nama_lokasi, kapasitas, fasilitas, alamat, kecamatan, kelurahan, latitude, longitude, status_aktif, kontak,
      ST_AsGeoJSON(geom) as geojson, created_at, updated_at FROM titik_pengungsian WHERE 1=1`;
    const params = [];
    if (kecamatan) { params.push(kecamatan); query += ` AND kecamatan = $${params.length}`; }
    if (status_aktif !== undefined) { params.push(status_aktif === 'true'); query += ` AND status_aktif = $${params.length}`; }
    query += ' ORDER BY nama_lokasi';
    const result = await pool.query(query, params);
    const rows = result.rows.map(r => ({ ...r, geojson: r.geojson ? JSON.parse(r.geojson) : null }));
    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/pengungsian/geojson
router.get('/geojson', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nama_lokasi, kapasitas, fasilitas, alamat, kecamatan, status_aktif, kontak,
       ST_AsGeoJSON(geom) as geometry FROM titik_pengungsian WHERE geom IS NOT NULL`
    );
    const features = result.rows.map(r => ({
      type: 'Feature',
      geometry: JSON.parse(r.geometry),
      properties: { id: r.id, nama_lokasi: r.nama_lokasi, kapasitas: r.kapasitas, fasilitas: r.fasilitas, alamat: r.alamat, kecamatan: r.kecamatan, status_aktif: r.status_aktif, kontak: r.kontak }
    }));
    res.json({ type: 'FeatureCollection', features });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/pengungsian/nearest?lat=&lng=&radius=
router.get('/nearest', async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'Koordinat lat dan lng diperlukan' });
    const result = await pool.query(
      `SELECT id, nama_lokasi, kapasitas, fasilitas, alamat, kecamatan, status_aktif,
       ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) as distance
       FROM titik_pengungsian WHERE status_aktif = true AND geom IS NOT NULL
       AND ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)
       ORDER BY distance LIMIT 5`,
      [lat, lng, radius]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/pengungsian/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT *, ST_AsGeoJSON(geom) as geojson FROM titik_pengungsian WHERE id = $1`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    const row = { ...result.rows[0], geojson: result.rows[0].geojson ? JSON.parse(result.rows[0].geojson) : null };
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/pengungsian
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { nama_lokasi, kapasitas, fasilitas, alamat, kecamatan, kelurahan, latitude, longitude, status_aktif, kontak } = req.body;
    if (!nama_lokasi || !latitude || !longitude) return res.status(400).json({ success: false, message: 'Nama, latitude, longitude wajib diisi' });
    const result = await pool.query(
      `INSERT INTO titik_pengungsian (nama_lokasi, kapasitas, fasilitas, alamat, kecamatan, kelurahan, latitude, longitude, status_aktif, kontak, geom)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, ST_SetSRID(ST_MakePoint($8, $7), 4326)) RETURNING *`,
      [nama_lokasi, kapasitas, fasilitas, alamat, kecamatan, kelurahan, latitude, longitude, status_aktif ?? true, kontak]
    );
    res.status(201).json({ success: true, message: 'Data berhasil ditambahkan', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/pengungsian/:id
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { nama_lokasi, kapasitas, fasilitas, alamat, kecamatan, kelurahan, latitude, longitude, status_aktif, kontak } = req.body;
    const result = await pool.query(
      `UPDATE titik_pengungsian SET nama_lokasi=$1, kapasitas=$2, fasilitas=$3, alamat=$4, kecamatan=$5, kelurahan=$6,
       latitude=$7, longitude=$8, status_aktif=$9, kontak=$10, geom=ST_SetSRID(ST_MakePoint($8, $7), 4326)
       WHERE id = $11 RETURNING *`,
      [nama_lokasi, kapasitas, fasilitas, alamat, kecamatan, kelurahan, latitude, longitude, status_aktif, kontak, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, message: 'Data berhasil diupdate', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/pengungsian/:id
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM titik_pengungsian WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
