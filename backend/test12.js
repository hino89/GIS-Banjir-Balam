const pool = require('./src/db/pool');

async function testIntersects() {
  try {
    const res = await pool.query(`
      SELECT j.id, dr.jenis_bencana, ST_Intersects(j.geom, dr.geom) as intersects
      FROM jaringan_jalan_noded j
      JOIN daerah_rawan dr ON ST_Intersects(j.geom, dr.geom)
      WHERE dr.jenis_bencana ILIKE '%banjir%'
      LIMIT 10
    `);
    console.table(res.rows);
  } catch(e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
}

testIntersects();
