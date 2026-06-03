const pool = require('./src/db/pool');

async function testConnectivity() {
  try {
    const res = await pool.query(`
      WITH RECURSIVE connected AS (
        SELECT source, target FROM jaringan_jalan WHERE source = 1226 OR target = 1226
        UNION
        SELECT j.source, j.target 
        FROM jaringan_jalan j
        INNER JOIN connected c ON j.source = c.source OR j.source = c.target OR j.target = c.source OR j.target = c.target
      )
      SELECT count(*) FROM connected;
    `);
    console.log('Connected component size:', res.rows[0].count);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

testConnectivity();
