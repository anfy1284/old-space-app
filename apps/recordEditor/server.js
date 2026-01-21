const crypto = require('crypto');

// Use the generic framework memory store (namespace: 'datasets')
const memoryStore = require('../../node_modules/my-old-space/drive_root/memory_store');
const { read } = require('fs');
try { const dbg = memoryStore.debugKeysSync('datasets'); console.log('[recordEditor] memoryStore init; datasetsCount=', dbg.count); } catch (e) {}

function storeDataset(payload) {
    // Synchronous store into in-memory cache for immediate use by callers.
    // Also attempt async persistence via memoryStore.set for Redis if available.
    try {
        const id = crypto.randomBytes(12).toString('hex') + '-' + Date.now().toString(36);
        try {
            // ensure namespace map exists
            if (!memoryStore._MEM.has('datasets')) memoryStore._MEM.set('datasets', new Map());
            // store in same shape as memory_store: { value: <payload>, created, modified }
            memoryStore._MEM.get('datasets').set(id, { value: JSON.parse(JSON.stringify(payload)), created: Date.now(), modified: Date.now() });
        } catch (err) {
            if (!memoryStore._MEM.has('datasets')) memoryStore._MEM.set('datasets', new Map());
            memoryStore._MEM.get('datasets').set(id, { value: payload, created: Date.now(), modified: Date.now() });
        }
        // fire-and-forget async persist to Redis (if memoryStore is configured with Redis)
        if (memoryStore.set) {
            try { memoryStore.set('datasets', id, payload).catch(() => {}); } catch (_) {}
        }
        return id;
    } catch (e) {
        try { console.error('[recordEditor] storeDataset error', e); } catch (_) {}
        return null;
    }
}

function getData() {
    let data = [
        {
            name: 'Test_Record_1',
            caption: 'Поле 1',
            valueType: 'STRING',
            editable: true,
            value: 'Значение 1'
        },
        {
            name: 'Test_Record_2',
            caption: 'Поле 2',
            valueType: 'INTEGER',
            editable: true,
            value: 42
        },
        {
            name: 'Test_Record_3',
            caption: 'Поле 3',
            valueType: 'DATE',
            editable: false,
            value: '2024-06-15'
        },
        {
            name: 'Test_Record_4',
            caption: 'Поле 4',
            valueType: 'BOOLEAN',
            editable: true,
            value: true
        },
        {
            name: 'Test_Record_5',
            caption: 'Поле 5',
            valueType: 'STRING',
            editable: true,
            value: 'Дополнительный текст'
        },
        {
            name: 'Test_Record_6',
            caption: 'Поле 6',
            valueType: 'INTEGER',
            editable: true,
            value: 7
        },
        {
            name: 'Test_Record_7',
            caption: 'Поле 7',
            valueType: 'DATE',
            editable: true,
            value: '2025-01-01'
        },
        {
            name: 'Test_Record_8',
            caption: 'Поле 8',
            valueType: 'BOOLEAN',
            editable: true,
            value: false
        },
        {
            name: 'Test_Record_9',
            caption: 'Поле 9 (выбор)',
            valueType: 'STRING',
            editable: true,
            value: 'opt2',
            options: [
                { value: 'opt1', caption: 'Опция 1' },
                { value: 'opt2', caption: 'Опция 2' },
                { value: 'opt3', caption: 'Опция 3' }
            ]
        },
        {
            name: 'Test_Record_10',
            caption: 'Поле 10 (многострочный)',
            valueType: 'TEXTAREA',
            editable: true,
            value: 'Строка 1\nСтрока 2\nСтрока 3'
        },
        {
            name: 'Test_List',
            caption: 'Список элементов',
            valueType: 'LIST',
            editable: true,
            value: [
                { name: 'Item 1', qty: 2, price: 9.99, checked: true },
                { name: 'Item 2', qty: 5, price: 4.5, checked: false },
                { name: 'Item 3', qty: 1, price: 19.5, checked: false },
                { name: 'Item 4', qty: 10, price: 1.25, checked: true },
                { name: 'Item 5', qty: 0, price: 0.0, checked: false },
                { name: 'Item 6', qty: 3, price: 7.75, checked: false },
                { name: 'Item 7', qty: 8, price: 2.5, checked: true },
                { name: 'Item 8', qty: 12, price: 0.99, checked: false },
                { name: 'Item 9', qty: 4, price: 15.0, checked: false },
                { name: 'Item 10', qty: 6, price: 3.33, checked: false, category: 'opt1' },
                { name: 'Item 11', qty: 2, price: 29.99, checked: true, category: 'opt2' },
                { name: 'Item 12', qty: 7, price: 6.0, checked: false, category: 'opt3' },
                { name: 'Item 13', qty: 15, price: 0.45, checked: false, category: 'opt1' },
                { name: 'Item 14', qty: 9, price: 4.75, checked: false, category: 'opt2' },
                { name: 'Item 15', qty: 11, price: 8.8, checked: true, category: 'opt3' },
                { name: 'Item 16', qty: 14, price: 2.2, checked: false, category: 'opt1' },
                { name: 'Item 17', qty: 5, price: 12.0, checked: false, category: 'opt2' },
                { name: 'Item 18', qty: 20, price: 0.5, checked: false, category: 'opt3' },
                { name: 'Item 19', qty: 13, price: 9.9, checked: false, category: 'opt1' },
                { name: 'Item 20', qty: 17, price: 1.1, checked: true, category: 'opt2' },
                { name: 'Item 21', qty: 21, price: 0.75, checked: false, category: 'opt3' },
                { name: 'Item 22', qty: 25, price: 0.6, checked: false, category: 'opt1' },
            ]
        }
        ,
        {
            name: 'Meta_Owner',
            caption: 'Владелец',
            valueType: 'STRING',
            editable: true,
            value: ' '
        },
        {
            name: 'Meta_Tag',
            caption: 'Тег',
            valueType: 'STRING',
            editable: true,
            value: ''
        }
        ,
        // Test permutation fields for UI testing
        {
            name: 'TP_default',
            caption: 'TP Default',
            valueType: 'STRING',
            editable: true,
            value: 'Default text'
        },
        {
            name: 'TP_password',
            caption: 'TP Password',
            valueType: 'STRING',
            editable: true,
            value: 'secret123'
        },
        {
            name: 'TP_digits_default',
            caption: 'TP Digits Default',
            valueType: 'NUMBER',
            editable: true,
            value: 123.45
        },
        {
            name: 'TP_digits_noFloat',
            caption: 'TP Digits No Float',
            valueType: 'NUMBER',
            editable: true,
            value: 123
        },
        {
            name: 'TP_digits_noNeg',
            caption: 'TP Digits No Negative',
            valueType: 'NUMBER',
            editable: true,
            value: 456
        },
        {
            name: 'TP_digits_noFloat_noNeg',
            caption: 'TP Digits No Float No Neg',
            valueType: 'NUMBER',
            editable: true,
            value: 789
        },
        {
            name: 'TP_digits_dp2',
            caption: 'TP Digits 2dp',
            valueType: 'NUMBER',
            editable: true,
            value: 12.34
        },
        {
            name: 'TP_digits_dp2_max5',
            caption: 'TP Digits 2dp max5',
            valueType: 'NUMBER',
            editable: true,
            value: 123.45
        },
        {
            name: 'TP_digits_max0',
            caption: 'TP Digits max0 unlimited',
            valueType: 'NUMBER',
            editable: true,
            value: 1234567890
        },
        {
            name: 'TP_digits_dpUnlimited',
            caption: 'TP Digits dp unlimited',
            valueType: 'NUMBER',
            editable: true,
            value: 3.1415926535
        },
        {
            name: 'TP_with_placeholder',
            caption: 'TP With Placeholder',
            valueType: 'STRING',
            editable: true,
            value: ''
        },
        {
            name: 'TP_readonly',
            caption: 'TP Read Only',
            valueType: 'STRING',
            editable: false,
            value: 'Read only value'
        }
    ];
    // Test field for selection button
    data.push({
        name: 'TP_selector_test',
        caption: 'Selector Test',
        valueType: 'STRING',
        editable: true,
        value: ''
    });
    return data;
}

function getLayout() {
    let layout = [
        {
            type: 'group',
            caption: 'Main Form',
            orientation: 'vertical',
            layout: [
                {
                    type: 'group',
                    caption: 'Двухколоночная часть',
                    orientation: 'horizontal',
                    layout: [
                        {
                            type: 'group',
                            caption: 'Левая колонка',
                            orientation: 'vertical',
                            layout: [
                                { type: 'textbox', data: 'Test_Record_1', caption: 'Редактируемое поле 1' },
                                { type: 'textbox', data: 'Test_Record_5', caption: 'Доп. текст' },
                                { type: 'textarea', data: 'Test_Record_10', caption: 'Многострочное описание' }
                            ]
                        },
                        {
                            type: 'group',
                            caption: 'Правая колонка',
                            orientation: 'vertical',
                            layout: [
                                { type: 'number', data: 'Test_Record_2', caption: 'Числовое поле' },
                                { type: 'emunList', data: 'Test_Record_9', caption: 'Выбор опции' },
                                { type: 'checkbox', data: 'Test_Record_8', caption: 'Флаг включен', properties: {captionOnRight: true } }
                            ]
                        }
                    ]
                },
                {
                    type: 'tabs',
                    caption: 'Дополнительно',
                    tabs: [
                        {
                            id: 'tab1',
                            caption: 'Адрес и дата',
                            layout: [
                                {
                                    type: 'group',
                                    caption: 'Адрес',
                                    orientation: 'vertical',
                                    layout: [
                                        { type: 'textbox', data: 'Address_Street', caption: 'Улица' },
                                        { type: 'textbox', data: 'Address_City', caption: 'Город' }
                                    ]
                                },
                                { type: 'date', data: 'Test_Record_7', caption: 'Дата события' }
                            ]
                        },
                        {
                            id: 'tab2',
                            caption: 'Список',
                            layout: [
                                {
                                    type: 'repeater',
                                    data: 'Test_List',
                                    caption: 'Элементы списка',
                                    itemLayout: [
                                        { type: 'textbox', data: 'name', caption: 'Название' },
                                        { type: 'number', data: 'qty', caption: 'Количество' },
                                        { type: 'number', data: 'price', caption: 'Цена' }
                                    ]
                                },
                                {
                                    type: 'table',
                                    data: 'Test_List',
                                    caption: 'Таблица элементов',
                                    properties: {visibleRows: 6},
                                    columns: [
                                        { type: 'checkbox', data: 'checked', caption: 'Чекнуто' },
                                        { type: 'textbox', data: 'name', caption: 'Название'},
                                        { type: 'emunList', data: 'category', caption: 'Категория', options: [ { value: 'opt1', caption: 'Опция 1' }, { value: 'opt2', caption: 'Опция 2' }, { value: 'opt3', caption: 'Опция 3' } ] , properties: { } },
                                        { type: 'number', data: 'qty', caption: 'Количество', readOnly: false, properties: { readOnly: true } },
                                        { type: 'number', data: 'price', caption: 'Цена'}
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'group',
                    caption: 'Блок метаданных',
                    orientation: 'horizontal',
                    layout: [
                        { type: 'textbox', data: 'Meta_Owner', caption: 'Владелец' },
                        { type: 'textbox', data: 'Meta_Tag', caption: 'Тег' },
                        { type: 'checkbox', data: 'Test_Record_4', caption: 'Флаг 4 (повторно)' }
                    ]
                },
                {
                    type: 'group',
                    caption: 'Textbox permutations',
                    orientation: 'vertical',
                    layout: [
                        { type: 'textbox', data: 'TP_default', caption: 'Default textbox', properties: {} },
                        { type: 'textbox', data: 'TP_password', caption: 'Password textbox', properties: { isPassword: true } },
                        { type: 'number', data: 'TP_digits_default', caption: 'Digits only (default float/neg allowed)', properties: {} },
                        { type: 'number', data: 'TP_digits_noFloat', caption: 'Digits only (no float)', properties: { allowFloat: false } },
                        { type: 'number', data: 'TP_digits_noNeg', caption: 'Digits only (no negative)', properties: { allowNegative: false } },
                        { type: 'number', data: 'TP_digits_noFloat_noNeg', caption: 'Digits only (no float, no negative)', properties: { allowFloat: false, allowNegative: false } },
                        { type: 'number', data: 'TP_digits_dp2', caption: 'Digits only (2 decimal places)', properties: { decimalPlaces: 2 } },
                        { type: 'number', data: 'TP_digits_dp2_max5', caption: 'Digits only (2 dp, max 5 digits)', properties: { decimalPlaces: 2, maxLength: 5 } },
                        { type: 'number', data: 'TP_digits_max0', caption: 'Digits only (maxLength=0 unlimited)', properties: { maxLength: 0 } },
                        { type: 'number', data: 'TP_digits_dpUnlimited', caption: 'Digits only (float unlimited dp)', properties: { decimalPlaces: 0 } },
                        { type: 'textbox', data: 'TP_with_placeholder', caption: 'With placeholder', properties: { placeholder: 'Введите...' } },
                        { type: 'textbox', data: 'TP_readonly', caption: 'Read only', properties: { readOnly: true } },
                        { type: 'textbox', data: 'TP_selector_test', caption: 'Selector test', properties: { showSelectionButton: true }}
                    ]
                },
                {
                    type: 'group',
                    caption: 'Кнопки действий',
                    orientation: 'horizontal',
                    layout: [
                        { type: 'button', action: 'save', caption: 'Сохранить' },
                        { type: 'button', action: 'cancel', caption: 'Отмена' }
                    ]
                }
            ]
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
        const datasetId = storeDataset(payload);
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
            // Try synchronous local check first
            if (memoryStore.getSync && memoryStore.getSync('datasets', datasetId) !== null) {
                dsObj = memoryStore.getSync('datasets', datasetId);
            } else {
                // Fallback to async get which may consult the local service
                dsObj = await memoryStore.get('datasets', datasetId);
            }
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
module.exports = {
    getLayout,
    getData,
    getLayoutWithData,
    applyChanges
};





/*
const { registerDynamicTableMethods } = require('../../node_modules/my-old-space/drive_forms/dynamicTableRegistry');

// Регистрация стандартных методов для работы с таблицами
const dynamicTableMethods = registerDynamicTableMethods('myNewApp', {
    // Маппинг таблиц на модели
    tables: {
        // Пример: 'table_name': 'ModelName'
    },
    // Конфигурация полей для каждой таблицы
    tableFields: {
        // Пример конфигурации таблицы:
        // 'table_name': [
        //     {
        //         name: 'id',
        //         caption: 'ID',
        //         type: 'INTEGER',
        //         width: 80,
        //         source: 'field',
        //         editable: false
        //     }
        // ]
    }
});

// Экспортируем методы для использования в приложении
module.exports = {
    ...dynamicTableMethods,
    
    // Дополнительные кастомные методы можно добавить здесь
};
*/