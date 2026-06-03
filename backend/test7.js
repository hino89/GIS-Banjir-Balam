const pool = require('./src/db/pool');

async function buildProperTopology() {
  try {
    console.log('1. ST_UnaryUnion noding...');
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
    `);
    
    console.log('2. Building vertices...');
    await pool.query(`
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
    `);

    console.log('3. Assigning source/target...');
    await pool.query(`
      UPDATE jaringan_jalan_noded j
      SET source = v.id
      FROM jaringan_jalan_vertices_pgr v
      WHERE ST_Equals(ST_SnapToGrid(ST_StartPoint(j.geom), 0.000001), v.the_geom);

      UPDATE jaringan_jalan_noded j
      SET target = v.id
      FROM jaringan_jalan_vertices_pgr v
      WHERE ST_Equals(ST_SnapToGrid(ST_EndPoint(j.geom), 0.000001), v.the_geom);
    `);

    console.log('4. Testing component sizes...');
    const res = await pool.query(`
      WITH RECURSIVE components AS (
        SELECT source as node, source as root FROM jaringan_jalan_noded
        UNION
        SELECT j.target, c.root
        FROM jaringan_jalan_noded j
        INNER JOIN components c ON j.source = c.node
        WHERE j.target != c.node
      )
      SELECT root, count(*) as size FROM components GROUP BY root ORDER BY size DESC LIMIT 1;
    `);
    console.log('Max component size:', res.rows[0].size);
    
  } catch (err) {
    console.error(err.message);
  } finally {
    pool.end();
  }
}

buildProperTopology();
