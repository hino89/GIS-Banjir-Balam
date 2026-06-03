const express = require('express');
const multer = require('multer');
const pool = require('../db/pool');
const asyncHandler = require('express-async-handler');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const ALLOWED_TABLES = ['daerah_rawan', 'jalur_evakuasi', 'titik_pengungsian', 'alat_berat', 'kondisi_jalan', 'jaringan_jalan', 'wilayah_kecamatan', 'pemukiman', 'wilayah_desa'];

router.post('/geojson/:table', upload.single('file'), asyncHandler(async (req, res) => {
  const table = req.params.table;
  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ success: false, message: 'Tabel tidak diizinkan.' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'File GeoJSON tidak ditemukan.' });
  }

  let geojson;
  try {
    geojson = JSON.parse(req.file.buffer.toString('utf8'));
  } catch (error) {
    return res.status(400).json({ success: false, message: 'File bukan format JSON/GeoJSON yang valid.' });
  }

  if (!geojson.features || !Array.isArray(geojson.features)) {
    return res.status(400).json({ success: false, message: 'Format GeoJSON tidak valid. Harus memiliki array "features".' });
  }

  const features = geojson.features;
  let insertedCount = 0;

  for (const feature of features) {
    if (!feature.geometry) continue;

    const props = feature.properties || {};
    const geomStr = JSON.stringify(feature.geometry);
    
    // Fungsi pembantu untuk mencari properti (case-insensitive)
    const getProp = (keys, fallback) => {
      for (const k of Object.keys(props)) {
        if (keys.includes(k.toLowerCase())) return props[k];
      }
      return fallback;
    };

    try {
      if (table === 'daerah_rawan') {
        const nama = getProp(['nama', 'nama_wilayah', 'name'], 'Poligon GeoJSON');
        const kec = getProp(['kecamatan', 'kec'], 'Belum Ditentukan');
        const jenis = getProp(['jenis', 'jenis_bencana', 'bencana'], 'Banjir');
        const tingkat = getProp(['risiko', 'tingkat_risiko', 'tingkat'], 'SEDANG');
        const luas = getProp(['luas', 'luas_area', 'area', 'luas_terdampak_ha'], 0);
        const desc = getProp(['desc', 'deskripsi', 'keterangan', 'penyebab'], '');
        const tahun = getProp(['tahun', 'year'], null);
        
        let createdAt = new Date();
        if (tahun) {
          createdAt = new Date(`${tahun}-01-01T00:00:00Z`);
        }
        
        await pool.query(
          `INSERT INTO daerah_rawan (nama_wilayah, kecamatan, jenis_bencana, tingkat_risiko, luas_area, deskripsi, geom, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, ST_Force2D(ST_SetSRID(ST_GeomFromGeoJSON($7), 4326)), $8)`,
          [nama, kec, jenis, tingkat, luas, desc, geomStr, createdAt]
        );
      } 
      else if (table === 'jalur_evakuasi') {
        const nama = getProp(['nama', 'nama_jalur', 'name'], 'Jalur GeoJSON');
        const jenis = getProp(['jenis', 'jenis_jalur', 'type'], 'EVAKUASI');
        const panjang = getProp(['panjang', 'panjang_jalur', 'length'], 0);
        const status = getProp(['status'], 'AKTIF');
        const desc = getProp(['desc', 'deskripsi', 'keterangan'], '');

        await pool.query(
          `INSERT INTO jalur_evakuasi (nama_jalur, jenis_jalur, panjang_jalur, status, deskripsi, geom)
           VALUES ($1, $2, $3, $4, $5, ST_Force2D(ST_SetSRID(ST_GeomFromGeoJSON($6), 4326)))`,
          [nama, jenis, panjang, status, desc, geomStr]
        );
      }
      else if (table === 'titik_pengungsian') {
        const nama = getProp(['nama', 'nama_lokasi', 'name'], 'Titik Pengungsian GeoJSON');
        const kec = getProp(['kecamatan', 'kec'], 'Belum Ditentukan');
        const kapasitas = getProp(['kapasitas', 'capacity'], 100);
        
        await pool.query(
          `INSERT INTO titik_pengungsian (nama_lokasi, kecamatan, kapasitas, geom)
           VALUES ($1, $2, $3, ST_Force2D(ST_SetSRID(ST_GeomFromGeoJSON($4), 4326)))`,
          [nama, kec, kapasitas, geomStr]
        );
      }
      else if (table === 'kondisi_jalan') {
        const nama = getProp(['nama', 'nama_jalan', 'name'], 'Jalan GeoJSON');
        const status = getProp(['status', 'kondisi'], 'TERENDAM');
        const kec = getProp(['kecamatan', 'kec'], 'Belum Ditentukan');

        await pool.query(
          `INSERT INTO kondisi_jalan (nama_jalan, status, kecamatan, geom)
           VALUES ($1, $2, $3, ST_Force2D(ST_SetSRID(ST_GeomFromGeoJSON($4), 4326)))`,
          [nama, status, kec, geomStr]
        );
      }
      else if (table === 'wilayah_kecamatan') {
        const nama = getProp(['nama', 'nama_kecamatan', 'kecamatan', 'name'], 'Kecamatan');
        
        await pool.query(
          `INSERT INTO wilayah_kecamatan (nama, geom)
           VALUES ($1, ST_Multi(ST_Force2D(ST_SetSRID(ST_GeomFromGeoJSON($2), 4326))))`,
          [nama, geomStr]
        );
      }
      else if (table === 'wilayah_desa') {
        // Cari property WADMKD (standar pemetaan BIG untuk desa/kelurahan)
        const nama = getProp(['nama', 'nama_desa', 'desa', 'kelurahan', 'namobj', 'wadmkd', 'village', 'kel'], null);
        
        // Jika tidak ketemu, ambil property string pertama yang bukan ID atau kode
        let finalNama = nama;
        if (!finalNama) {
            for (const key of Object.keys(props)) {
                if (typeof props[key] === 'string' && props[key].length > 2 && !key.toLowerCase().includes('id') && !key.toLowerCase().includes('code')) {
                    finalNama = props[key];
                    break;
                }
            }
        }
        finalNama = finalNama || 'Nama Tidak Diketahui';

        await pool.query(
          `INSERT INTO wilayah_desa (nama, geom)
           VALUES ($1, ST_Multi(ST_Force2D(ST_SetSRID(ST_GeomFromGeoJSON($2), 4326))))`,
          [finalNama, geomStr]
        );
      }
      else if (table === 'pemukiman') {
        const nama = getProp(['nama', 'name', 'perumahan'], 'Pemukiman Warga');
        const kecamatan = getProp(['kecamatan', 'kec'], '');
        const deskripsi = getProp(['remark', 'deskripsi', 'desc'], 'Permukiman dan Tempat Kegiatan');
        
        await pool.query(
          `INSERT INTO pemukiman (nama, kecamatan, deskripsi, geom)
           VALUES ($1, $2, $3, ST_Multi(ST_Force2D(ST_SetSRID(ST_GeomFromGeoJSON($4), 4326))))`,
          [nama, kecamatan, deskripsi, geomStr]
        );
      }
      else if (table === 'jaringan_jalan') {
        const nama = getProp(['nama', 'nama_jalan', 'name'], 'Jalan GeoJSON');
        const tipe = getProp(['remark', 'tipe', 'type'], 'Jalan Lain');

        // We use ST_Dump to break MultiLineString into LineStrings
        await pool.query(
          `INSERT INTO jaringan_jalan (nama, tipe, geom, length)
           SELECT $1, $2, geom, ST_Length(geom::geography) 
           FROM (
             SELECT (ST_Dump(ST_Force2D(ST_SetSRID(ST_GeomFromGeoJSON($3), 4326)))).geom as geom
           ) as dumped_geom
           WHERE ST_GeometryType(geom) = 'ST_LineString'`,
          [nama, tipe, geomStr]
        );
      }

      insertedCount++;
    } catch (dbErr) {
      console.error(`Gagal insert feature ke ${table}:`, dbErr.message);
      // Lanjut ke feature berikutnya meskipun 1 gagal
    }
  }

  if (table === 'jaringan_jalan' && insertedCount > 0) {
    try {
      console.log('Building pgRouting topology manually...');
      await pool.query(`
        DROP TABLE IF EXISTS jaringan_jalan_noded CASCADE;
        CREATE TABLE jaringan_jalan_noded AS
        SELECT row_number() over() as id, 
               (geom_dump).geom as geom,
               ST_Length((geom_dump).geom::geography) as length,
               NULL::integer as source,
               NULL::integer as target
        FROM (
          SELECT ST_Dump(ST_UnaryUnion(ST_Collect(geom))) as geom_dump
          FROM jaringan_jalan
        ) AS sub;
        
        CREATE INDEX ON jaringan_jalan_noded USING GIST(geom);

        DROP TABLE IF EXISTS jaringan_jalan_vertices_pgr CASCADE;
        CREATE TABLE jaringan_jalan_vertices_pgr (
          id SERIAL PRIMARY KEY,
          the_geom GEOMETRY(Point, 4326)
        );

        INSERT INTO jaringan_jalan_vertices_pgr (the_geom)
        SELECT DISTINCT ST_SnapToGrid(geom, 0.000001) FROM (
          SELECT ST_StartPoint(geom) as geom FROM jaringan_jalan_noded
          UNION ALL
          SELECT ST_EndPoint(geom) as geom FROM jaringan_jalan_noded
        ) as pts WHERE geom IS NOT NULL;
        
        CREATE INDEX ON jaringan_jalan_vertices_pgr USING GIST(the_geom);

        CREATE TABLE jaringan_jalan_noded_new AS
        SELECT j.id, j.geom, j.length, v1.id as source, v2.id as target
        FROM jaringan_jalan_noded j
        LEFT JOIN jaringan_jalan_vertices_pgr v1 
          ON ST_SetSRID(ST_SnapToGrid(ST_StartPoint(j.geom), 0.000001), 4326) = v1.the_geom
        LEFT JOIN jaringan_jalan_vertices_pgr v2 
          ON ST_SetSRID(ST_SnapToGrid(ST_EndPoint(j.geom), 0.000001), 4326) = v2.the_geom;

        DROP TABLE jaringan_jalan_noded CASCADE;
        ALTER TABLE jaringan_jalan_noded_new RENAME TO jaringan_jalan_noded;
        CREATE INDEX ON jaringan_jalan_noded USING GIST(geom);
      `);
      console.log('Topology built successfully.');
    } catch (topErr) {
      console.error('Gagal build topology:', topErr.message);
    }
  }

  // Auto-sync lokasi (kecamatan & kelurahan) berdasarkan tumpang tindih spasial
  if (['daerah_rawan', 'wilayah_kecamatan', 'wilayah_desa'].includes(table)) {
    try {
      await pool.query(`
        UPDATE daerah_rawan dr
        SET kecamatan = wk.nama
        FROM wilayah_kecamatan wk
        WHERE ST_Intersects(dr.geom, wk.geom)
      `);
      await pool.query(`
        UPDATE daerah_rawan dr
        SET kelurahan = wd.nama
        FROM wilayah_desa wd
        WHERE ST_Intersects(dr.geom, wd.geom)
      `);
      console.log('Spatial relation for daerah_rawan updated.');
    } catch (err) {
      console.error('Gagal update spatial relation:', err.message);
    }
  }

  res.json({ 
    success: true, 
    message: `Berhasil mengimpor ${insertedCount} data spasial ke tabel ${table}.`,
    inserted: insertedCount 
  });
}));

module.exports = router;
