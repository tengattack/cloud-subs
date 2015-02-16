
var sys_config = require('./../../config').sys;

var path = require('path'),
  child = require('child_process');
var regedit = require('regedit');
var opentype = require('opentype.js');

exports.list = function (callback) {
  regedit.list('HKLM\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Fonts', function (err, result) {
    if (err) {
      return callback(err);
    }
    var fontlist = [];
    for (var k in result) {
      var values = result[k].values;
      for (var name in values) {
        var prop = values[name];
        if (prop.type === 'REG_SZ') {
          var font = {};
          var ftsi = name.lastIndexOf('(');
          if (ftsi > 0 && name[ftsi - 1] === ' ') {
            font.name = name.substring(0, ftsi - 1);
            var ftendi = name.lastIndexOf(')');
            if (ftendi >= 0 && ftendi > ftsi) {
              font.type = name.substring(ftsi + 1, ftendi);
            }
          } else {
            font.name = name;
          }
          fontlist.push(font);
        }
      }
    }
    callback(null, fontlist);
  });
};

exports.read = function (file, callback) {
  return opentype.load(file, function (err, font) {
    if (err) {
      return callback(err);
    }
    var fontName, fontType;
    if (font.tables.name && font.tables.name.fullName) {
      fontName = font.tables.name.fullName;
    } else if (font.familyName) {
      fontName = font.familyName;
      if (font.styleName) {
        fontName += ' ' + font.styleName;
      }
    } else {
      //undefined font name
      return callback(new Error('undefined font name'));
    }
    switch (font.outlinesFormat) {
      case 'truetype':
        fontType = 'TrueType';
        break;
      case 'opentype':
        fontType = 'OpenType';
        break;
      default:
        return callback(new Error('unsupported font type'));
        break;
    }
    callback(null, {
      name: fontName,
      type: fontType
    });
  });
};

var fontinstpath = path.join(sys_config.root_dir, 'units/util', 'fontinstall.vbs');

exports.install = function (font, fontpath, callback) {
  var cmd = 'cscript.exe //Nologo "' + fontinstpath + '"'
    + ' "' +  fontpath + '"';
  child.exec(cmd, function (err, stdout, stderr) {
    if (err) {
      return callback(err);
    }
    if (stderr) {
      return callback(new Error(stderr));
    }
    callback();
  });
};
