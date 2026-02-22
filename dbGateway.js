/**
 * dbGateway middleware уровня текущего проекта (app level).
 * 
 * Регистрирует middleware на уровне 'app' — самый верхний уровень.
 * Запрос сначала проходит через этот middleware, затем forms, затем root, затем executor.
 *
 * Здесь можно реализовать:
 *   - бизнес-правила конкретного проекта
 *   - ограничения доступа к определённым таблицам
 *   - логирование / аудит на уровне приложения
 */

const dbGateway = require('./node_modules/my-old-space/drive_root/dbGateway');

// Пустой middleware — пропускает всё дальше без изменений.
// Заглушка для будущей бизнес-логики проекта.
dbGateway.use('app', async function projectAppMiddleware(request, next) {
    // TODO: проверки на уровне проекта (бизнес-правила, ограничения таблиц, аудит)
    return await next(request);
});

console.log('[project/dbGateway] App-level middleware registered');

module.exports = dbGateway;
