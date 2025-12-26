# Техническое Задание: UI Компонент "Динамический Список" (Dynamic Table)

## 1. Общее Описание

Создать UI класс `DynamicTable` для отображения табличных данных в стиле Windows 95/98 с поддержкой:
- Виртуального скроллинга (серверная пагинация)
- Изменения ширины колонок пользователем
- Клавиатурной навигации
- Фильтрации и сортировки
- Отображения связанных данных (foreign keys)

## 2. Архитектура и Обмен Данными

### 2.0. Протокол Обмена (HTTP + JSON)

**Транспортный протокол**: HTTP/HTTPS  
**Формат данных**: JSON  
**Метод**: POST

#### Клиентская Функция
```javascript
function callServerMethod(app, method, params = {}) {
  return fetch('/app/call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app, method, params })
  })
    .then(r => r.json())
    .then(data => {
      if ('error' in data) throw new Error(data.error);
      return data.result;
    });
}
```

#### HTTP Запрос
```http
POST /app/call HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Cookie: sessionID=abc123...

{
  "app": "organizations",
  "method": "getDynamicTableData",
  "params": {
    "tableName": "organizations",
    "firstRow": 0,
    "visibleRows": 20
  }
}
```

#### HTTP Ответ (Success)
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "result": {
    "totalRows": 1000,
    "fields": [...],
    "data": [...]
  }
}
```

#### HTTP Ответ (Error)
```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "error": "Table not found"
}
```

#### Серверная Обработка

**Роутинг** (`drive_forms/server.js`, строка 283):
1. Запрос приходит на `/app/call`
2. Парсится JSON body: `{ app, method, params }`
3. Извлекается `sessionID` из cookie
4. Вызывается `invokeAppMethod(app, method, params, sessionID, callback)`

**Вызов метода приложения** (`drive_forms/server.js`, строка 75):
1. Находится файл `apps/{appName}/server.js`
2. Загружается модуль (с очисткой кэша для hot-reload)
3. Вызывается функция `appModule[methodName](params, sessionID, req, res)`
4. Поддержка sync и async функций (Promise)
5. Результат оборачивается в `{ result: ... }` или `{ error: ... }`

**Аутентификация**: 
- SessionID передаётся через HTTP cookie
- Серверная функция получает sessionID как параметр
- Можно получить user объект: `await globalRoot.getUserBySessionID(sessionID)`


### 2.0.1. Real-Time Обновления (SSE - Server-Sent Events)

**Назначение**: Автоматическое обновление данных таблицы при изменениях на сервере (вставка, обновление, удаление записей).

#### Подписка на Обновления (Клиент)

```javascript
// После инициализации таблицы подписываемся на события
const url = `/app/organizations/subscribeToTable?tableName=organizations`;
this.eventSource = new EventSource(url);

this.eventSource.onopen = () => {
  console.log('[DynamicTable] SSE connected');
};

this.eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'connected') {
    console.log('[DynamicTable] SSE: connection confirmed');
  } else if (data.type === 'dataChanged') {
    // Данные изменились - обновить таблицу
    console.log('[DynamicTable] Data changed:', data.action);
    this.refresh(); // Перезагрузить данные
  } else if (data.type === 'rowUpdate') {
    // Обновление конкретной строки
    this.updateRow(data.rowId, data.rowData);
  }
};

this.eventSource.onerror = (error) => {
  console.error('[DynamicTable] SSE error:', error);
};
```

#### HTTP Запрос SSE (GET)
```http
GET /app/organizations/subscribeToTable?tableName=organizations HTTP/1.1
Host: localhost:3000
Cookie: sessionID=abc123...
Accept: text/event-stream
```

#### HTTP Ответ SSE
```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"type":"connected","message":"Subscribed to table updates"}

data: {"type":"dataChanged","action":"insert","tableName":"organizations"}

data: {"type":"dataChanged","action":"update","tableName":"organizations"}

data: {"type":"rowUpdate","rowId":123,"rowData":{...}}
```

#### Роутинг SSE Запросов

**Механизм**: SSE использует существующий роутинг GET запросов в `drive_forms/server.js`.

**Путь запроса**: 
```
Клиент → GET /app/organizations/subscribeToTable?tableName=organizations
       ↓
drive_forms/server.js (строки 111-156)
       ↓
invokeAppMethod('organizations', 'subscribeToTable', params, sessionID, callback, req, res)
       ↓
apps/organizations/server.js → subscribeToTable(params, sessionID, req, res)
```

**Обработчик в drive_forms/server.js**:
```javascript
if (req.method === 'GET' && req.url.startsWith(`/${appAlias}/`)) {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = urlObj.pathname.split('/').filter(Boolean);
  
  // Format: /app/{appName}/{methodName}?params
  // Example: /app/organizations/subscribeToTable?tableName=organizations
  if (pathParts.length >= 3 && pathParts[0] === appAlias) {
    const appName = pathParts[1];       // 'organizations'
    const methodName = pathParts[2];    // 'subscribeToTable'
    
    // Extract params from query string
    const params = {};
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;  // { tableName: 'organizations' }
    });
    
    // Extract sessionID from cookie
    let sessionID = null;
    if (req.headers && req.headers.cookie) {
      const match = req.headers.cookie.match(/(?:^|; )sessionID=([^;]+)/);
      if (match) sessionID = decodeURIComponent(match[1]);
    }
    
    // Вызвать метод приложения
    invokeAppMethod(appName, methodName, params, sessionID, (err, result) => {
      if (result && (result._sse || result._handled)) {
        // SSE connection handled, don't close
        return;
      }
      // ... обычный JSON ответ если не SSE
    }, req, res);
  }
}
```

#### Серверная Реализация SSE

**Обработчик GET запроса** (`apps/organizations/server.js`):
```javascript
function subscribeToTable(params, sessionID, req, res) {
  const { tableName } = params;
  
  // ВАЖНО: Функция вызывается синхронно из invokeAppMethod
  // Async работа делается внутри IIFE:
  
  (async () => {
    try {
      // Получить пользователя
      const user = await global.getUserBySessionID(sessionID);
      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not authorized' }));
        return;
      }
      
      // Проверка прав доступа к таблице
      // ...
      
      // Настройка SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      // Отправить подтверждение подключения
      res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Subscribed to table updates' })}\n\n`);
      
      // Сохранить connection для отправки обновлений
      const clientId = subscribeClient(tableName, user, res);
      console.log(`[organizations] SSE: user ${user.name} subscribed to ${tableName} (client: ${clientId})`);
      
      // Обработка закрытия соединения
      req.on('close', () => {
        const clients = sseClients.get(tableName);
        if (clients) {
          // Удалить клиента по clientId
          for (const client of clients) {
            if (client.clientId === clientId) {
              clients.delete(client);
              break;
            }
          }
          if (clients.size === 0) {
            sseClients.delete(tableName);
          }
        }
        console.log(`[organizations] SSE: user ${user.name} disconnected from ${tableName}`);
      });
    } catch (e) {
      console.error('[organizations] subscribeToTable error:', e.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Subscription error: ' + e.message }));
    }
  })();
  
  // Вернуть сразу специальный объект чтобы не закрыть соединение
  return { _handled: true };
}
```

**Отправка обновлений при изменении данных**:
```javascript
// После insert/update/delete в БД:
function notifyTableChange(tableName, action, rowId = null, rowData = null) {
  const clients = getSubscribedClients(tableName);
  
  const message = {
    type: 'dataChanged',
    action: action, // 'insert', 'update', 'delete'
    tableName: tableName
  };
  
  if (rowId && rowData) {
    message.type = 'rowUpdate';
    message.rowId = rowId;
    message.rowData = rowData;
  }
  
  clients.forEach(clientRes => {
    clientRes.write(`data: ${JSON.stringify(message)}\n\n`);
  });
}
```

**Управление подписками** (в `apps/organizations/server.js`):
```javascript
const global = require('../../drive_root/globalServerContext');

// Хранилище SSE клиентов (через global для сохранения при hot-reload)
if (!global.organizationsSseClients) {
  global.organizationsSseClients = new Map(); // tableName -> Set of {res, userId, clientId}
}
const sseClients = global.organizationsSseClients;

function subscribeClient(tableName, user, res) {
  if (!sseClients.has(tableName)) {
    sseClients.set(tableName, new Set());
  }
  const clientId = Math.random().toString(36).substr(2, 9);
  const client = { res, userId: user.id, clientId };
  sseClients.get(tableName).add(client);
  return clientId;
}

function getSubscribedClients(tableName) {
  const clients = sseClients.get(tableName);
  if (!clients) return [];
  return Array.from(clients).map(c => c.res);
}
```

**Важно**: 
- SSE подписки хранятся **локально** в каждом `apps/*/server.js`
- При перезапуске сервера подписки потеряются, клиент автоматически переподключится
- SSE используется только для уведомлений об изменениях. Сами данные загружаются через POST `/app/call`.

### 2.1. Клиент → Сервер

**Технология**: Использовать механизм `callServerMethod(app, method, params)` как в приложении messenger.

**Запросы**:

#### Инициализация таблицы
```javascript
callServerMethod('organizations', 'initDynamicTable', {
  tableName: 'organizations',  // логическое имя таблицы
  firstRow: 0,
  visibleRows: 20
})
```

#### Обновление при скролле/resize
```javascript
callServerMethod('organizations', 'getDynamicTableData', {
  tableName: 'organizations',
  firstRow: 50,                // номер первой видимой строки
  visibleRows: 20,             // количество видимых строк
  sort: [                      // массив сортировок
    { field: 'name', order: 'asc' },
    { field: 'id', order: 'desc' }
  ],
  filters: [                   // массив фильтров
    { field: 'name', operator: 'contains', value: 'test' },
    { field: 'isActive', operator: '=', value: true }
  ]
})
```

**Операторы фильтрации**:
- `=` - равно
- `!=` - не равно
- `>` - больше
- `<` - меньше
- `>=` - больше или равно
- `<=` - меньше или равно
- `contains` - содержит (для строк)
- `startsWith` - начинается с (для строк)
- `endsWith` - заканчивается на (для строк)

### 2.2. Сервер → Клиент

**Формат ответа**:
```javascript
{
  totalRows: 1000,              // общее количество строк в таблице
  fields: [                     // описание полей
    {
      name: 'id',               // имя поля в БД
      caption: 'ID',            // отображаемое название (из db.json)
      type: 'INTEGER',          // тип данных
      width: 80,                // рекомендуемая ширина колонки (px)
      foreignKey: null,         // null или объект с foreign key
      editable: false           // редактируемое ли поле (пока всегда false)
    },
    {
      name: 'name',
      caption: 'Название',
      type: 'STRING',
      width: 200,
      foreignKey: null
    },
    {
      name: 'organizationId',
      caption: 'Организация',
      type: 'INTEGER',
      width: 150,
      foreignKey: {             // информация о связи
        table: 'organizations', // связанная таблица
        field: 'id',            // поле в связанной таблице
        displayField: 'name'    // поле для отображения
      }
    }
  ],
  data: [                       // данные указанного диапазона
    {
      id: 1,
      name: 'ООО "Компания"',
      organizationId: 5,
      __organizationId_display: 'Главная организация'  // для foreign keys
    },
    // ... остальные строки
  ],
  range: {                      // информация о диапазоне
    from: 50,
    to: 79
  }
}
```

**Примечание**: Для полей с foreign key сервер должен возвращать дополнительное поле `__<fieldName>_display` с отображаемым значением из связанной таблицы.

### 2.2.1. Метаданные Полей (Captions)

**Источник**: Поле `caption` в `db.json` файле приложения.

**Формат в db.json**:
```json
{
  "models": [
    {
      "name": "Organizations",
      "tableName": "organizations",
      "fields": {
        "id": {
          "type": "INTEGER",
          "primaryKey": true,
          "autoIncrement": true,
          "caption": "ID"
        },
        "name": {
          "type": "STRING",
          "allowNull": false,
          "caption": "Название организации"
        },
        "isActive": {
          "type": "BOOLEAN",
          "defaultValue": true,
          "caption": "Активна"
        }
      }
    }
  ]
}
```

### 2.2.2. Форматирование Типов Данных

**Таблица соответствий типов → UI классы:**

| Тип данных | UI Класс | Отображение (readonly) | Редактирование | Пустое значение |
|------------|----------|------------------------|----------------|----------------|
| `STRING` | `TextBox` | `"ООО Компания"` | Input текст | `""` |
| `INTEGER` | `TextBox` | `"123"` | Input number | `""` |
| `DECIMAL`/`FLOAT` | `TextBox` | `"123.45"` (2 знака) | Input number | `""` |
| `BOOLEAN` | `CheckBox` | ☑ / ☐ | Checkbox | `☐` (unchecked) |
| `DATE` | `DatePicker` | `"26.12.2025"` | Input + календарь | `""` |
| `TIMESTAMP` | `DatePicker` | `"26.12.2025 20:54"` | Input + календарь + время | `""` |
| `NULL` значения | - | `""` (пустая строка) | - | - |
| Foreign Key | `TextBox` | Display value из связанной таблицы | ComboBox (будущее) | `""` |

**Важно**: 
- Таблица **НЕ редактируемая** (по умолчанию)
- Свойство `editable: false` в конфигурации `DynamicTable`
- Использовать UI классы для отрисовки ячеек в readonly режиме
- NULL значения отображаются как пустая строка `""`

### 2.3. Серверная Архитектура

#### Уровень 1: Серверная функция приложения
**Файл**: `apps/organizations/server.js`

**Задачи**:
- Проверка прав доступа пользователя
- Маппинг логических имён таблиц на реальные (безопасность)
- Валидация параметров от клиента
- Вызов глобальных функций

**Пример**:
```javascript
async function initDynamicTable(user, params) {
  const { tableName, firstRow, visibleRows } = params;
  
  // Маппинг логических имён (безопасность)
  const tableMapping = {
    'organizations': 'Organizations',  // имя модели Sequelize
    'users': 'Users'
  };
  
  const modelName = tableMapping[tableName];
  if (!modelName) {
    throw new Error('Unknown table');
  }
  
  // Вызов глобальной функции
  return await global.getDynamicTableData({
    modelName,
    firstRow,
    visibleRows,
    sort: params.sort || [],
    filters: params.filters || []
  });
}
```

#### Уровень 2: Глобальные серверные функции
**Файл**: `node_modules/my-old-space/drive_forms/globalServerContext.js`

**Новые функции**:

##### `getDynamicTableData(options)`
```javascript
const global = require('../../drive_root/globalServerContext');
const { modelsDB } = global;

async function getDynamicTableData(options) {
  const { modelName, firstRow, visibleRows, sort, filters } = options;
  
  // 1. Получить модель Sequelize из глобального реестра
  const Model = modelsDB[modelName];
  if (!Model) {
    throw new Error(`Model ${modelName} not found in modelsDB`);
  }
  
  // 2. Построить запрос с учётом фильтров и сортировки
  // 3. Получить общее количество строк
  // 4. Получить данные диапазона (с буфером ±10 строк)
  // 5. Разрешить foreign keys (получить displayField из связанных таблиц через JOIN)
  // 6. Вернуть результат в формате выше
}
```

**Примечание**: Глобальный реестр моделей `modelsDB` уже существует в `drive_root/globalServerContext.js` и автоматически собирает модели из всех приложений.

##### `getTableMetadata(modelName)`
```javascript
async function getTableMetadata(modelName) {
  // Возвращает информацию о полях модели:
  // - name, type, caption (из комментариев или имени)
  // - foreignKey информацию из ассоциаций Sequelize
}
```

##### `saveClientState(user, stateData)`
```javascript
async function saveClientState(user, stateData) {
  // БОЛВАНКА для будущей системы хранения состояний клиента
  // Формат stateData:
  // {
  //   window: 'organizationsForm',
  //   component: 'organizationsList',
  //   data: {
  //     columns: [
  //       { name: 'id', width: 100 },
  //       { name: 'name', width: 250 }
  //     ],
  //     scrollPosition: 150
  //   }
  // }
  console.log('[saveClientState] Saving state:', stateData);
  // TODO: Реализовать сохранение в БД позже
}
```

### 2.4. Буферизация при Скроллинге

**Логика**:
- Клиент запрашивает диапазон: `firstRow=100, visibleRows=20` (строки 100-119)
- Сервер отдаёт расширенный диапазон: строки 90-139 (буфер ±10 строк в каждую сторону)
- Клиент хранит все полученные строки
- При небольшом скролле запрос не отправляется (используются кэшированные данные)
- При выходе за границы буфера - **новый запрос отправляется сразу** (без throttle/debounce)

**Преимущества**:
- Плавный скроллинг без мерцания
- Меньше запросов к серверу
- Таблица может содержать миллионы записей
- Буферизация предотвращает избыточные запросы (throttle не нужен)

## 3. UI Компонент `DynamicTable`

### 3.1. Расположение
**Файл**: `node_modules/my-old-space/drive_forms/resources/public/UI_classes.js`

### 3.2. Инициализация

```javascript
const table = new DynamicTable({
  appName: 'organizations',        // имя приложения для callServerMethod
  tableName: 'organizations',      // логическое имя таблицы
  rowHeight: 25,                   // высота строки в пикселях
  multiSelect: false,              // множественное выделение с Shift
  initialSort: [                   // начальная сортировка
    { field: 'name', order: 'asc' }
  ],
  initialFilter: [],               // начальный фильтр
  onRowClick: function(row) { },   // одинарный клик
  onRowDoubleClick: function(row) { }, // двойной клик или Enter
  onSelectionChanged: function(selectedRows) { } // изменение выделения
});

table.Draw(parentElement);
```

### 3.3. Визуальный Стиль (Win95/98)

#### Общая таблица
- Рамка: `border: 2px outset #dfdfdf` (выпуклая рамка Win98)
- Фон всей таблицы: `#c0c0c0` (серый Win98)

#### Заголовки колонок
- Кнопки с объёмной рамкой: `border: 2px outset #dfdfdf`
- При клике (сортировка): `border: 2px inset #dfdfdf` (вдавленная)
- Курсор на границе колонки: `cursor: col-resize` для изменения ширины
- Фон: `#c0c0c0`
- Шрифт: жирный

#### Строки данных
- Фон чередующихся строк (zebra):
  - Чётные: `#ffffff` (белый)
  - Нечётные: `#f0f0f0` (светло-серый)
- Выделенная строка: `background: #000080; color: #ffffff` (синий Win98)
- Padding ячеек: `4px 8px`
- Border между ячейками: `1px solid #c0c0c0`

#### Индикатор загрузки
- При загрузке данных показывать overlay с текстом "Loading..."
- Полупрозрачный фон: `rgba(192, 192, 192, 0.7)`

### 3.4. Изменение Ширины Колонок

**Механизм**:
1. При наведении на границу между заголовками колонок - курсор меняется на `col-resize`
2. При зажатии мыши (mousedown) - начинается режим изменения размера
3. При движении мыши (mousemove) - колонка растягивается/сжимается
4. При отпускании (mouseup) - размер фиксируется
5. Новая ширина сохраняется через `callServerMethod('organizations', 'saveClientState', {...})`

### 3.5. Клавиатурная Навигация

**Требования**:
- Компонент должен получать фокус (при клике или программно)
- Навигация работает только когда компонент в фокусе

**Клавиши**:
- `↑` (ArrowUp) - выделить предыдущую строку
- `↓` (ArrowDown) - выделить следующую строку
- `PageUp` - на страницу вверх
- `PageDown` - на страницу вниз
- `Home` - в начало списка
- `End` - в конец списка
- `Enter` - вызвать событие `onRowDoubleClick` (выбор строки)
- `Shift + ↑/↓` - множественное выделение (если `multiSelect: true`)

**Автоскролл**:
- При навигации клавишами выделенная строка должна оставаться видимой
- Если выделенная строка уходит за границы - автоматический скролл

### 3.6. Выделение Строк

**Одиночное выделение** (`multiSelect: false`):
- Клик по строке - выделяет её, снимает выделение с предыдущей
- Клавиша вверх/вниз - перемещает выделение

**Множественное выделение** (`multiSelect: true`):
- `Shift + Click` - выделяет диапазон от последней выделенной до текущей
- `Shift + ↑/↓` - расширяет выделение
- `Ctrl` обычно не используется в Win98 стиле таблиц

### 3.7. События

#### `onRowClick(rowData, rowIndex)`
- Вызывается при одинарном клике на строку
- `rowData` - объект с данными строки
- `rowIndex` - глобальный индекс строки (0-based от начала всей таблицы)

#### `onRowDoubleClick(rowData, rowIndex)`
- Вызывается при двойном клике или нажатии `Enter`
- Обычно используется для открытия формы редактирования

#### `onSelectionChanged(selectedRows)`
- Вызывается при изменении набора выделенных строк
- `selectedRows` - массив объектов с данными выделенных строк

### 3.8. Виртуальный Скроллинг

**Реализация**:

1. **Контейнер с большой высотой**:
   ```javascript
   scrollContainer.style.height = `${totalRows * rowHeight}px`;
   ```
   Это создаёт правильный scrollbar для всей таблицы.

2. **Видимая область**:
   - Внутри контейнера - только видимые строки + буфер
   - Позиционирование через `position: absolute` и `top: ${firstVisibleRow * rowHeight}px`

3. **Обработка скролла**:
   ```javascript
   scrollContainer.addEventListener('scroll', (e) => {
     const scrollTop = e.target.scrollTop;
     const firstVisibleRow = Math.floor(scrollTop / rowHeight);
     
     // Если вышли за буфер - загрузить новые данные
     if (needsReload(firstVisibleRow)) {
       loadData(firstVisibleRow);
     } else {
       // Использовать кэш
       renderVisibleRows(firstVisibleRow);
     }
   });
   ```

4. **Индикатор загрузки**:
   - Показывать сразу при отправке запроса
   - Скрывать при получении данных

### 3.9. Методы класса

```javascript
class DynamicTable {
  constructor(options) { }
  
  Draw(parent) { }                    // Отрисовать компонент
  
  refresh() { }                       // Обновить данные (запрос к серверу)
  
  setSort(sortArray) { }              // Установить сортировку
  
  setFilter(filterArray) { }          // Установить фильтр
  
  getSelectedRows() { }               // Получить выделенные строки
  
  clearSelection() { }                // Снять выделение
  
  scrollToRow(rowIndex) { }           // Прокрутить к строке
  
  destroy() { }                       // Очистка (удаление listeners)
}
```

## 4. Тестовое Приложение

### 4.1. Приложение `organizations`

**Файлы**:
- `apps/organizations/server.js` - серверная логика
- `apps/organizations/resources/public/client.js` - клиентская часть
- `apps/organizations/config.json` - конфигурация
- `apps/organizations/db/db.json` - модели БД (уже существует)

### 4.2. Тестовая Таблица

**Модель**: `Organizations` (уже существует)

**Обновленный db.json с captions**:
```json
{
  "models": [
    {
      "name": "Organizations",
      "tableName": "organizations",
      "fields": {
        "id": {
          "type": "INTEGER",
          "primaryKey": true,
          "autoIncrement": true,
          "caption": "ID"
        },
        "name": {
          "type": "STRING",
          "allowNull": false,
          "caption": "Название организации"
        },
        "description": {
          "type": "STRING",
          "allowNull": true,
          "caption": "Описание"
        },
        "isActive": {
          "type": "BOOLEAN",
          "allowNull": false,
          "defaultValue": true,
          "caption": "Активна"
        }
      },
      "options": {
        "timestamps": true
      }
    },
    {
      "name": "Users",
      "tableName": "users",
      "fields": {
        "organizationId": {
          "type": "INTEGER",
          "allowNull": true,
          "references": {
            "model": "organizations",
            "key": "id"
          },
          "onUpdate": "CASCADE",
          "onDelete": "CASCADE",
          "caption": "Организация"
        }
      }
    }
  ],
  "associations": [
    {
      "type": "hasMany",
      "source": "Organizations",
      "target": "Users",
      "foreignKey": "organizationId"
    },
    {
      "type": "belongsTo",
      "source": "Users",
      "target": "Organizations",
      "foreignKey": "organizationId"
    }
  ]
}
```

**Поля**:
- `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT) - caption: "ID"
- `name` (STRING, NOT NULL) - caption: "Название организации"
- `description` (STRING, NULLABLE) - caption: "Описание"
- `isActive` (BOOLEAN, DEFAULT true) - caption: "Активна"
- `createdAt`, `updatedAt` (TIMESTAMP) - автоматические поля Sequelize

**Связи**:
- `hasMany` с таблицей `Users` через `organizationId`

### 4.3. Демо UI

```javascript
// apps/organizations/resources/public/client.js

const orgForm = new Form();
orgForm.setTitle('Organizations');
orgForm.setWidth(800);
orgForm.setHeight(600);

const table = new DynamicTable({
  appName: 'organizations',
  tableName: 'organizations',
  rowHeight: 25,
  multiSelect: true,
  onRowDoubleClick: function(row) {
    console.log('Open organization:', row);
    showAlert('Organization: ' + row.name);
  }
});

table.Draw(orgForm.getContentArea());
orgForm.Draw(document.body);
```

## 5. Этапы Реализации

### Этап 1: Глобальные Серверные Функции
1. Реализовать `getTableMetadata()` в `globalServerContext.js`
2. Реализовать `getDynamicTableData()` с поддержкой Sequelize
3. Реализовать разрешение foreign keys
4. Реализовать фильтрацию и сортировку
5. Создать болванку `saveClientState()`

### Этап 2: Серверная Часть Приложения
1. Создать `apps/organizations/server.js`
2. Реализовать функции `initDynamicTable()` и `getDynamicTableData()`
3. Добавить маппинг таблиц (switch)
4. Зарегистрировать функции в роутере приложения

### Этап 3: UI Компонент
1. Создать класс `DynamicTable` в `UI_classes.js`
2. Реализовать базовую отрисовку таблицы с Win98 стилем
3. Реализовать виртуальный скроллинг
4. Реализовать изменение ширины колонок
5. Реализовать клавиатурную навигацию
6. Реализовать выделение строк (одиночное и множественное)
7. Реализовать события
8. Добавить индикатор загрузки

### Этап 4: Клиентская Часть Приложения
1. Создать `apps/organizations/resources/public/client.js`
2. Создать форму с таблицей
3. Настроить `config.json` для автозапуска

### Этап 5: Тестирование
1. Проверить загрузку данных
2. Проверить скроллинг (виртуальный)
3. Проверить изменение размера колонок
4. Проверить клавиатурную навигацию
5. Проверить выделение строк
6. Проверить отображение foreign keys
7. (Позже) Тестировать фильтры и сортировку

## 6. Будущие Доработки

- UI форма для настройки фильтров
- Редактирование данных прямо в таблице
- Экспорт в CSV/Excel
- Сохранение настроек колонок и позиций окон в БД
- Группировка строк
- Подсветка строк по условиям
- Контекстное меню (правый клик)
