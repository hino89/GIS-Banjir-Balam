const pool = require('./src/db/pool');
pool.query(`SELECT pgr_createTopology('jaringan_jalan', 0.00001, 'geom', 'id', 'source', 'target')`)
  .then(res => {
    console.log('Topology built:', res.rows);
  })
  .catch(e => {
    console.error('ERROR:', e.message);
  })
  .finally(() => {
    pool.end();
  });
