const pool = require('./src/db/pool');

async function updateSpatialData() {
  try {
    console.log('Menyinkronkan data kecamatan pada daerah_rawan...');
    const resKec = await pool.query(`
      UPDATE daerah_rawan dr
      SET kecamatan = wk.nama
      FROM wilayah_kecamatan wk
      WHERE ST_Intersects(dr.geom, wk.geom)
    `);
    console.log(`Berhasil mengupdate ${resKec.rowCount} baris kecamatan.`);

    console.log('Menyinkronkan data kelurahan pada daerah_rawan...');
    const resKel = await pool.query(`
      UPDATE daerah_rawan dr
      SET kelurahan = wd.nama
      FROM wilayah_desa wd
      WHERE ST_Intersects(dr.geom, wd.geom)
    `);
    console.log(`Berhasil mengupdate ${resKel.rowCount} baris kelurahan.`);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

updateSpatialData();
