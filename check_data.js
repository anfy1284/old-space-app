const { Sequelize } = require('sequelize');
const dbSettings = require('./dbSettings.postgres.json');

const sequelize = new Sequelize(dbSettings.database, dbSettings.username, dbSettings.password, {
    host: dbSettings.host,
    port: dbSettings.port,
    dialect: dbSettings.dialect,
    logging: false
});

async function check() {
    try {
        const [results] = await sequelize.query(`
            SELECT "accommodationTypeId", COUNT(*) as count 
            FROM organizations 
            GROUP BY "accommodationTypeId"
        `);
        
        console.log('Distribution of accommodationTypeId:');
        console.log(results);
        
        const [sample] = await sequelize.query(`
            SELECT id, name, "accommodationTypeId" 
            FROM organizations 
            LIMIT 5
        `);
        
        console.log('\nSample rows:');
        console.log(sample);
        
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await sequelize.close();
    }
}

check();
