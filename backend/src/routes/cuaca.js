const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Simple in-memory cache
let weatherCache = {
  timestamp: 0,
  data: null
};
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

router.get('/all-kelurahan', async (req, res) => {
  try {
    const now = Date.now();
    if (weatherCache.data && (now - weatherCache.timestamp < CACHE_TTL)) {
      return res.json({ success: true, cached: true, data: weatherCache.data });
    }

    // Ambil koordinat semua kelurahan dari database (gunakan kolom yang sudah ada)
    const dbResult = await pool.query(`SELECT nama, latitude as lat, longitude as lon FROM wilayah_desa WHERE latitude IS NOT NULL`);
    const kelurahanList = dbResult.rows;

    if (kelurahanList.length === 0) {
      return res.json({ success: true, data: {} });
    }

    const resultMap = {};
    const batchSize = 100;
    
    for (let i = 0; i < kelurahanList.length; i += batchSize) {
      const batch = kelurahanList.slice(i, i + batchSize);
      const lats = batch.map(k => k.lat).join(',');
      const lons = batch.map(k => k.lon).join(',');

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=precipitation,rain&timezone=Asia%2FJakarta`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch Open-Meteo API batch ${i}`);
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        data.forEach((d, idx) => {
          const kel = batch[idx].nama.toUpperCase();
          resultMap[kel] = {
            presipitasi: d.current.precipitation,
            hujan: d.current.rain
          };
        });
      } else {
        const kel = batch[0].nama.toUpperCase();
        resultMap[kel] = {
          presipitasi: data.current.precipitation,
          hujan: data.current.rain
        };
      }
    }

    // Save to cache
    weatherCache = {
      timestamp: now,
      data: resultMap
    };

    res.json({ success: true, cached: false, data: resultMap });

  } catch (error) {
    console.error('All-Kelurahan Weather API Error:', error);
    res.status(500).json({ success: false, message: 'Gagal fetch cuaca massal', error: error.message });
  }
});

router.get('/curah-hujan', async (req, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat) : -5.4294;
    const lon = req.query.lon ? parseFloat(req.query.lon) : 105.2662;
    const lokasi = req.query.lokasi || 'Bandar Lampung';
    
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code&timezone=Asia%2FJakarta`);
    if (!response.ok) throw new Error('Failed to fetch weather data');
    const data = await response.json();
    
    res.json({
      success: true,
      data: {
        lokasi: lokasi,
        waktu: data.current.time,
        temperatur: data.current.temperature_2m,
        kelembapan: data.current.relative_humidity_2m,
        presipitasi: data.current.precipitation,
        hujan: data.current.rain,
        kode_cuaca: data.current.weather_code
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
