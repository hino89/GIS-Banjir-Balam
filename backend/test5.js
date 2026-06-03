const pool = require('./src/db/pool');

async function testComponentSizes() {
  try {
    const res = await pool.query(`
      WITH RECURSIVE components AS (
        SELECT source as node, source as root FROM jaringan_jalan
        UNION
        SELECT j.target, c.root
        FROM jaringan_jalan j
        INNER JOIN components c ON j.source = c.node
        WHERE j.target != c.node
      )
      SELECT root, count(*) as size FROM components GROUP BY root ORDER BY size DESC LIMIT 10;
    `);
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

testComponentSizes();
