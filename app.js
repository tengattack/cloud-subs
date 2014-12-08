
/* Environment */
var node_env = process.env.NODE_ENV;
if (!node_env) {
  node_env = 'development';
}

console.log("NODE_ENV: " + node_env);
if (node_env == 'production') {
  /* Do this on Windows */
  require('hideconsole');
}

/**
 * Module dependencies.
 */

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
var listen_port = 3000;
app.listen(listen_port);
console.log('listening on port ' + listen_port.toString());