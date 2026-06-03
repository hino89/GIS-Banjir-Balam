const pool = require('./src/db/pool');

async function fixNulls() {
  try {
    console.log('Fixing source...');
    await pool.query(`
      UPDATE jaringan_jalan_noded j
      SET source = v.id
      FROM jaringan_jalan_vertices_pgr v
      WHERE ST_DWithin(ST_StartPoint(j.geom), v.the_geom, 0.00001);
    `);

    console.log('Fixing target...');
    await pool.query(`
      UPDATE jaringan_jalan_noded j
      SET target = v.id
      FROM jaringan_jalan_vertices_pgr v
      WHERE ST_DWithin(ST_EndPoint(j.geom), v.the_geom, 0.00001);
    `);

    console.log('Done!');
  } catch(e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
}

fixNulls();
