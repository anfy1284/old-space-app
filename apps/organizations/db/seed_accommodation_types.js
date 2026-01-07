/**
 * Seed data for accommodation_types and update organizations
 */

const path = require('path');
const sequelize = require('../../../node_modules/my-old-space/drive_root/db/sequelize_instance');

async function seed() {
    try {
        console.log('Starting seed for accommodation_types...');
        
        // Initialize models with correct project root
        const projectRoot = path.resolve(__dirname, '../../..');
        const globalServerContext = require('../../../node_modules/my-old-space/drive_root/globalServerContext');
        await globalServerContext.initModelsDB(projectRoot);
        
        // Get models from modelsDB
        const modelsDB = globalServerContext.modelsDB;
        
        const AccommodationTypes = modelsDB.AccommodationTypes;
        const Organizations = modelsDB.Organizations;
        
        if (!AccommodationTypes) {
            throw new Error('AccommodationTypes model not found');
        }
        
        // Sync table (create if not exists)
        await AccommodationTypes.sync({ alter: true });
        await Organizations.sync({ alter: true });
        
        // Clear existing data
        await AccommodationTypes.destroy({ where: {}, truncate: true });
        
        // Insert accommodation types
        const types = [
            { id: 1, name: 'Отель', description: 'Классическая гостиница с полным спектром услуг' },
            { id: 2, name: 'Апартаменты', description: 'Квартиры для краткосрочной аренды' },
            { id: 3, name: 'Хостел', description: 'Бюджетное размещение с общими комнатами' },
            { id: 4, name: 'Гостевой дом', description: 'Семейное размещение в частном доме' },
            { id: 5, name: 'Альпийская хижина', description: 'Размещение в горах' }
        ];
        
        for (const type of types) {
            await AccommodationTypes.create(type);
        }
        
        console.log(`Created ${types.length} accommodation types`);
        
        // Update organizations with accommodation types
        const organizations = await Organizations.findAll();
        
        for (const org of organizations) {
            // Assign types based on name patterns
            let typeId = 1; // Default: Hotel
            
            if (org.name.includes('Alpenhütte') || org.name.includes('Bergwiese')) {
                typeId = 5; // Alpine hut
            } else if (org.name.includes('Appartement')) {
                typeId = 2; // Apartments
            } else if (org.name.includes('Hostel')) {
                typeId = 3; // Hostel
            } else if (org.name.includes('Bauernhof') || org.name.includes('Guesthouse')) {
                typeId = 4; // Guest house
            }
            
            await org.update({ accommodationTypeId: typeId });
        }
        
        console.log(`Updated ${organizations.length} organizations with accommodation types`);
        
        // Show distribution
        const distribution = await Organizations.findAll({
            attributes: [
                'accommodationTypeId',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['accommodationTypeId'],
            raw: true
        });
        
        console.log('\nDistribution:');
        for (const item of distribution) {
            const type = types.find(t => t.id === item.accommodationTypeId);
            console.log(`  ${type?.name || 'Unknown'}: ${item.count}`);
        }
        
        console.log('\nSeed completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}

seed();
