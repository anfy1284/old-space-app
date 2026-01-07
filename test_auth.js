// Debug: Create test script to simulate the flow
const globalServerContext = require('./node_modules/my-old-space/drive_root/globalServerContext');

async function testAuth() {
  // Get a real session from DB
  const sequelize = require('./node_modules/my-old-space/drive_root/db/sequelize_instance');
  
  const sessions = await sequelize.query(
    'SELECT "sessionId", "userId" FROM sessions WHERE "userId" IS NOT NULL LIMIT 1',
    { type: sequelize.QueryTypes.SELECT }
  );
  
  if (sessions.length === 0) {
    console.log('❌ No valid sessions with userId found!');
    process.exit(1);
  }
  
  const testSessionId = sessions[0].sessionId;
  console.log(`Testing with sessionID: ${testSessionId}\n`);
  
  // Test getUserBySessionID
  try {
    const user = await globalServerContext.getUserBySessionID(testSessionId);
    if (user) {
      console.log('✓ getUserBySessionID SUCCESS!');
      console.log('  User:', user);
    } else {
      console.log('❌ getUserBySessionID returned NULL');
    }
  } catch (err) {
    console.error('❌ getUserBySessionID ERROR:', err.message);
  }
  
  // Test with null/undefined
  console.log('\nTesting with null sessionID:');
  const result = await globalServerContext.getUserBySessionID(null);
  console.log('  Result:', result);
  
  process.exit(0);
}

testAuth();
