// Check if there are users and sessions in DB
const sequelize = require('./node_modules/my-old-space/drive_root/db/sequelize_instance');

async function checkData() {
  try {
    await sequelize.authenticate();
    console.log('✓ DB Connected\n');
    
    // Check users
    const users = await sequelize.query(
      'SELECT id, name, email, "isGuest" FROM users LIMIT 10',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log(`Users in database: ${users.length}`);
    if (users.length === 0) {
      console.log('  ❌ NO USERS FOUND!');
    } else {
      users.forEach(u => {
        console.log(`  - ID ${u.id}: ${u.name} (${u.email || 'no email'}) ${u.isGuest ? '[GUEST]' : ''}`);
      });
    }
    
    // Check sessions
    const sessions = await sequelize.query(
      'SELECT id, "sessionId", "userId", "isGuest", "createdAt" FROM sessions LIMIT 10',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log(`\nSessions in database: ${sessions.length}`);
    if (sessions.length === 0) {
      console.log('  ❌ NO SESSIONS FOUND!');
    } else {
      sessions.forEach(s => {
        console.log(`  - SessionID: ${s.sessionId.substring(0, 20)}... → UserID: ${s.userId || 'NULL'} ${s.isGuest ? '[GUEST]' : ''}`);
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkData();
