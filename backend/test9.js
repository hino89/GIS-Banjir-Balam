const pool = require('./src/db/pool');

async function fixFast() {
  try {
    console.time('Fixing source');
    await pool.query(`
      UPDATE jaringan_jalan_noded j
      SET source = (
        SELECT id FROM jaringan_jalan_vertices_pgr v
        ORDER BY ST_StartPoint(j.geom) <-> v.the_geom
        LIMIT 1
      );
    `);
    console.timeEnd('Fixing source');

    console.time('Fixing target');
    await pool.query(`
      UPDATE jaringan_jalan_noded j
      SET target = (
        SELECT id FROM jaringan_jalan_vertices_pgr v
        ORDER BY ST_EndPoint(j.geom) <-> v.the_geom
        LIMIT 1
      );
    `);
    console.timeEnd('Fixing target');

    console.log('Done!');
  } catch(e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
}

fixFast();
