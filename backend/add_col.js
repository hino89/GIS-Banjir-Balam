require('dotenv').config({ path: '../../.env' });
const pool = require('./src/db/pool');
pool.query('ALTER TABLE wilayah_desa ADD COLUMN IF NOT EXISTS kecamatan VARCHAR(100);').then(() => { console.log('Column added'); process.exit(0); });
