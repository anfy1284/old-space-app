const { registerDynamicTableMethods } = require('../../node_modules/my-old-space/drive_forms/dynamicTableRegistry');

// Регистрация стандартных методов для работы с таблицами
const dynamicTableMethods = registerDynamicTableMethods('organizations', {
    // Маппинг таблиц на модели
    tables: {
        'organizations': 'Organizations',
        'users': 'Users',
        'accommodation_types': 'AccommodationTypes'
    },
    // Конфигурация полей для каждой таблицы
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
                    listSource: { app: 'organizations', table: 'accommodation_types', idField: 'id', displayField: 'name', limit: 50 }
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
            }
            // Пример вычисляемого поля:
            ,{
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

// Экспортируем стандартные методы
module.exports = {
    getDynamicTableData: dynamicTableMethods.getDynamicTableData,
    subscribeToTable: dynamicTableMethods.subscribeToTable,
    saveClientState: dynamicTableMethods.saveClientState,
    recordTableEdit: dynamicTableMethods.recordTableEdit,
    commitTableEdits: dynamicTableMethods.commitTableEdits
};

// Дополнительные специфичные для приложения методы можно добавлять ниже
// Например:
// module.exports.createOrganization = async function(params, sessionID) { ... };
// module.exports.deleteOrganization = async function(params, sessionID) { ... };
