const pool = require('./src/db/pool');

async function fixExact() {
  try {
    console.time('Exact Join');
    await pool.query(`
      UPDATE jaringan_jalan_noded j
      SET source = v.id
      FROM jaringan_jalan_vertices_pgr v
      WHERE ST_SetSRID(ST_SnapToGrid(ST_StartPoint(j.geom), 0.000001), 4326) = v.the_geom;

      UPDATE jaringan_jalan_noded j
      SET target = v.id
      FROM jaringan_jalan_vertices_pgr v
      WHERE ST_SetSRID(ST_SnapToGrid(ST_EndPoint(j.geom), 0.000001), 4326) = v.the_geom;
    `);
    console.timeEnd('Exact Join');

    console.log('Done exact match!');
  } catch(e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
}

fixExact();
