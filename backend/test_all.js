require('dotenv').config({ path: '../../.env' });
const pool = require('./src/db/pool');

async function test() {
  const dbResult = await pool.query(`SELECT nama, ST_Y(ST_Centroid(geom)) as lat, ST_X(ST_Centroid(geom)) as lon FROM wilayah_desa WHERE geom IS NOT NULL`);
  const kelurahanList = dbResult.rows;

  const lats = kelurahanList.map(k => k.lat.toFixed(5)).join(',');
  const lons = kelurahanList.map(k => k.lon.toFixed(5)).join(',');

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=precipitation,rain&elevation=nan&timezone=Asia%2FJakarta`;
  
  const response = await fetch(url);
  console.log(response.status);
  const data = await response.json();
  if (!response.ok) { console.log(data); return; }
  
  const resultMap = {};
  data.forEach((d, idx) => {
    const kel = kelurahanList[idx].nama.toUpperCase();
    resultMap[kel] = {
      elevasi: d.elevation,
      presipitasi: d.current.precipitation,
      hujan: d.current.rain
    };
  });
  console.log(Object.keys(resultMap).slice(0, 5));
  console.log(resultMap[Object.keys(resultMap)[0]]);
  process.exit(0);
}
test().catch(console.error);
