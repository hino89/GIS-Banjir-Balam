const pool = require('./src/db/pool');

async function testUnaryUnion() {
  try {
    console.time('ST_UnaryUnion');
    const res = await pool.query(`
      SELECT ST_Dump(ST_UnaryUnion(ST_Collect(geom))) as geom
      FROM jaringan_jalan
    `);
    console.timeEnd('ST_UnaryUnion');
    console.log('Result rows:', res.rows.length);
  } catch (err) {
    console.error(err.message);
  } finally {
    pool.end();
  }
}

testUnaryUnion();
