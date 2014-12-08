
var fs = require('fs');
var path = require('path');
var S = require('string');
var mkdirp = require('mkdirp');
var EventProxy = require('eventproxy');

var sys_config = require('./../../config').sys;

var Proxy = require('./../db/proxy'),
  FilesProxy = Proxy.Files;

function Files(type, file) {
  this._valid = true;

  this.filename = file.filename;
  this.savename = file.savename;
  this.path = file.savepath;
  this.extname = file.extname;

  switch (this.extname) {
    case '.torrent':
      this.type = 'torrent';
      break;
    case '.ass':
      this.type = 'subtitle';
      break;
    default:
      this._valid = false;
      break;
  }
  if (type && this.type !== type) {
    this._valid = false;
  }
}

Files.get = function(id, callback) {
  return FilesProxy.get(id, callback);
};

Files.prototype.valid = function() {
  return this._valid;
};

Files.prototype.save = function(callback) {
  var date = new Date();
  var mm = S(date.getMonth() + 1).padLeft(2, '0').s;
  //use unix path format
  var savepath = 'data/' + date.getFullYear().toString() + '/' + mm;
  var that = this;

  var ep = new EventProxy();
  ep.all(['mkdir', 'stat'], function (md, stat) {
    
    savepath = savepath + '/' + that.savename + that.extname;
    var filesize = stat['size'];
    var newpath = path.join(sys_config.public_dir, savepath);

    fs.rename(that.path, newpath, function (err) {
      if (err) {
        callback(err);
        return;
      }
      FilesProxy.newAndSave(that.type, that.filename, filesize, savepath, callback);
    });
  });
  ep.fail(callback);

  mkdirp('./public/' + savepath, ep.done('mkdir'));
  fs.stat(this.path, ep.done('stat'));
};

module.exports = Files;