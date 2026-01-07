// Test sequelize instance loading
const sequelize = require('./node_modules/my-old-space/drive_root/db/sequelize_instance');

console.log('Sequelize config:');
console.log('  Dialect:', sequelize.options.dialect);
console.log('  Database:', sequelize.config.database);
console.log('  Host:', sequelize.config.host);
console.log('  Port:', sequelize.config.port);

sequelize.authenticate()
  .then(() => {
    console.log('\n✓ DB Connection OK');
    return sequelize.query(
      "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'",
      { type: sequelize.QueryTypes.SELECT }
    );
  })
  .then(tables => {
    console.log('\nTables in DB:');
    if (tables.length === 0) {
      console.log('  ⚠ NO TABLES FOUND! Database is empty.');
    } else {
      tables.forEach(t => console.log('  -', t.tablename));
    }
    
    const tableNames = tables.map(t => t.tablename);
    console.log('\n✓ users table:', tableNames.includes('users') ? 'EXISTS' : '❌ MISSING');
    console.log('✓ sessions table:', tableNames.includes('sessions') ? 'EXISTS' : '❌ MISSING');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('\n✗ DB Error:', err.message);
    process.exit(1);
  });
