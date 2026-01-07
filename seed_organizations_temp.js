/**
 * Temporary script to seed organizations table with test data
 * Run: node seed_organizations_temp.js
 */

const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');

// Read database settings
const dbSettings = JSON.parse(fs.readFileSync(path.join(__dirname, 'dbSettings.postgres.json'), 'utf8'));

// Create Sequelize instance
const sequelize = new Sequelize(dbSettings.database, dbSettings.username, dbSettings.password, {
    host: dbSettings.host,
    port: dbSettings.port,
    dialect: dbSettings.dialect,
    logging: false
});

// Define Organizations model
const Organizations = sequelize.define('Organizations', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'organizations',
    timestamps: true
});

(async () => {
    
    if (!Organizations) {
        console.error('[seed] Model Organizations not found in modelsDB');
        process.exit(1);
    }
    
    // Check if data already exists
    const count = await Organizations.count();
    if (count > 0) {
        console.log(`[seed] Already ${count} organizations exist, skipping seed`);
        process.exit(0);
    }
    
    console.log('[seed] Creating 100 test organizations...');
    
    // Base names for Ferienwohnungen in Allgäu
    const baseNames = [
        'Ferienwohnung Alpenblick', 'Ferienwohnung Bergtraum', 'Ferienwohnung Talblick',
        'Landhaus Sonnenschein', 'Landhaus Waldruhe', 'Landhaus Bergfrieden',
        'Berghotel Panorama', 'Berghotel Alpenrose', 'Berghotel Edelweiß',
        'Chalet Bergfrieden', 'Chalet Schneeberg', 'Chalet Alpspitze',
        'Pension Edelweiß', 'Pension Alpenrose', 'Pension Almhütte',
        'Appartement Zugspitze', 'Appartement Bergwiese', 'Appartement Seenblick',
        'Ferienhaus Alptraum', 'Ferienhaus Bergsonne', 'Ferienhaus Waldglück',
        'Gästehaus Bergsee', 'Gästehaus Almblick', 'Gästehaus Tannenhof',
        'Gasthof Alpenstube', 'Gasthof Hirsch', 'Gasthof Löwen',
        'Hotel Bergkristall', 'Hotel Alpenland', 'Hotel Königsschloss',
        'Alpenhütte Sonnspitz', 'Alpenhütte Naturblick', 'Alpenhütte Gipfeltraum',
        'Berggasthof Adlerhorst', 'Berggasthof Tannenhöhe', 'Berggasthof Enzian',
        'Feriendorf Alpenglück', 'Feriendorf Bergoase', 'Feriendorf Naturpark',
        'Appartementhaus Bergliebe', 'Appartementhaus Alpenstern', 'Appartementhaus Bergruh',
        'Ferienpark Allgäu', 'Ferienpark Bergwelt', 'Ferienpark Alpenpanorama',
        'Wellness Hotel Bergquell', 'Wellness Hotel Naturidyll', 'Wellness Hotel Alpina',
        'Bauernhof Bergwiese', 'Bauernhof Almfreude', 'Bauernhof Wiesenhof'
    ];
    
    const regions = ['Oberallgäu', 'Ostallgäu', 'Unterallgäu', 'Westallgäu'];
    
    const descriptions = [
        'Gemütliche Ferienwohnung im Herzen des {region}. Ideal für Familien und Wanderer.',
        'Moderne Unterkunft mit herrlichem Bergblick in {region}. Perfekt für Ihren Urlaub.',
        'Traditionelles Ferienhaus in ruhiger Lage im {region}. Nähe zu Skigebieten.',
        'Exklusive Unterkunft mit Wellness-Bereich im {region}. Luxus und Erholung.',
        'Charmante Pension mit Frühstück im {region}. Familiäre Atmosphäre.',
        'Großzügiges Appartement mit Balkon im {region}. Zentrale Lage.',
        'Rustikale Almhütte für Naturliebhaber im {region}. Absolute Ruhe.',
        'Komfortables Hotel mit Restaurant im {region}. Alle Annehmlichkeiten.',
        'Gemütliches Chalet mit Kamin im {region}. Romantischer Rückzugsort.',
        'Moderne Ferienwohnung mit WLAN im {region}. Bestens ausgestattet.'
    ];
    
    const organizations = [];
    
    for (let i = 0; i < 100; i++) {
        const baseName = baseNames[i % baseNames.length];
        const region = regions[i % regions.length];
        const descTemplate = descriptions[i % descriptions.length];
        
        // Add region suffix for uniqueness
        const name = i < baseNames.length ? baseName : `${baseName} ${region}`;
        const description = descTemplate.replace('{region}', region);
        const isActive = Math.random() > 0.1; // 90% active
        
        organizations.push({
            name,
            description,
            isActive
        });
    }
    
    try {
        await Organizations.bulkCreate(organizations);
        console.log(`[seed] Successfully created ${organizations.length} organizations`);
        process.exit(0);
    } catch (error) {
        console.error('[seed] Error creating organizations:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
})();
