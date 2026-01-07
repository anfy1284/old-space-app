# Дополнения к ТЗ - Dynamic Table

## 7. Новые UI Классы (Требуется Реализовать)

### 7.1. CheckBox

**Расположение**: `node_modules/my-old-space/drive_forms/resources/public/UI_classes.js`

**Реализация**:
```javascript
class CheckBox extends UIObject {
  constructor(parentElement = null) {
    super();
    this.checked = false;
    this.readOnly = false;
    this.parentElement = parentElement;
    this.label = '';
  }
  
  setChecked(value) {
    this.checked = value;
    if (this.element) {
      const checkbox = this.element.querySelector('input[type="checkbox"]');
      if (checkbox) checkbox.checked = value;
    }
  }
  
  getChecked() {
    return this.checked;
  }
  
  setReadOnly(value) {
    this.readOnly = value;
    if (this.element) {
      const checkbox = this.element.querySelector('input[type="checkbox"]');
      if (checkbox) checkbox.disabled = value;
    }
  }
  
  setLabel(text) {
    this.label = text;
  }
  
  Draw(container) {
    // Создать checkbox в Win98 стиле
    // Структура: <label><input type="checkbox"> {label}</label>
    // Стили Win98: серый inset border, квадратная галочка
    // readonly: отключить взаимодействие (disabled)
  }
}
```

### 7.2. DatePicker

**Расположение**: `node_modules/my-old-space/drive_forms/resources/public/UI_classes.js`

**Реализация**:
```javascript
class DatePicker extends UIObject {
  constructor(parentElement = null) {
    super();
    this.value = null;  // Date object или null
    this.showTime = false;  // true для TIMESTAMP
    this.readOnly = false;
    this.parentElement = parentElement;
    this.format = 'DD.MM.YYYY';  // или 'DD.MM.YYYY HH:mm' для TIMESTAMP
  }
  
  setValue(date) {
    this.value = date;
    if (this.element) {
      const input = this.element.querySelector('input[type="text"]');
      if (input) input.value = this.formatDate(date);
    }
  }
  
  getValue() {
    return this.value;
  }
  
  setShowTime(value) {
    this.showTime = value;
    this.format = value ? 'DD.MM.YYYY HH:mm' : 'DD.MM.YYYY';
  }
  
  setReadOnly(value) {
    this.readOnly = value;
    if (this.element) {
      const input = this.element.querySelector('input[type="text"]');
      const button = this.element.querySelector('button');
      if (input) input.disabled = value;
      if (button) button.disabled = value;
    }
  }
  
  formatDate(date) {
    if (!date) return '';
    // Форматировать дату в DD.MM.YYYY или DD.MM.YYYY HH:mm
  }
  
  Draw(container) {
    // Создать: <div><input type="text"><button>📅</button></div>
    // Стили Win98
    // readonly: отключить input и кнопку
  }
  
  openCalendar() {
    // Показать popup Form с календарем в Win98 стиле
    // Grid 7x6 (дни недели + 5 недель)
    // Навигация: << < Месяц Год > >>
  }
}
```

## 8. Обработка Ошибок

### 8.1. Сетевые Ошибки

**Стратегия**: Показывать `showAlert()` с сообщением об ошибке.

```javascript
async loadData(firstRow) {
  this.showLoading = true;
  
  try {
    const data = await callServerMethod(this.appName, 'getDynamicTableData', {
      tableName: this.tableName,
      firstRow,
      visibleRows: this.visibleRows,
      sort: this.currentSort,
      filters: this.currentFilters
    });
    
    this.processData(data);
  } catch (error) {
    console.error('[DynamicTable] Load error:', error);
    showAlert('Ошибка загрузки данных: ' + error.message);
  } finally {
    this.showLoading = false;
  }
}
```

### 8.2. Действия с Незагруженными Строками

**Свойство строки**: `row.loaded = true | false`

**Логика**:
- Пользователь может переключаться стрелками по незагруженным строкам (визуально выделяются)
- При попытке открыть (Enter / DoubleClick) незагруженную строку:

```javascript
onRowDoubleClick(rowData, rowIndex) {
  if (!rowData.loaded) {
    showAlert('Данные ещё не загружены. Подождите.');
    return;
  }
  
  // Вызвать callback пользователя
  if (typeof this.options.onRowDoubleClick === 'function') {
    this.options.onRowDoubleClick(rowData, rowIndex);
  }
}
```

### 8.3. SSE Переподключение

**При ошибке SSE**: Автоматически переподключаться через 3 секунды.

```javascript
connectSSE(tableName) {
  const url = `/app/${this.appName}/subscribeToTable?tableName=${tableName}`;
  this.eventSource = new EventSource(url);
  
  this.eventSource.onopen = () => {
    console.log('[DynamicTable] SSE connected');
  };
  
  this.eventSource.onerror = (error) => {
    console.error('[DynamicTable] SSE error, reconnecting in 3s...');
    this.eventSource.close();
    this.eventSource = null;
    
    setTimeout(() => {
      this.connectSSE(tableName);
    }, 3000);
  };
  
  this.eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'dataChanged') {
      this.refresh();  // Перезагрузить данные
    }
  };
}
```

### 8.4. Индикатор Загрузки - Детали

**Overlay**:
- Показывать над всей таблицей (включая заголовки)
- Полупрозрачный фон: `background: rgba(192, 192, 192, 0.7)`
- Текст "Loading..." по центру, Win98 стиль
- **НЕ блокировать** взаимодействие:
  - Можно переключать стрелками (выделение перемещается)
  - Нельзя открыть строку (см. 8.2)
  - Можно менять сортировку (новый запрос отменит текущий)

```javascript
showLoadingIndicator() {
  const overlay = document.createElement('div');
  overlay.className = 'table-loading-overlay';
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.bottom = '0';
  overlay.style.background = 'rgba(192, 192, 192, 0.7)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '1000';
  
  const label = document.createElement('div');
  label.textContent = 'Loading...';
  label.style.padding = '10px 20px';
  label.style.background = '#c0c0c0';
  label.style.border = '2px outset #dfdfdf';
  label.style.fontFamily = 'MS Sans Serif, sans-serif';
  label.style.fontSize = '11px';
  overlay.appendChild(label);
  
  this.tableContainer.appendChild(overlay);
  this.loadingOverlay = overlay;
}
```

## 9. Тестовые Данные

### 9.1. Seed Script для Organizations

**Файл**: `apps/organizations/db/seed.js`

**Назначение**: Заполнить таблицу `organizations` 1000+ тестовыми записями с названиями из "[ferienwohnungen Allgäu](https://ferienwohnungen-allgaeu.de/)".

**Реализация**:
```javascript
const { modelsDB } = require('../../../drive_root/globalServerContext');

async function seedOrganizations() {
  const Organizations = modelsDB.Organizations;
  
  if (!Organizations) {
    console.error('[seed] Model Organizations not found');
    return;
  }
  
  // Проверить: уже есть данные?
  const count = await Organizations.count();
  if (count > 0) {
    console.log(`[seed] Already ${count} organizations, skipping seed`);
    return;
  }
  
  // Названия апартаментов из Альгоя
  const baseNames = [
    'Ferienwohnung Alpenblick',
    'Landhaus Sonnenschein',
    'Berghotel Panorama',
    'Chalet Bergfrieden',
    'Pension Edelweiß',
    'Appartement Zugspitze',
    'Ferienhaus Alptraum',
    'Gästehaus Bergsee',
    'Ferienwohnung Talblick',
    'Gasthof Alpenstube',
    'Hotel Bergkristall',
    'Pension Alpenrose',
    'Landgasthof Hirsch',
    'Ferienwohnung Waldruhe',
    'Berggasthof Adlerhorst',
    'Chalet Schneeberg',
    'Alpenhotel Sonnenhof',
    'Ferienwohnung Bergluft',
    'Pension Almhütte',
    'Appartement Bergwiese',
    // ... добавить ещё ~50 базовых названий
  ];
  
  console.log('[seed] Creating 1000 test organizations...');
  
  for (let i = 0; i < 1000; i++) {
    const baseName = baseNames[i % baseNames.length];
    await Organizations.create({
      name: `${baseName} №${i + 1}`,
      description: `Уютное жильё в Альгоя, регион: ${['Oberallgäu', 'Ostallgäu', 'Unterallgäu'][i % 3]}`,
      isActive: Math.random() > 0.1  // 90% активных
    });
    
    if ((i + 1) % 100 === 0) {
      console.log(`[seed] Created ${i + 1} organizations...`);
    }
  }
  
  console.log('[seed] Seed completed: 1000 organizations created');
}

module.exports = { seedOrganizations };
```

**Запуск**:
```javascript
// В apps/organizations/init.js:
const { seedOrganizations } = require('./db/seed');
seedOrganizations().catch(console.error);
```

### 9.2. Расширенный Список Названий

Для реалистичности добавить ~50 базовых названий:
- Ferienwohnung + [локация/достопримечательность]
- Landhaus + [природа/погода]
- Berghotel/Berggasthof + [горы/виды]
- Chalet/Pension + [альпийская тема]
- Appartement/Gästehaus + [географические точки]

Пример расширенного списка:
```javascript
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
  'Hotel Bergkristall', 'Hotel Alpenblick', 'Hotel Sonnenhof',
  'Berggasthof Adlerhorst', 'Berggasthof Hochalpe', 'Berggasthof Bergsonne',
  'Alpenhotel Sonnenhof', 'Alpenhotel Bergfrieden', 'Alpenhotel Edelweiß',
  'Landgasthof Hirsch', 'Landgasthof Adler', 'Landgasthof Krone',
  'Pension Almwies', 'Pension Bergblick', 'Pension Tannenhof',
  'Ferienwohnung Alpengarten', 'Ferienwohnung Gipfelstürmer', 'Ferienwohnung Bergluft',
  'Appartement Bergjuwel', 'Appartement Alpenkönig', 'Appartement Sonnenterrasse',
  // ... итого ~50
];
```

## 10. Виртуальный Скроллинг - Детали Реализации

### 10.1. Структура Данных Строки

```javascript
{
  id: 123,
  name: 'Ferienwohnung Alpenblick №1',
  description: 'Уютное жильё...',
  isActive: true,
  loaded: true,  // Флаг загрузки
  __index: 0     // Глобальный индекс в полной таблице
}
```

### 10.2. Отрисовка Незагруженных Строк

**Принцип**: Создать DOM элементы с UI классами полей, заполненными пустыми значениями.

```javascript
renderRow(rowData, rowIndex) {
  const tr = document.createElement('tr');
  tr.dataset.rowIndex = rowIndex;
  
  this.fields.forEach(field => {
    const td = document.createElement('td');
    
    if (!rowData.loaded) {
      // Незагруженная строка: создать пустой элемент нужного типа
      const emptyValue = this.createEmptyFieldValue(field);
      td.appendChild(emptyValue);
      td.style.opacity = '0.3';  // Визуально показать что не загружена
    } else {
      // Загруженная строка: отобразить данные
      const fieldValue = this.createFieldValue(field, rowData[field.name]);
      td.appendChild(fieldValue);
    }
    
    tr.appendChild(td);
  });
  
  return tr;
}

createEmptyFieldValue(field) {
  switch (field.type) {
    case 'STRING':
    case 'INTEGER':
    case 'DECIMAL':
    case 'FLOAT':
      const textBox = new TextBox();
      textBox.setText('');
      textBox.setReadOnly(true);
      textBox.Draw(document.createDocumentFragment());
      return textBox.element;
      
    case 'BOOLEAN':
      const checkBox = new CheckBox();
      checkBox.setChecked(false);
      checkBox.setReadOnly(true);
      checkBox.Draw(document.createDocumentFragment());
      return checkBox.element;
      
    case 'DATE':
    case 'TIMESTAMP':
      const datePicker = new DatePicker();
      datePicker.setValue(null);
      datePicker.setReadOnly(true);
      datePicker.setShowTime(field.type === 'TIMESTAMP');
      datePicker.Draw(document.createDocumentFragment());
      return datePicker.element;
      
    default:
      const label = new Label();
      label.setText('');
      label.Draw(document.createDocumentFragment());
      return label.element;
  }
}
```

### 10.3. Загрузка и Обновление

```javascript
async loadDataRange(firstRow, visibleRows) {
  const bufferSize = 10;
  const requestFirstRow = Math.max(0, firstRow - bufferSize);
  const requestVisibleRows = visibleRows + (bufferSize * 2);
  
  const data = await callServerMethod(this.appName, 'getDynamicTableData', {
    tableName: this.tableName,
    firstRow: requestFirstRow,
    visibleRows: requestVisibleRows,
    sort: this.currentSort,
    filters: this.currentFilters
  });
  
  // Обновить кэш
  data.data.forEach((row, index) => {
    const globalIndex = requestFirstRow + index;
    this.dataCache[globalIndex] = { ...row, loaded: true, __index: globalIndex };
  });
  
  // Перерисовать видимые строки
  this.renderVisibleRows();
}
```

## 11. Дополнения и Уточнения к ТЗ

### 11.1. Тестовые Данные для Organizations

**Количество**: 100 записей (вместо 1000+ для упрощения первоначального тестирования)

**Seed скрипт**: `apps/organizations/db/seed.js`

**Названия**: Ferienwohnungen (апартаменты для отдыха) в тематике Альгоя (Германия)

### 11.2. Поддержка Баз Данных

**Поддерживаемые СУБД**: 
- SQLite (по умолчанию для разработки)
- PostgreSQL (для продакшена)

**Конфигурация**: Определяется в файле `dbSettings.json` в корне проекта

**Реализация**: Sequelize автоматически адаптируется к типу БД на основе конфигурации. Все типы данных (INTEGER, STRING, BOOLEAN, DATE, TIMESTAMP) поддерживаются обеими СУБД.

### 11.3. Структура Приложения Organizations

**Существующие файлы**:
- `apps/organizations/db/db.json` ✅ (уже существует с моделью Organizations)
- `apps/organizations/server.js` ✅ (пустой, требует реализации)
- `apps/organizations/config.json` ✅ (существует)

**Требуется создать**:
- `apps/organizations/db/seed.js` - скрипт заполнения тестовыми данными
- `apps/organizations/resources/public/client.js` - клиентская часть с формой и таблицей
- `apps/organizations/init.js` - инициализация и запуск seed

### 11.4. Последовательность Реализации

**Этап 1**: Глобальные серверные функции
1. ✅ `getDynamicTableData()` в `drive_root/globalServerContext.js`
2. ✅ `getTableMetadata()` в `drive_root/globalServerContext.js`
3. ✅ Болванка `saveClientState()` в `drive_root/globalServerContext.js`

**Этап 2**: UI классы (если отсутствуют)
1. ✅ Проверить CheckBox в `UI_classes.js` (создать если нет)
2. ✅ Проверить DatePicker в `UI_classes.js` (создать если нет)

**Этап 3**: Серверная часть приложения
1. ✅ Реализовать `apps/organizations/server.js` с методами:
   - `getDynamicTableData(params, sessionID)`
   - `subscribeToTable(params, sessionID, req, res)` (для SSE)
2. ✅ Создать `apps/organizations/db/seed.js`
3. ✅ Создать `apps/organizations/init.js`

**Этап 4**: UI компонент DynamicTable
1. ✅ Создать класс `DynamicTable` в `UI_classes.js`
2. ✅ Реализовать базовую отрисовку (Win98 стиль)
3. ✅ Реализовать виртуальный скроллинг
4. ✅ Реализовать изменение ширины колонок
5. ✅ Реализовать клавиатурную навигацию
6. ✅ Реализовать выделение строк
7. ✅ Реализовать события (onClick, onDoubleClick)
8. ✅ Добавить индикатор загрузки
9. ✅ Реализовать сортировку (клик по заголовкам)
10. ✅ Опционально: фильтрацию и SSE (можно отложить)

**Этап 5**: Клиентская часть приложения
1. ✅ Создать `apps/organizations/resources/public/client.js`
2. ✅ Создать форму (класс Form) с DynamicTable
3. ✅ Настроить autoStart в config.json

### 11.5. Упрощения для MVP

**Реализуем в первой версии**:
- ✅ Базовая загрузка и отображение данных
- ✅ Виртуальный скроллинг
- ✅ Клавиатурная навигация
- ✅ Изменение ширины колонок
- ✅ Сортировка (клик по заголовкам)
- ✅ Win98 стиль

**Откладываем на потом** (можно добавить позже):
- ⏸ SSE (real-time обновления)
- ⏸ UI для настройки фильтров
- ⏸ Редактирование данных в таблице
- ⏸ Экспорт в CSV/Excel
- ⏸ Сохранение настроек колонок в БД

### 11.6. Особенности Реализации callServerMethod

**Клиентская функция**: Уже существует в фреймворке (вероятно в `client.js`)

**Формат вызова**:
```javascript
callServerMethod('organizations', 'getDynamicTableData', {
  tableName: 'organizations',
  firstRow: 0,
  visibleRows: 20
})
```

**Маршрутизация**: 
- POST `/app/call` с body: `{ app: 'organizations', method: 'getDynamicTableData', params: {...} }`
- Роутинг обрабатывается в `drive_forms/server.js`
- Вызывается функция из `apps/organizations/server.js`
