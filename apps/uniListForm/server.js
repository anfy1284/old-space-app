const crypto = require('crypto');

// Use the generic framework memory store (namespace: 'datasets')
const memoryStore = require('../../node_modules/my-old-space/drive_root/memory_store');
const { dataApp } = require('../../node_modules/my-old-space/drive_forms/dataApp');
const { read } = require('fs');
const config = require('./config.json');
try { const dbg = memoryStore.debugKeysSync('datasets'); console.log('[recordEditor] memoryStore init; datasetsCount=', dbg.count); } catch (e) {}

// use shared.storeDataset for dataset persistence

function getData() {
    let data = []
    return data;
}

function getLayout() {
    let layout = [
        {
            type: 'table',
            caption: 'Организации (БД)',
            // dynamicTable true signals client to construct a DynamicTable bound to a server table
            properties: { dynamicTable: true, appName: config.name, tableName: 'organizations', visibleRows: 10, editable: true, showToolbar: true, initialSort: [{ field: 'name', order: 'asc' }] }
        }
    ];

    return layout;
}

function getLayoutWithData() {
    // Return layout and data together for atomic loading
    try {
        const layout = getLayout();
        const data = getData();
        // Store the returned payload in server memory and expose a datasetId
        const payload = { layout: layout || [], data: data || [] };
        const datasetId = dataApp.storeDataset(payload);
        return { layout: payload.layout, data: payload.data, datasetId };
    } catch (e) {
        return { layout: [], data: [], datasetId: null };
    }
}

async function applyChanges(datasetId, changes) {
    try {
        console.log('[recordEditor] applyChanges called. process.pid=', process && process.pid ? process.pid : 'no-pid', 'module.id=', module && module.id ? module.id : 'no-module-id');
        // Accept RPC that may pass params object as first argument (framework passes params and sessionID separately)
        // If the first argument looks like a payload object, unpack it.
        if (datasetId && typeof datasetId === 'object' && (datasetId.datasetId !== undefined || datasetId.changes !== undefined)) {
            const payload = datasetId;
            datasetId = payload.datasetId;
            changes = payload.changes;
        }

        try {
            const dbg = memoryStore.debugKeysSync ? memoryStore.debugKeysSync('datasets') : { count: 0, keys: [] };
            console.log('[recordEditor] memoryStore datasets count=', dbg.count, 'keysSample=', dbg.keys);
        } catch (e) { console.log('[recordEditor] memoryStore inspect error', e); }
        console.log('[recordEditor] incoming datasetId=', datasetId);

        let dsObj = null;
        try {
            // Delegate dataset retrieval to dataApp helper (handles sync/async store backends)
            dsObj = await dataApp.getDataset(datasetId);
            console.log('[recordEditor] dataset present=', !!dsObj);
        } catch (e) { console.log('[recordEditor] dataset presence check error', e); }

        console.log('[recordEditor] changes payload keys=', changes && typeof changes === 'object' ? Object.keys(changes) : typeof changes);
        // For now, only log changes. In future this should validate and apply to stored dataset.
        if (!datasetId) {
            console.warn('[recordEditor] applyChanges: missing datasetId');
        } else if (!dsObj) {
            console.warn('[recordEditor] applyChanges: unknown datasetId', datasetId);
        }
        return { ok: true };
    } catch (e) {
        console.error('[recordEditor] applyChanges error:', e);
        return { ok: false, error: String(e) };
    }
}


// Export methods so framework's RPC (callServerMethod) can find them
// Export methods so framework's RPC (callServerMethod) can find them
// Core app methods are exported first; below we enhance exports with
// dynamic table helpers so TextBox.listSource preloads work.
const { registerDynamicTableMethods } = require('../../node_modules/my-old-space/drive_forms/dynamicTableRegistry');



// Регистрация стандартных методов для работы с таблицами (копия конфигурации из apps/organizations)
const dynamicTableMethods = registerDynamicTableMethods('recordEditor', {
    // Маппинг таблиц на модели
    tables: {
        'organizations': 'Organizations',
        'users': 'Users',
        'accommodation_types': 'AccommodationTypes'
    },
    // Конфигурация полей для каждой таблицы (в точности как в organizations)
    tableFields: {
        'organizations': [
            {
                name: 'id',
                caption: 'ID',
                type: 'INTEGER',
                inputType: 'number',
                width: 80,
                source: 'field', // берется из поля модели
                editable: false  // ID не редактируется
            },
            {
                name: 'name',
                caption: 'Название организации',
                type: 'STRING',
                inputType: 'textbox',
                width: 250,
                source: 'field',
                editable: true
            },
            {
                name: 'accommodationTypeId',
                caption: 'Тип размещения',
                type: 'INTEGER',
                inputType: 'recordSelector',
                width: 150,
                source: 'field',
                editable: false,  // FK пока не редактируем
                // Provide selection metadata so the table cell renders like a record selector
                properties: {
                    selection: { table: 'accommodation_types', idField: 'id', displayField: 'name' },
                    showSelectionButton: true,
                    // Enable lightweight list preload for dropdown (optional)
                    listMode: true,
                    listSource: {app: config.name, table: 'accommodation_types', idField: 'id', displayField: 'name', limit: 50 }
                }
            },
            {
                name: 'description',
                caption: 'Описание',
                type: 'STRING',
                inputType: 'textbox',
                width: 300,
                source: 'field',
                editable: true
            },
            {
                name: 'isActive',
                caption: 'Активна',
                type: 'BOOLEAN',
                inputType: 'checkbox',
                width: 100,
                source: 'field',
                editable: true
            },
            // Пример вычисляемого поля:
            {
                name: 'fullInfo',
                caption: 'Полная информация',
                type: 'STRING',
                inputType: 'textbox',
                width: 200,
                source: 'computed',
                compute: (row) => `${row.name} (${row.isActive ? 'активна' : 'неактивна'})`
            }
        ]
    },
    // Опциональная проверка доступа
    accessCheck: async (user, tableName, action) => {
        // Разрешаем доступ всем авторизованным пользователям (включая гостей)
        return true;
    }
});

module.exports = {
    getLayout,
    getData,
    getLayoutWithData,
    applyChanges,

    // Dynamic table helpers used by UI controls (preload/dropdowns etc.)
    getDynamicTableData: dynamicTableMethods.getDynamicTableData,
    subscribeToTable: dynamicTableMethods.subscribeToTable,
    saveClientState: dynamicTableMethods.saveClientState,
    recordTableEdit: dynamicTableMethods.recordTableEdit,
    commitTableEdits: dynamicTableMethods.commitTableEdits
};