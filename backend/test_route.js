const pool = require('./src/db/pool');

async function testRouting() {
  const startLng = 105.2991;
  const startLat = -5.4342;
  const endLng = 105.3157;
  const endLat = -5.4616;

  try {
    const startNodeQuery = await pool.query(`
      SELECT id FROM jaringan_jalan_vertices_pgr 
      ORDER BY the_geom <-> ST_SetSRID(ST_MakePoint($1, $2), 4326) LIMIT 1
    `, [startLng, startLat]);
    
    const endNodeQuery = await pool.query(`
      SELECT id FROM jaringan_jalan_vertices_pgr 
      ORDER BY the_geom <-> ST_SetSRID(ST_MakePoint($1, $2), 4326) LIMIT 1
    `, [endLng, endLat]);

    const startNode = startNodeQuery.rows[0].id;
    const endNode = endNodeQuery.rows[0].id;

    console.log(`Routing from node ${startNode} to ${endNode}...`);

    // 1. Without penalty
    console.time('No Penalty');
    const res1 = await pool.query(`
      SELECT * FROM pgr_dijkstra(
        'SELECT id, source, target, length as cost FROM jaringan_jalan_noded',
        $1::bigint, $2::bigint, false
      )
    `, [startNode, endNode]);
    console.timeEnd('No Penalty');
    console.log('Path without penalty length:', res1.rows.length);

    // 2. With penalty
    console.time('With Penalty');
    const res2 = await pool.query(`
      SELECT * FROM pgr_dijkstra(
        'SELECT id, source, target, 
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM daerah_rawan dr 
              WHERE dr.jenis_bencana ILIKE ''%banjir%'' 
                AND (
                  (GeometryType(dr.geom) = ''POINT'' AND ST_DWithin(j.geom, dr.geom, 0.0002))
                  OR 
                  (GeometryType(dr.geom) != ''POINT'' AND ST_Intersects(j.geom, dr.geom))
                )
            ) THEN -1 
            ELSE j.length 
          END as cost 
         FROM jaringan_jalan_noded j',
        $1::bigint, $2::bigint, false
      )
    `, [startNode, endNode]);
    console.timeEnd('With Penalty');
    console.log('Path with penalty length:', res2.rows.length);

  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

testRouting();
