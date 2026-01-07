/**
 * Simple SQL seed for accommodation_types
 */

const sequelize = require('../../../node_modules/my-old-space/drive_root/db/sequelize_instance');

async function seed() {
    try {
        console.log('Starting seed...');
        
        // Create table
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS accommodation_types (
                id INTEGER PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT
            )
        `);
        
        // Clear existing data
        await sequelize.query('DELETE FROM accommodation_types');
        
        // Insert types
        await sequelize.query(`
            INSERT INTO accommodation_types (id, name, description) VALUES
            (1, 'Отель', 'Классическая гостиница с полным спектром услуг'),
            (2, 'Апартаменты', 'Квартиры для краткосрочной аренды'),
            (3, 'Хостел', 'Бюджетное размещение с общими комнатами'),
            (4, 'Гостевой дом', 'Семейное размещение в частном доме'),
            (5, 'Альпийская хижина', 'Размещение в горах')
        `);
        
        console.log('Created 5 accommodation types');
        
        // Add column to organizations if not exists
        try {
            await sequelize.query(`
                ALTER TABLE organizations ADD COLUMN accommodationTypeId INTEGER
            `);
            console.log('Added accommodationTypeId column to organizations');
        } catch (e) {
            console.log('Column accommodationTypeId already exists');
        }
        
        // Add foreign key constraint
        try {
            await sequelize.query(`
                ALTER TABLE organizations 
                ADD CONSTRAINT fk_organizations_accommodation_type 
                FOREIGN KEY (accommodationTypeId) 
                REFERENCES accommodation_types(id)
                ON DELETE SET NULL
                ON UPDATE CASCADE
            `);
            console.log('Added foreign key constraint');
        } catch (e) {
            console.log('Foreign key constraint already exists or error:', e.message);
        }
        
        // Update organizations
        await sequelize.query(`
            UPDATE organizations SET accommodationTypeId = 
                CASE 
                    WHEN name LIKE '%Alpenhütte%' OR name LIKE '%Bergwiese%' THEN 5
                    WHEN name LIKE '%Appartement%' THEN 2
                    WHEN name LIKE '%Hostel%' THEN 3
                    WHEN name LIKE '%Bauernhof%' OR name LIKE '%Guesthouse%' THEN 4
                    ELSE 1
                END
        `);
        
        // Show distribution
        const [results] = await sequelize.query(`
            SELECT o.accommodationTypeId, t.name, COUNT(*) as count 
            FROM organizations o
            LEFT JOIN accommodation_types t ON o.accommodationTypeId = t.id
            GROUP BY o.accommodationTypeId, t.name
        `);
        
        console.log('\nDistribution:');
        for (const row of results) {
            console.log(`  ${row.name}: ${row.count}`);
        }
        
        console.log('\nSeed completed!');
        process.exit(0);
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

seed();
