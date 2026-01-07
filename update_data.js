const { Sequelize } = require('sequelize');
const dbSettings = require('./dbSettings.postgres.json');

const sequelize = new Sequelize(dbSettings.database, dbSettings.username, dbSettings.password, {
    host: dbSettings.host,
    port: dbSettings.port,
    dialect: dbSettings.dialect,
    logging: console.log
});

async function updateData() {
    try {
        console.log('Updating organizations with accommodation types...');
        
        const [result] = await sequelize.query(`
            UPDATE organizations SET "accommodationTypeId" = 
                CASE 
                    WHEN name LIKE '%Alpenhütte%' OR name LIKE '%Bergwiese%' THEN 5
                    WHEN name LIKE '%Appartement%' THEN 2
                    WHEN name LIKE '%Hostel%' THEN 3
                    WHEN name LIKE '%Bauernhof%' OR name LIKE '%Guesthouse%' THEN 4
                    ELSE 1
                END
        `);
        
        console.log('Update result:', result);
        
        // Show distribution
        const [results] = await sequelize.query(`
            SELECT o."accommodationTypeId", t.name, COUNT(*) as count 
            FROM organizations o
            LEFT JOIN accommodation_types t ON o."accommodationTypeId" = t.id
            GROUP BY o."accommodationTypeId", t.name
            ORDER BY o."accommodationTypeId"
        `);
        
        console.log('\nDistribution:');
        for (const row of results) {
            console.log(`  ${row.name}: ${row.count}`);
        }
        
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await sequelize.close();
    }
}

updateData();
