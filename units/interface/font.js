
var sys_config = require('./../../config').sys;

var fs = require('fs'),
  path = require('path');

var Files = require('./../util/files'),
  Fonts = require('./../util/fonts');

function fontList() {
  return function (callback) {
    Fonts.list(callback);
    //callback(null, [ { name: 'SimSun', type: 'TrueType' } ]);
  };
}

function fontNew(font_file) {
  return function (callback) {
    var f = new Files('font', font_file);
    if (f.valid()) {
      Fonts.read(f.path, function (err, font) {
        if (err) {
          return callback(err);
        }
        //check font exists
        Fonts.list(function (err, fontlist) {
          if (err) {
            return callback(err);
          }
          var found = false;
          for (var i = 0; i < fontlist.length; i++) {
            if (fontlist.name === font.name) {
              found = true;
              break;
            }
          }
          if (found) {
            return callback(new Error('font already installed'));
          } else {
            var sname = font.name.toLowerCase().replace(/ /g, '-') + f.extname;
            var spath = path.join(sys_config.public_dir, 'data/fonts', sname);
            fs.rename(f.path, spath, function (err) {
              if (err) {
                return callback(err);
              }
              Fonts.install(font, spath, function (err) {
                if (err) {
                  return callback(err);
                }
                callback(null, font);
              });
            });
          }
        });
      });
    } else {
      callback(new TypeError('no valid font'));
    }
  };
}

function *font_route(action) {
  switch (action) {
    case 'query':
      this.body = yield fontList();
      break;
    case 'upload':
      if (!this.session || !this.session.user) {
        this.body = {errno: 3};
        return;
      }
      if (this.request.files && this.request.files.font_file) {
        var font = yield fontNew(this.request.files.font_file);
        this.body = font ? {errno: 0, font: font} : {errno: 3};
      } else {
        this.body = {errno: 2};
      }
      break;
    default:
      this.status = 404;
      break;
  }
}

module.exports = font_route;
