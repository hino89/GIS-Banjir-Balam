const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const { startLat, startLng, endLat, endLng } = req.query;
    if (!startLat || !startLng || !endLat || !endLng) {
      return res.status(400).json({ error: 'Missing start or end coordinates' });
    }

    // 1. Temukan node terdekat untuk Titik Awal
    const startNodeQuery = await pool.query(`
      SELECT id FROM jaringan_jalan_vertices_pgr 
      ORDER BY the_geom <-> ST_SetSRID(ST_MakePoint($1, $2), 4326) LIMIT 1
    `, [startLng, startLat]);
    
    // 2. Temukan node terdekat untuk Titik Tujuan
    const endNodeQuery = await pool.query(`
      SELECT id FROM jaringan_jalan_vertices_pgr 
      ORDER BY the_geom <-> ST_SetSRID(ST_MakePoint($1, $2), 4326) LIMIT 1
    `, [endLng, endLat]);

    if (startNodeQuery.rows.length === 0 || endNodeQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Tidak dapat menemukan jalan terdekat (Jaringan jalan kosong).' });
    }

    const startNode = startNodeQuery.rows[0].id;
    const endNode = endNodeQuery.rows[0].id;

    // 3. Jalankan pgRouting Dijkstra dengan Dynamic Cost!
    // cost normal = panjang jalan. cost banjir = 999999 (dihindari)
    const routingQuery = `
      SELECT 
        ST_AsGeoJSON(j.geom) as geometry,
        p.cost
      FROM pgr_dijkstra(
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
      ) as p
      JOIN jaringan_jalan_noded j ON p.edge = j.id
    `;

    const routeResult = await pool.query(routingQuery, [startNode, endNode]);
    
    if (routeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rute tidak ditemukan.' });
    }

    // Kembalikan sebagai GeoJSON FeatureCollection
    const features = routeResult.rows.map((r, idx) => ({
      type: 'Feature',
      geometry: JSON.parse(r.geometry),
      properties: { 
        step: idx,
        cost: r.cost 
      }
    }));

    res.json({
      type: 'FeatureCollection',
      features
    });

  } catch (error) {
    console.error('Routing error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
