require('dotenv').config({ path: '../../.env' });
const pool = require('./src/db/pool');
pool.query('SELECT kelurahan, tingkat_risiko FROM daerah_rawan').then(r => { console.log(r.rows); process.exit(0); }).catch(console.error);
