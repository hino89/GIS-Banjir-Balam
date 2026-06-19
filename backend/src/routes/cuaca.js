const express = require('express');
const router = express.Router();

router.get('/curah-hujan', async (req, res) => {
  try {
    // Koordinat Bandar Lampung
    const lat = -5.4294;
    const lon = 105.2662;
    
    // Fetch data curah hujan dari Open-Meteo API
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code&timezone=Asia%2FJakarta`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    
    const data = await response.json();
    
    res.json({
      success: true,
      data: {
        lokasi: 'Bandar Lampung',
        waktu: data.current.time,
        temperatur: data.current.temperature_2m,
        kelembapan: data.current.relative_humidity_2m,
        presipitasi: data.current.precipitation, // mm curah hujan
        hujan: data.current.rain,
        kode_cuaca: data.current.weather_code
      }
    });
  } catch (error) {
    console.error('Weather API Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data cuaca', error: error.message });
  }
});

module.exports = router;
