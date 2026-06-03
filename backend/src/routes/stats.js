const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET /api/stats - Dashboard public stats
router.get('/', async (req, res) => {
  try {
    const [rawan, evakuasi, pengungsian, alatBerat, jalan, laporan] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM daerah_rawan'),
      pool.query('SELECT COUNT(*) as total FROM jalur_evakuasi WHERE status = \'AKTIF\''),
      pool.query('SELECT COUNT(*) as total FROM titik_pengungsian WHERE status_aktif = true'),
      pool.query('SELECT COUNT(*) as total FROM alat_berat WHERE status = \'TERSEDIA\''),
      pool.query(`SELECT COUNT(*) as total, COUNT(CASE WHEN status != 'NORMAL' THEN 1 END) as terdampak FROM kondisi_jalan`),
      pool.query('SELECT COUNT(*) as total FROM laporan_warga WHERE status = \'MENUNGGU\''),
    ]);

    const [rawanByRisiko, rawanByBencana] = await Promise.all([
      pool.query(`SELECT tingkat_risiko, COUNT(*) as count FROM daerah_rawan GROUP BY tingkat_risiko`),
      pool.query(`SELECT jenis_bencana, COUNT(*) as count FROM daerah_rawan GROUP BY jenis_bencana ORDER BY count DESC`),
    ]);

    const kecamatanStats = await pool.query(`
      SELECT kecamatan, COUNT(*) as rawan_count,
             COUNT(CASE WHEN tingkat_risiko = 'TINGGI' THEN 1 END) as tinggi,
             COUNT(CASE WHEN tingkat_risiko = 'SEDANG' THEN 1 END) as sedang,
             COUNT(CASE WHEN tingkat_risiko = 'RENDAH' THEN 1 END) as rendah
      FROM daerah_rawan GROUP BY kecamatan ORDER BY rawan_count DESC LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        total_daerah_rawan: parseInt(rawan.rows[0].total),
        total_jalur_evakuasi: parseInt(evakuasi.rows[0].total),
        total_pengungsian: parseInt(pengungsian.rows[0].total),
        total_alat_tersedia: parseInt(alatBerat.rows[0].total),
        total_jalan: parseInt(jalan.rows[0].total),
        jalan_terdampak: parseInt(jalan.rows[0].terdampak),
        laporan_menunggu: parseInt(laporan.rows[0].total),
        rawan_by_risiko: rawanByRisiko.rows,
        rawan_by_bencana: rawanByBencana.rows,
        kecamatan_stats: kecamatanStats.rows,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/stats/admin - Admin dashboard stats
router.get('/admin', async (req, res) => {
  try {
    const results = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM daerah_rawan'),
      pool.query('SELECT COUNT(*) as total FROM jalur_evakuasi'),
      pool.query('SELECT COUNT(*) as total FROM titik_pengungsian'),
      pool.query('SELECT COUNT(*) as total FROM alat_berat'),
      pool.query('SELECT COUNT(*) as total FROM kondisi_jalan'),
      pool.query('SELECT COUNT(*) as total FROM laporan_warga'),
      pool.query(`SELECT COUNT(*) as total FROM laporan_warga WHERE status = 'MENUNGGU'`),
      pool.query(`SELECT COUNT(*) as total FROM laporan_warga WHERE status = 'DIVERIFIKASI'`),
      pool.query(`SELECT jenis_kejadian, COUNT(*) as count FROM laporan_warga GROUP BY jenis_kejadian`),
    ]);

    res.json({
      success: true,
      data: {
        total_rawan: parseInt(results[0].rows[0].total),
        total_evakuasi: parseInt(results[1].rows[0].total),
        total_pengungsian: parseInt(results[2].rows[0].total),
        total_alat_berat: parseInt(results[3].rows[0].total),
        total_jalan: parseInt(results[4].rows[0].total),
        total_laporan: parseInt(results[5].rows[0].total),
        laporan_menunggu: parseInt(results[6].rows[0].total),
        laporan_terverifikasi: parseInt(results[7].rows[0].total),
        laporan_by_jenis: results[8].rows,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
