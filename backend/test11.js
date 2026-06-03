const pool = require('./src/db/pool');

async function fixWithSelect() {
  try {
    console.time('CTAS Replace');
    await pool.query(`
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
    console.timeEnd('CTAS Replace');

    const res = await pool.query('SELECT count(*) FROM jaringan_jalan_noded WHERE source IS NULL OR target IS NULL');
    console.log('Nulls remaining:', res.rows[0].count);
    
  } catch(e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
}

fixWithSelect();
