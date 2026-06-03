const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /api/kondisi-jalan
router.get('/', async (req, res) => {
  try {
    const { status, kecamatan } = req.query;
    let query = `SELECT id, nama_jalan, kecamatan, status, deskripsi, panjang,
      ST_AsGeoJSON(geom) as geojson, created_at, updated_at FROM kondisi_jalan WHERE 1=1`;
    const params = [];
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    if (kecamatan) { params.push(kecamatan); query += ` AND kecamatan = $${params.length}`; }
    query += ' ORDER BY updated_at DESC';
    const result = await pool.query(query, params);
    const rows = result.rows.map(r => ({ ...r, geojson: r.geojson ? JSON.parse(r.geojson) : null }));
    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/kondisi-jalan/geojson
router.get('/geojson', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nama_jalan, kecamatan, status, deskripsi, panjang, ST_AsGeoJSON(geom) as geometry FROM kondisi_jalan WHERE geom IS NOT NULL`
    );
    const features = result.rows.map(r => ({
      type: 'Feature',
      geometry: JSON.parse(r.geometry),
      properties: { id: r.id, nama_jalan: r.nama_jalan, kecamatan: r.kecamatan, status: r.status, deskripsi: r.deskripsi, panjang: r.panjang }
    }));
    res.json({ type: 'FeatureCollection', features });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT *, ST_AsGeoJSON(geom) as geojson FROM kondisi_jalan WHERE id = $1`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { nama_jalan, kecamatan, status, deskripsi, panjang, geojson } = req.body;
    if (!nama_jalan) return res.status(400).json({ success: false, message: 'Nama jalan wajib diisi' });
    const geomPart = geojson ? `ST_SetSRID(ST_GeomFromGeoJSON($6), 4326)` : 'NULL';
    const params = [nama_jalan, kecamatan, status || 'NORMAL', deskripsi, panjang];
    if (geojson) params.push(JSON.stringify(geojson));
    const result = await pool.query(
      `INSERT INTO kondisi_jalan (nama_jalan, kecamatan, status, deskripsi, panjang, geom) VALUES ($1,$2,$3,$4,$5,${geomPart}) RETURNING *`, params
    );
    res.status(201).json({ success: true, message: 'Data berhasil ditambahkan', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { nama_jalan, kecamatan, status, deskripsi, panjang, geojson } = req.body;
    const geomPart = geojson ? `, geom = ST_SetSRID(ST_GeomFromGeoJSON($6), 4326)` : '';
    const params = [nama_jalan, kecamatan, status, deskripsi, panjang];
    if (geojson) params.push(JSON.stringify(geojson));
    params.push(req.params.id);
    const result = await pool.query(
      `UPDATE kondisi_jalan SET nama_jalan=$1, kecamatan=$2, status=$3, deskripsi=$4, panjang=$5${geomPart} WHERE id=$${params.length} RETURNING *`, params
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, message: 'Data berhasil diupdate', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM kondisi_jalan WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
