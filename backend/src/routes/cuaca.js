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

    // Ambil koordinat semua kelurahan dari database
    const dbResult = await pool.query(`SELECT nama, ST_Y(ST_Centroid(geom)) as lat, ST_X(ST_Centroid(geom)) as lon FROM wilayah_desa WHERE geom IS NOT NULL`);
    const kelurahanList = dbResult.rows;

    if (kelurahanList.length === 0) {
      return res.json({ success: true, data: {} });
    }

    // Format array lat dan lon (maksimal 126, url length sekitar 3-4kb, aman untuk open-meteo)
    const lats = kelurahanList.map(k => k.lat.toFixed(5)).join(',');
    const lons = kelurahanList.map(k => k.lon.toFixed(5)).join(',');

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=precipitation,rain&elevation=nan&timezone=Asia%2FJakarta`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch Open-Meteo API');
    
    const data = await response.json();
    
    // Map hasil ke nama kelurahan
    const resultMap = {};
    if (Array.isArray(data)) {
      // Jika data berupa array (multiple locations)
      data.forEach((d, idx) => {
        const kel = kelurahanList[idx].nama.toUpperCase();
        resultMap[kel] = {
          elevasi: d.elevation,
          presipitasi: d.current.precipitation,
          hujan: d.current.rain
        };
      });
    } else {
      // Jika hanya 1 data (fallback)
      const kel = kelurahanList[0].nama.toUpperCase();
      resultMap[kel] = {
        elevasi: data.elevation,
        presipitasi: data.current.precipitation,
        hujan: data.current.rain
      };
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
