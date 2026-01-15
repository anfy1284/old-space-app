const crypto = require('crypto');

// In-memory datasets store for atomic client sessions
// datasetId -> { payload: { layout, data }, created }
const _datasets = {};

function generateDatasetId() {
    return crypto.randomBytes(16).toString('hex') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
}

function storeDataset(payload) {
    const id = generateDatasetId();
    try {
        // store a deep copy to avoid accidental mutations
        _datasets[id] = { payload: JSON.parse(JSON.stringify(payload)), created: Date.now() };
    } catch (e) {
        // fallback to shallow copy if circular
        _datasets[id] = { payload: payload, created: Date.now() };
    }
    return id;
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
            valueType: 'SELECT',
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
                { name: 'Item 1', qty: 2, price: 9.99 },
                { name: 'Item 2', qty: 5, price: 4.5 }
            ]
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
                    type: 'header',
                    caption: 'Тестовая форма — сложный макет'
                },
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
                                { type: 'select', data: 'Test_Record_9', caption: 'Выбор опции' },
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
                                    columns: [
                                        { field: 'name', caption: 'Название' },
                                        { field: 'qty', caption: 'Кол-во' },
                                        { field: 'price', caption: 'Цена' }
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
                        { type: 'textbox', data: 'TP_readonly', caption: 'Read only', properties: { readOnly: true } }
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

function applyChanges(datasetId, changes) {
    try {
        console.log('[recordEditor] applyChanges called. datasetId=', datasetId, 'changes=', JSON.stringify(changes));
        // For now, only log changes. In future this should validate and apply to stored dataset.
        if (!datasetId) {
            console.warn('[recordEditor] applyChanges: missing datasetId');
        } else if (!_datasets[datasetId]) {
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
const { registerDynamicTableMethods } = require('../../node_modules/my-old-space/drive_root/dynamicTableRegistry');

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