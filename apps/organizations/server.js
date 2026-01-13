const { registerDynamicTableMethods } = require('../../node_modules/my-old-space/drive_root/dynamicTableRegistry');

// Регистрация стандартных методов для работы с таблицами
const dynamicTableMethods = registerDynamicTableMethods('organizations', {
    // Маппинг таблиц на модели
    tables: {
        'organizations': 'Organizations',
        'users': 'Users'
    },
    // Конфигурация полей для каждой таблицы
    tableFields: {
        'organizations': [
            {
                name: 'id',
                caption: 'ID',
                type: 'INTEGER',
                width: 80,
                source: 'field', // берется из поля модели
                editable: false  // ID не редактируется
            },
            {
                name: 'name',
                caption: 'Название организации',
                type: 'STRING',
                width: 250,
                source: 'field',
                editable: true
            },
            {
                name: 'accommodationTypeId',
                caption: 'Тип размещения',
                type: 'INTEGER',
                width: 150,
                source: 'field',
                editable: false  // FK пока не редактируем
            },
            {
                name: 'description',
                caption: 'Описание',
                type: 'STRING',
                width: 300,
                source: 'field',
                editable: true
            },
            {
                name: 'isActive',
                caption: 'Активна',
                type: 'BOOLEAN',
                width: 100,
                source: 'field',
                editable: true
            }
            // Пример вычисляемого поля:
            ,{
                name: 'fullInfo',
                caption: 'Полная информация',
                type: 'STRING',
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
