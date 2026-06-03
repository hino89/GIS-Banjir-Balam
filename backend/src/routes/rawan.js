const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /api/rawan - Public
router.get('/', async (req, res) => {
  try {
    const { kecamatan, jenis_bencana, tingkat_risiko } = req.query;
    let query = `SELECT id, nama_wilayah, kecamatan, kelurahan, jenis_bencana, tingkat_risiko, luas_area, deskripsi,
      ST_AsGeoJSON(geom) as geojson, created_at, updated_at FROM daerah_rawan WHERE 1=1`;
    const params = [];

    if (kecamatan) { params.push(kecamatan); query += ` AND kecamatan = $${params.length}`; }
    if (jenis_bencana) { params.push(jenis_bencana); query += ` AND jenis_bencana = $${params.length}`; }
    if (tingkat_risiko) { params.push(tingkat_risiko); query += ` AND tingkat_risiko = $${params.length}`; }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);

    const rows = result.rows.map(r => ({
      ...r,
      geojson: r.geojson ? JSON.parse(r.geojson) : null
    }));

    res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/rawan/geojson - GeoJSON for map
router.get('/geojson', async (req, res) => {
  try {
    const { jenis_bencana } = req.query;
    let query = `SELECT id, nama_wilayah, kecamatan, jenis_bencana, tingkat_risiko, luas_area, deskripsi,
      ST_AsGeoJSON(geom) as geometry FROM daerah_rawan WHERE geom IS NOT NULL`;
    const params = [];
    if (jenis_bencana) { params.push(jenis_bencana); query += ` AND jenis_bencana = $${params.length}`; }

    const result = await pool.query(query, params);
    const features = result.rows.map(r => ({
      type: 'Feature',
      geometry: JSON.parse(r.geometry),
      properties: {
        id: r.id, nama_wilayah: r.nama_wilayah, kecamatan: r.kecamatan,
        jenis_bencana: r.jenis_bencana, tingkat_risiko: r.tingkat_risiko,
        luas_area: r.luas_area, deskripsi: r.deskripsi
      }
    }));

    res.json({ type: 'FeatureCollection', features });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/rawan/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *, ST_AsGeoJSON(geom) as geojson FROM daerah_rawan WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    const row = { ...result.rows[0], geojson: result.rows[0].geojson ? JSON.parse(result.rows[0].geojson) : null };
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/rawan - Admin only
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { nama_wilayah, kecamatan, kelurahan, jenis_bencana, tingkat_risiko, luas_area, deskripsi, geojson } = req.body;
    if (!nama_wilayah || !kecamatan || !jenis_bencana) {
      return res.status(400).json({ success: false, message: 'Nama wilayah, kecamatan, dan jenis bencana wajib diisi' });
    }

    let geomQuery = geojson ? `ST_SetSRID(ST_GeomFromGeoJSON($7), 4326)` : 'NULL';
    const params = [nama_wilayah, kecamatan, kelurahan, jenis_bencana, tingkat_risiko, luas_area || null, deskripsi];
    if (geojson) params.push(JSON.stringify(geojson));

    const result = await pool.query(
      `INSERT INTO daerah_rawan (nama_wilayah, kecamatan, kelurahan, jenis_bencana, tingkat_risiko, luas_area, deskripsi, geom)
       VALUES ($1, $2, $3, $4, $5, $6, $7, ${geomQuery}) RETURNING *`,
      geojson ? [nama_wilayah, kecamatan, kelurahan, jenis_bencana, tingkat_risiko, luas_area || null, deskripsi, JSON.stringify(geojson)] :
               [nama_wilayah, kecamatan, kelurahan, jenis_bencana, tingkat_risiko, luas_area || null, deskripsi]
    );

    res.status(201).json({ success: true, message: 'Data berhasil ditambahkan', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/rawan/:id - Admin only
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { nama_wilayah, kecamatan, kelurahan, jenis_bencana, tingkat_risiko, luas_area, deskripsi, geojson } = req.body;

    const geomPart = geojson ? `, geom = ST_SetSRID(ST_GeomFromGeoJSON($8), 4326)` : '';
    const params = [nama_wilayah, kecamatan, kelurahan, jenis_bencana, tingkat_risiko, luas_area, deskripsi];
    if (geojson) params.push(JSON.stringify(geojson));
    params.push(req.params.id);

    const result = await pool.query(
      `UPDATE daerah_rawan SET nama_wilayah=$1, kecamatan=$2, kelurahan=$3, jenis_bencana=$4, tingkat_risiko=$5, luas_area=$6, deskripsi=$7${geomPart}
       WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, message: 'Data berhasil diupdate', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/rawan/:id - Admin only
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM daerah_rawan WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/rawan/stats/summary
router.get('/stats/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN tingkat_risiko = 'TINGGI' THEN 1 END) as tinggi,
        COUNT(CASE WHEN tingkat_risiko = 'SEDANG' THEN 1 END) as sedang,
        COUNT(CASE WHEN tingkat_risiko = 'RENDAH' THEN 1 END) as rendah,
        COUNT(CASE WHEN jenis_bencana = 'Banjir' THEN 1 END) as banjir,
        COUNT(CASE WHEN jenis_bencana = 'Longsor' THEN 1 END) as longsor,
        SUM(luas_area) as total_luas
      FROM daerah_rawan
    `);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
