require('dotenv').config({ path: '../../.env' });
const pool = require('./src/db/pool');
pool.query('DROP TABLE IF EXISTS daerah_rawan CASCADE;').then(() => { console.log("Table dropped"); process.exit(0); }).catch(console.error);
