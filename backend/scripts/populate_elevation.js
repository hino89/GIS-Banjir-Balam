require('dotenv').config({ path: '../.env' });
const pool = require('../src/db/pool');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  console.log('Altering table...');
  await pool.query(`ALTER TABLE wilayah_desa ADD COLUMN IF NOT EXISTS latitude NUMERIC`);
  await pool.query(`ALTER TABLE wilayah_desa ADD COLUMN IF NOT EXISTS longitude NUMERIC`);
  await pool.query(`ALTER TABLE wilayah_desa ADD COLUMN IF NOT EXISTS elevasi NUMERIC`);

  console.log('Calculating centroids...');
  await pool.query(`
    UPDATE wilayah_desa 
    SET latitude = ST_Y(ST_Centroid(geom)),
        longitude = ST_X(ST_Centroid(geom))
    WHERE geom IS NOT NULL
  `);

  console.log('Fetching locations...');
  const res = await pool.query(`SELECT id, latitude, longitude FROM wilayah_desa WHERE latitude IS NOT NULL`);
  const locations = res.rows;
  console.log(`Found ${locations.length} locations`);

  // Open Meteo /v1/elevation limit is 100 locations per request
  const batchSize = 100;
  for (let i = 0; i < locations.length; i += batchSize) {
    const batch = locations.slice(i, i + batchSize);
    console.log(`Processing batch ${i} to ${i + batch.length - 1}`);
    
    const lats = batch.map(l => l.latitude).join(',');
    const lons = batch.map(l => l.longitude).join(',');
    
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lons}`;
    const apiRes = await fetch(url);
    const data = await apiRes.json();
    
    if (data.elevation && data.elevation.length === batch.length) {
      for (let j = 0; j < batch.length; j++) {
        const elev = data.elevation[j];
        await pool.query('UPDATE wilayah_desa SET elevasi = $1 WHERE id = $2', [elev, batch[j].id]);
      }
      console.log('Batch updated.');
    } else {
      console.error('Failed to parse elevation data', data);
    }
    await sleep(2000); // polite delay
  }
  
  console.log('Done!');
  process.exit(0);
}

run().catch(console.error);
