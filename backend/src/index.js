require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARE ====================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==================== ROUTES ====================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rawan', require('./routes/rawan'));
app.use('/api/evakuasi', require('./routes/evakuasi'));
app.use('/api/pengungsian', require('./routes/pengungsian'));
app.use('/api/alat-berat', require('./routes/alatBerat'));
app.use('/api/kondisi-jalan', require('./routes/kondisiJalan'));
app.use('/api/laporan', require('./routes/laporan'));
app.use('/api/users', require('./routes/users'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/route', require('./routes/routing'));
app.use('/api/cuaca', require('./routes/cuaca'));

// ==================== LAYER ALIASES (QGIS compat) ====================
app.get('/api/layer/banjir', async (req, res) => {
  const pool = require('./db/pool');
  try {
    const result = await pool.query(
      `SELECT id, nama_wilayah, kecamatan, kelurahan, deskripsi, jenis_bencana, tingkat_risiko, luas_area, elevasi, frekuensi_hujan, created_at, ST_AsGeoJSON(geom) as geometry FROM daerah_rawan WHERE jenis_bencana ILIKE '%banjir%' AND geom IS NOT NULL`
    );
    const features = result.rows.map(r => ({ 
      type: 'Feature', 
      geometry: JSON.parse(r.geometry), 
      properties: { 
        id: r.id, 
        nama_wilayah: r.nama_wilayah, 
        kecamatan: r.kecamatan, 
        kelurahan: r.kelurahan,
        deskripsi: r.deskripsi,
        jenis_bencana: r.jenis_bencana, 
        tingkat_risiko: r.tingkat_risiko,
        luas_area: r.luas_area,
        elevasi: r.elevasi,
        frekuensi_hujan: r.frekuensi_hujan,
        tahun: new Date(r.created_at).getFullYear()
      } 
    }));
    res.json({ type: 'FeatureCollection', features });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/layer/pengungsian', async (req, res) => {
  const pool = require('./db/pool');
  try {
    const result = await pool.query(
      `SELECT id, nama_lokasi, kapasitas, fasilitas, alamat, kecamatan, status_aktif, ST_AsGeoJSON(geom) as geometry FROM titik_pengungsian WHERE geom IS NOT NULL`
    );
    const features = result.rows.map(r => ({ type: 'Feature', geometry: JSON.parse(r.geometry), properties: { id: r.id, nama_lokasi: r.nama_lokasi, kapasitas: r.kapasitas, fasilitas: r.fasilitas, alamat: r.alamat, kecamatan: r.kecamatan, status_aktif: r.status_aktif } }));
    res.json({ type: 'FeatureCollection', features });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/layer/evakuasi', async (req, res) => {
  const pool = require('./db/pool');
  try {
    const result = await pool.query(
      `SELECT id, nama_jalur, jenis_jalur, panjang_jalur, status, kapasitas, tujuan_pengungsian, ST_AsGeoJSON(geom) as geometry FROM jalur_evakuasi WHERE geom IS NOT NULL`
    );
    const features = result.rows.map(r => ({ type: 'Feature', geometry: JSON.parse(r.geometry), properties: { id: r.id, nama_jalur: r.nama_jalur, jenis_jalur: r.jenis_jalur, panjang_jalur: r.panjang_jalur, status: r.status, kapasitas: r.kapasitas, tujuan_pengungsian: r.tujuan_pengungsian } }));
    res.json({ type: 'FeatureCollection', features });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/layer/alat-berat', async (req, res) => {
  const pool = require('./db/pool');
  try {
    const result = await pool.query(
      `SELECT id, nama_alat, jenis_alat, instansi, status, lokasi, ST_AsGeoJSON(geom) as geometry FROM alat_berat WHERE geom IS NOT NULL`
    );
    const features = result.rows.map(r => ({ type: 'Feature', geometry: JSON.parse(r.geometry), properties: { id: r.id, nama_alat: r.nama_alat, jenis_alat: r.jenis_alat, instansi: r.instansi, status: r.status, lokasi: r.lokasi } }));
    res.json({ type: 'FeatureCollection', features });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/layer/jaringan-jalan', async (req, res) => {
  const pool = require('./db/pool');
  try {
    const result = await pool.query(
      `SELECT id, NULL as nama, NULL as tipe, length, ST_AsGeoJSON(geom) as geometry FROM jaringan_jalan_noded WHERE geom IS NOT NULL LIMIT 10000`
    );
    const features = result.rows.map(r => ({ 
      type: 'Feature', 
      geometry: JSON.parse(r.geometry), 
      properties: { 
        id: r.id, 
        nama: r.nama, 
        tipe: r.tipe,
        length: r.length
      } 
    }));
    res.json({ type: 'FeatureCollection', features });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/layer/wilayah-kecamatan', async (req, res) => {
  const pool = require('./db/pool');
  try {
    const result = await pool.query(
      `SELECT id, nama, ST_AsGeoJSON(geom) as geometry FROM wilayah_kecamatan WHERE geom IS NOT NULL`
    );
    const features = result.rows.map(r => ({ 
      type: 'Feature', 
      geometry: JSON.parse(r.geometry), 
      properties: { 
        id: r.id, 
        kecamatan: r.nama 
      } 
    }));
    res.json({ type: 'FeatureCollection', features });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/layer/wilayah-desa', async (req, res) => {
  const pool = require('./db/pool');
  try {
    const result = await pool.query(
      `SELECT id, nama, kecamatan, ST_AsGeoJSON(geom) as geometry FROM wilayah_desa WHERE geom IS NOT NULL`
    );
    const features = result.rows.map(r => ({ 
      type: 'Feature', 
      geometry: JSON.parse(r.geometry), 
      properties: { 
        id: r.id, 
        desa: r.nama,
        kecamatan: r.kecamatan
      } 
    }));
    res.json({ type: 'FeatureCollection', features });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/layer/pemukiman', async (req, res) => {
  const pool = require('./db/pool');
  try {
    const result = await pool.query(
      `SELECT id, nama, kecamatan, deskripsi, ST_AsGeoJSON(geom) as geometry FROM pemukiman WHERE geom IS NOT NULL LIMIT 20000`
    );
    const features = result.rows.map(r => ({ 
      type: 'Feature', 
      geometry: JSON.parse(r.geometry), 
      properties: { 
        id: r.id, 
        nama: r.nama,
        kecamatan: r.kecamatan,
        deskripsi: r.deskripsi
      } 
    }));
    res.json({ type: 'FeatureCollection', features });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SIG Mitigasi Bencana API is running', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} tidak ditemukan` });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});



// ==================== STATS ALIAS ====================
// ==================== START SERVER ====================
const server = app.listen(PORT, () => {
  console.log(`🚀 SIG Mitigasi Bencana API running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

server.on('error', (err) => {
  console.error('❌ FATAL SERVER ERROR:', err);
});

module.exports = app;
