const pool = require('./src/db/pool');

async function buildNodedNetwork() {
  try {
    console.log('1. ST_Node collecting... (this may take 10-20 seconds)');
    await pool.query(`
      DROP TABLE IF EXISTS jaringan_jalan_noded CASCADE;
      CREATE TABLE jaringan_jalan_noded AS
      SELECT row_number() over() as id, 
             geom,
             ST_Length(geom::geography) as length,
             NULL::integer as source,
             NULL::integer as target
      FROM (
        SELECT (ST_Dump(ST_Node(ST_Collect(ST_SnapToGrid(geom, 0.00001))))).geom as geom
        FROM jaringan_jalan
      ) AS sub;
      
      CREATE INDEX ON jaringan_jalan_noded USING GIST(geom);
    `);
    
    console.log('2. Building vertices and assigning source/target...');
    await pool.query(`
      DROP TABLE IF EXISTS jaringan_jalan_vertices_pgr CASCADE;
      CREATE TABLE jaringan_jalan_vertices_pgr (
        id SERIAL PRIMARY KEY,
        the_geom GEOMETRY(Point, 4326)
      );
      
      INSERT INTO jaringan_jalan_vertices_pgr (the_geom)
      SELECT DISTINCT ST_SnapToGrid(geom, 0.00001) FROM (
        SELECT ST_StartPoint(geom) as geom FROM jaringan_jalan_noded
        UNION ALL
        SELECT ST_EndPoint(geom) as geom FROM jaringan_jalan_noded
      ) as pts WHERE geom IS NOT NULL;
      
      CREATE INDEX ON jaringan_jalan_vertices_pgr USING GIST(the_geom);
    `);

    console.log('3. Assigning source...');
    await pool.query(`
      UPDATE jaringan_jalan_noded j
      SET source = v.id
      FROM jaringan_jalan_vertices_pgr v
      WHERE ST_Equals(ST_SnapToGrid(ST_StartPoint(j.geom), 0.00001), v.the_geom);
    `);

    console.log('4. Assigning target...');
    await pool.query(`
      UPDATE jaringan_jalan_noded j
      SET target = v.id
      FROM jaringan_jalan_vertices_pgr v
      WHERE ST_Equals(ST_SnapToGrid(ST_EndPoint(j.geom), 0.00001), v.the_geom);
    `);

    console.log('Done noding and building topology!');
    
    const count = await pool.query('SELECT count(*) FROM jaringan_jalan_noded');
    console.log('Total noded segments:', count.rows[0].count);
    
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

buildNodedNetwork();
