const { start } = require('my-old-space');
const path = require('path');

// Регистрируем app-level middleware для dbGateway (до старта фреймворка)
require('./dbGateway');

start({
  rootPath: __dirname
});
