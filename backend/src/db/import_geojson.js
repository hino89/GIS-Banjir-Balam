require('dotenv').config({ path: '../../.env' });
const pool = require('./pool');
const fs = require('fs');
const path = require('path');

async function importGeoJSON() {
  try {
    console.log('🔄 Membaca file GeoJSON kecamatan...');
    const kecPath = path.resolve(__dirname, '../../../geojson/kecamatan2.geojson');
    const kecData = JSON.parse(fs.readFileSync(kecPath, 'utf8'));

    console.log('🔄 Membaca file GeoJSON kelurahan...');
    const kelPath = path.resolve(__dirname, '../../../geojson/balam_kelurahan(2).geojson');
    const kelData = JSON.parse(fs.readFileSync(kelPath, 'utf8'));

    console.log('🗑️ Mengosongkan tabel wilayah_kecamatan & wilayah_desa...');
    await pool.query('TRUNCATE TABLE wilayah_kecamatan RESTART IDENTITY CASCADE');
    await pool.query('TRUNCATE TABLE wilayah_desa RESTART IDENTITY CASCADE');

    console.log('⏳ Mengimport Kecamatan...');
    for (const feature of kecData.features) {
      if (!feature.geometry) continue;
      const nama = feature.properties.KECAMATAN;
      
      // ST_Multi ensures we always store MultiPolygon, ST_Force2D removes Z dimension
      await pool.query(
        `INSERT INTO wilayah_kecamatan (nama, geom) VALUES ($1, ST_Force2D(ST_Multi(ST_GeomFromGeoJSON($2))))`,
        [nama, JSON.stringify(feature.geometry)]
      );
    }
    console.log('✅ Kecamatan berhasil di-import.');

    console.log('⏳ Mengimport Kelurahan...');
    for (const feature of kelData.features) {
      if (!feature.geometry) continue;
      const nama = feature.properties.KEL_DESA;
      const kecamatan = feature.properties.KECAMATAN;

      await pool.query(
        `INSERT INTO wilayah_desa (nama, kecamatan, geom) VALUES ($1, $2, ST_Force2D(ST_Multi(ST_GeomFromGeoJSON($3))))`,
        [nama, kecamatan, JSON.stringify(feature.geometry)]
      );
    }
    console.log('✅ Kelurahan berhasil di-import.');
    
    console.log('🎉 Import Selesai!');
  } catch (error) {
    console.error('❌ Error saat import:', error);
  } finally {
    pool.end();
  }
}

importGeoJSON();
