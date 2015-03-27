
/* Environment */
var node_env = process.env.NODE_ENV;
if (!node_env) {
  node_env = 'development';
}

console.log("NODE_ENV: " + node_env);
if (node_env == 'production') {
  /* Do this on Windows */
  try {
    require('hideconsole');
  } catch (e) {
    console.error(e.message);
  }
}

/**
 * Module dependencies.
 */

var config = require('./config');

var koa = require('koa');
var app = module.exports = koa();

var Database = require('./units/db');
var route = require('./units/route');

var db = new Database();

// middleware
route.middleware(app);
route.route(app);

/**
 * Post listing.
 */

// listen
var server = app.listen(config['web'].port || 3000,
  config['web'].address || '::',
  function () {
    console.log('Server listening on ' +
    server.address().address +
    ':' + server.address().port
  );
});
