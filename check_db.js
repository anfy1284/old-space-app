const {Sequelize} = require('sequelize');
const dbSettings = require('./dbSettings.json');

const config = {
  dialect: dbSettings.dialect || 'postgres',
  logging: false
};

if (dbSettings.host) config.host = dbSettings.host;
if (dbSettings.port) config.port = dbSettings.port;
if (dbSettings.database) config.database = dbSettings.database;
if (dbSettings.user) config.username = dbSettings.user;
if (dbSettings.password) config.password = String(dbSettings.password);
if (dbSettings.storage) config.storage = dbSettings.storage;

console.log('Using DB config:', { ...config, password: config.password ? '***' : undefined });

const sequelize = new Sequelize(config);

sequelize.authenticate()
  .then(() => {
    console.log('✓ DB Connection OK');
    return sequelize.query(
      "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'",
      { type: sequelize.QueryTypes.SELECT }
    );
  })
  .then(tables => {
    console.log('\nTables in DB:');
    tables.forEach(t => console.log('  -', t.tablename));
    
    // Check specifically for users and sessions
    const tableNames = tables.map(t => t.tablename);
    console.log('\n✓ users table exists:', tableNames.includes('users'));
    console.log('✓ sessions table exists:', tableNames.includes('sessions'));
    
    process.exit(0);
  })
  .catch(err => {
    console.error('✗ DB Error:', err.message);
    process.exit(1);
  });
