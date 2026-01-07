const { registerDynamicTableMethods } = require('../../node_modules/my-old-space/drive_root/dynamicTableRegistry');

// Регистрация стандартных методов для работы с таблицами
const dynamicTableMethods = registerDynamicTableMethods('organizations', {
    // Маппинг таблиц на модели
    tables: {
        'organizations': 'Organizations',
        'users': 'Users'
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
    saveClientState: dynamicTableMethods.saveClientState
};

// Дополнительные специфичные для приложения методы можно добавлять ниже
// Например:
// module.exports.createOrganization = async function(params, sessionID) { ... };
// module.exports.deleteOrganization = async function(params, sessionID) { ... };
