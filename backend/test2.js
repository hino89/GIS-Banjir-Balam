const pool = require('./src/db/pool');
pool.query(`SELECT proname FROM pg_proc WHERE proname ILIKE '%node%';`)
  .then(res => console.table(res.rows))
  .finally(() => pool.end());
