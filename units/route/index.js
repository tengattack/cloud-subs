
var fs = require('fs');
var path = require('path');

var logger = require('koa-logger');
var route = require('koa-route');
var session = require('koa-session');
//var staticCache = require('koa-static-cache');
var parse = require('co-body')
  , multipartparse = require('co-busboy');

var config = require('./../../config'),
  key_config = config.keys,
  sys_config = config.sys;
var Interface = require('./../interface');

//one week
var COOKIE_MAXAGE = 7 * 24 * 60 * 60 * 1000;

function makeuniqueid(count) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < count; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

function middleware_main(app) {

app.keys = [key_config.SESSION_KEY];

// middleware
app.use(logger());
//app.use(json({ pretty: false }));

app.use(session({maxAge: COOKIE_MAXAGE}, app));

app.use(function *(next) {
  var have_files = false;
  if (this.request.is('multipart/*')) {
    var parts = multipartparse(this);
    var part;
    var body = {};
    var files = {};
    while (part = yield parts) {
      if (part.length) {
        // arrays are busboy fields
        body[part[0]] = part[1];
      } else {
        // otherwise, it's a stream
        var extName = path.extname(part.filename);
        var tmpFileName = makeuniqueid(16);
        var savepath = path.resolve(sys_config.tmp_dir + tmpFileName);
        part.pipe(fs.createWriteStream(savepath));

        files[part.fieldname] = {
          filename: part.filename,
          mimeType: part.mimeType,
          extname: extName,
          savename: tmpFileName,
          savepath: savepath
        };

        have_files = true;
      }
    }
    this.request.body = body;
    this.request.files = files;
  } else if ('POST' == this.method) {
    try {
      var body = yield parse.json(this); //, { limit: '1kb' }
      this.request.body = body;
    } catch (e) {
      this.request.body = {};
    }
  }

  yield next;

  if (have_files) {
    //delete tmp files
    var files = this.request.files;
    for (var k in files) {
      fs.unlink(files[k].savepath, function () {});
    }
  }
});

//JSON error handling
app.use(function *pageNotFound(next) {
  yield next;
  if (404 != this.status) return;
  this.status = 404;
  this.body = {
    errno: 404,
    message: 'Page Not Found'
  };
});

app.use(function *(next) {
  try {
    yield next;
  } catch (err) {
    //this.status = 500;
    this.body = {
      errno: 500,
      message: err.toString()
    };
  }
});

}

function route_main(app) {

// route middleware
// route definitions
app.use(route.all('/api/user/:action', Interface.user));
app.use(route.all('/api/bangumi/:action', Interface.bangumi));
app.use(route.all('/api/task/:action', Interface.task));
app.use(route.all('/api/download/:action', Interface.download));
app.use(route.all('/api/subtitle/:action', Interface.subtitle));
app.use(route.all('/api/font/:action', Interface.font));

}

exports.middleware = middleware_main;
exports.route = route_main;
