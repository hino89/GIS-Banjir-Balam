require('dotenv').config({ path: '../../.env' });
const pool = require('./src/db/pool');
pool.query('SELECT * FROM daerah_rawan').then(r => { console.log(r.rows.map(x => x.jenis_bencana)); process.exit(0); }).catch(console.error);
