const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /api/evakuasi
router.get('/', async (req, res) => {
  try {
    const { status, jenis_jalur } = req.query;
    let query = `SELECT id, nama_jalur, jenis_jalur, panjang_jalur, status, kapasitas, tujuan_pengungsian, deskripsi,
      ST_AsGeoJSON(geom) as geojson, created_at, updated_at FROM jalur_evakuasi WHERE 1=1`;
    const params = [];
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    if (jenis_jalur) { params.push(jenis_jalur); query += ` AND jenis_jalur = $${params.length}`; }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    const rows = result.rows.map(r => ({ ...r, geojson: r.geojson ? JSON.parse(r.geojson) : null }));
    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/evakuasi/geojson
router.get('/geojson', async (req, res) => {
  try {
    const { jenis_jalur } = req.query;
    let query = `SELECT id, nama_jalur, jenis_jalur, panjang_jalur, status, kapasitas, tujuan_pengungsian, deskripsi,
      ST_AsGeoJSON(geom) as geometry FROM jalur_evakuasi WHERE geom IS NOT NULL`;
    const params = [];
    if (jenis_jalur) { params.push(jenis_jalur); query += ` AND jenis_jalur = $${params.length}`; }

    const result = await pool.query(query, params);
    const features = result.rows.map(r => ({
      type: 'Feature',
      geometry: JSON.parse(r.geometry),
      properties: { id: r.id, nama_jalur: r.nama_jalur, jenis_jalur: r.jenis_jalur, panjang_jalur: r.panjang_jalur, status: r.status, kapasitas: r.kapasitas, tujuan_pengungsian: r.tujuan_pengungsian, deskripsi: r.deskripsi }
    }));
    res.json({ type: 'FeatureCollection', features });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/evakuasi/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT *, ST_AsGeoJSON(geom) as geojson FROM jalur_evakuasi WHERE id = $1`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    const row = { ...result.rows[0], geojson: result.rows[0].geojson ? JSON.parse(result.rows[0].geojson) : null };
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/evakuasi
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { nama_jalur, jenis_jalur, panjang_jalur, status, kapasitas, tujuan_pengungsian, deskripsi, geojson } = req.body;
    if (!nama_jalur) return res.status(400).json({ success: false, message: 'Nama jalur wajib diisi' });

    const geomPart = geojson ? `ST_SetSRID(ST_GeomFromGeoJSON($8), 4326)` : 'NULL';
    const params = [nama_jalur, jenis_jalur || 'EVAKUASI', panjang_jalur, status || 'AKTIF', kapasitas, tujuan_pengungsian, deskripsi];
    if (geojson) params.push(JSON.stringify(geojson));

    const result = await pool.query(
      `INSERT INTO jalur_evakuasi (nama_jalur, jenis_jalur, panjang_jalur, status, kapasitas, tujuan_pengungsian, deskripsi, geom)
       VALUES ($1, $2, $3, $4, $5, $6, $7, ${geomPart}) RETURNING *`, params
    );
    res.status(201).json({ success: true, message: 'Data berhasil ditambahkan', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/evakuasi/:id
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { nama_jalur, jenis_jalur, panjang_jalur, status, kapasitas, tujuan_pengungsian, deskripsi, geojson } = req.body;
    const geomPart = geojson ? `, geom = ST_SetSRID(ST_GeomFromGeoJSON($8), 4326)` : '';
    const params = [nama_jalur, jenis_jalur, panjang_jalur, status, kapasitas, tujuan_pengungsian, deskripsi];
    if (geojson) params.push(JSON.stringify(geojson));
    params.push(req.params.id);
    const result = await pool.query(
      `UPDATE jalur_evakuasi SET nama_jalur=$1, jenis_jalur=$2, panjang_jalur=$3, status=$4, kapasitas=$5, tujuan_pengungsian=$6, deskripsi=$7${geomPart}
       WHERE id = $${params.length} RETURNING *`, params
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, message: 'Data berhasil diupdate', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/evakuasi/:id
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM jalur_evakuasi WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
