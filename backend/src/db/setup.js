require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  // 1. Connection string configuration
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/sig_bandar_lampung';
  
  // Parse target DB name from DATABASE_URL
  const targetDbName = databaseUrl.split('/').pop().split('?')[0] || 'sig_bandar_lampung';
  
  // Create a connection URL for the default 'postgres' database to create the new DB
  const postgresUrl = databaseUrl.replace(new RegExp(`/${targetDbName}(\\?|$)`), '/postgres$1');

  console.log(`Connecting to temporary database: postgres...`);
  const clientTmp = new Client({ connectionString: postgresUrl });
  
  try {
    await clientTmp.connect();
    
    // Check if target database exists
    const dbCheck = await clientTmp.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDbName]
    );

    if (dbCheck.rowCount > 0) {
      console.log(`Database '${targetDbName}' already exists. Dropping for a clean setup...`);
      // Terminate any active connections to the database to allow dropping
      await clientTmp.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = $1
          AND pid <> pg_backend_pid();
      `, [targetDbName]);
      await clientTmp.query(`DROP DATABASE "${targetDbName}"`);
      console.log(`Database '${targetDbName}' dropped.`);
    }
    
    console.log(`Creating database '${targetDbName}'...`);
    await clientTmp.query(`CREATE DATABASE "${targetDbName}"`);
    console.log(`Database '${targetDbName}' created successfully.`);
  } catch (error) {
    console.error('Error creating database:', error);
    process.exit(1);
  } finally {
    await clientTmp.end();
  }

  // 2. Connect to the newly created database and run the schema
  console.log(`Connecting to target database: ${targetDbName}...`);
  const clientTarget = new Client({ connectionString: databaseUrl });

  try {
    await clientTarget.connect();

    // Read the schema.sql file
    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log(`Reading schema from ${schemaPath}...`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema...');
    // We execute the SQL statements. 
    // Since schema.sql might contain multiple statements that PostgreSQL can execute in one query block,
    // clientTarget.query can execute it directly.
    await clientTarget.query(schemaSql);
    console.log('Schema executed successfully. Database initialized with PostGIS extensions and tables.');

  } catch (error) {
    console.error('Error executing schema:', error);
    process.exit(1);
  } finally {
    await clientTarget.end();
  }

  // 3. Run the seed script
  console.log('Running database seeding...');
  try {
    // Require and run seed
    const seed = require('./seed.js');
    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
  
  console.log('Database setup complete!');
}

run();
