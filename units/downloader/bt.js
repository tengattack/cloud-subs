//for utorrent
//api doc: http://www.utorrent.com/community/developers/webapi

var fs = require('fs');
var path = require('path');

var nt = require('nt');
var trackers = require('./../../config/trackers.json');

var util = require('util');
var _ = require('underscore');
var request = require('./../util/request');
var command = require('./../util/command');

var ut_config = require('./../../config').downloader.utorrent;
var sys_config = require('./../../config').sys;

function BtDownloader() {
  this.url = 'http://' + ut_config.HOST + ':' + ut_config.PORT + '/gui';
  this.auth = {
    user: ut_config.USERNAME,
    pass: ut_config.PASSWORD
  };
  this.token = '';
}

BtDownloader.prototype.init = function (callback) {
  var that = this;
  request.get(this.url + '/token.html?t=1412392739725',
    {auth: this.auth},
    function (err, response, body) {
      if (err) {
        callback(err);
        return;
      }
      var m = body.match(/<div id='token'.*?>(.+?)<\/div>/i);
      if (m && m[1]) {
        that.token = m[1];
        callback(null, true);
      } else {
        callback('not found token');
      }
    });
};

BtDownloader.prototype.Url = function (opts) {
  var url = this.url + '/?token=' + this.token;
  if (opts) {
    _.each(opts, function (value, key) {
      url += '&' + key + '=' + value;
    });
  }
  url += '&t=' + Date.now();
  return url;
};

BtDownloader.prototype.ParseResult = function (body) {
  try {
    var a = JSON.parse(body);
    return a;
  } catch (e) {
  }
  return undefined;
};

BtDownloader.prototype.list = function (callback) {
  request.get(
    this.Url({list: 1}),
    {auth: this.auth, json: true},
    function (err, response, body) {
      if (err) {
        callback(err);
        return;
      }
      callback(null, body);
    }
  );
};

BtDownloader.prototype.getlastone = function (callback) {
  this.list(function (err, list) {
    if (err) {
      callback(err);
      return;
    }
    if (list) {
      var lasttime = 0;
      var lastone = null;
      _.each(list.torrents, function (t) {
        var starttime = parseInt(t[23]);
        if (lasttime < starttime) {
          lasttime = starttime;
          lastone = t;
        }
      });
      callback(null, lastone);
    } else {
      callback('not found the lastone');
    }
  });
};

BtDownloader.prototype.getfiles = function (hash, callback) {
  request.get(
    this.Url({action: 'getfiles', hash: hash}),
    {auth: this.auth, json: true},
    function (err, response, body) {
      if (err) {
        callback(err);
        return;
      }
      callback(null, body);
    }
  );
};

BtDownloader.prototype.getprocess = function (hash, callback) {
  this.getfiles(hash, function (err, files) {
    if (err) {
      callback(err);
      return;
    }
    if (files && files.files) {
      var file = files.files[1][0];
      var process = {
        filename: file[0],
        filesize: file[1],
        downloaded: file[2]
      };
      callback(null, process);
    } else {
      callback('not found file');
    }
  });
};

BtDownloader.prototype.filename = function () {
  return this._filename;
};

BtDownloader.prototype.add = function (torrent_buf, opts, callback) {

  if (typeof opts === "function") {
    callback = opts;
    opts = {};
  }
  if (!opts.download_dir) {
    opts.download_dir = 1;
  }
  if (!opts.path) {
    opts.path = '';
  }

  var that = this;
  var formdata = {};
  formdata.__object = [{ 
    type: 'buffer',
    name: 'torrent_file',
    buffer: torrent_buf,
    options: {
      filename: 'file.torrent',
      'Content-Type': 'application/x-bittorrent'
  }}];
  //fix bugs when only torrent content
  formdata.submit = 'Submit';

  request.post(
    this.Url({action: 'add-file', download_dir: opts.download_dir, path: opts.path}),
    formdata,
    {auth: this.auth, multipart: true},
    function (err, response, body) {
      if (err) {
        callback(err);
        return;
      }
      var a = that.ParseResult(body);
      if (a) {
        if (a.error) {
          callback(a.error);
        } else {
          callback(null, a);
        }
      } else {
        callback('failed to parse result');
      }
    });
};

BtDownloader.prototype.dl = function (torrent_buf, opts, callback, fn_process, fn_finish) {
  var that = this;
  this.add(torrent_buf, function (err, succeed) {
    if (err) {
      callback(err);
      return;
    }
    that.getlastone(function (err, last) {
      if (err) {
        callback(err);
        return;
      }
      that._filename = last[2];
      var hash = last[0];
      var startt = Date.now();
      var centert = startt, centerdl = 0;
      var itimes = 0;
      var lastdl = 0;
      var t = setInterval(function () {
        that.getprocess(hash, function (err, process) {
          if (err) {
            fn_finish(err);
            clearInterval(t);
            return;
          }
          if (fn_process) {
            var curt = Date.now();
            var usedt = curt - startt;
            
            var percentage = (process.downloaded * 100 / process.filesize).toFixed(1) + '%';
            var speed = ((process.downloaded - lastdl) / (usedt / 1000) / 1000).toFixed(1) + 'KB/s';
            fn_process(percentage, speed);

            // for calc instant speed
            // TODO: if possible, we can use Hann (Hanning) window here
            itimes++;
            var tt = itimes % 10;
            switch (tt) {
            case 0:
              centert = curt;
              centerdl = process.downloaded;
              break;
            case 5:
              startt = centert;
              lastdl = centerdl;
              break;
            }
          }
          if (process.filesize == process.downloaded) {
            clearInterval(t);
            if (fn_finish) fn_finish(null, process);
          }
        });
      }, 2000);
      callback(null, last);
    });
  });
};

BtDownloader.prototype.createTorrentLegacy = function (datafile_path, torrent_path, callback) {
  //avoid select dialog bugs for '/' sep
  datafile_path = path.resolve(datafile_path);
  torrent_path = path.resolve(torrent_path);

  var cmd = 'utcreate -w "' + ut_config.WEBSITE + '" '
    + '-o "' + torrent_path + '" '
    + '"' + datafile_path + '"';
  command.exec(cmd, function () {}, callback);
};

BtDownloader.prototype.createTorrent = function (datafile_path, torrent_path, callback) {
  var announceList = [];
  var dir = path.dirname(datafile_path);
  var filename = path.basename(datafile_path);
  var relative_path = path.relative(sys_config.public_dir + 'dist', dir);

  for (var i = 0; i < trackers.length; i++) {
    announceList.push([new Buffer(trackers[i])]);
  }

  var that = this;
  var rs = nt.make(trackers[0], dir, filename, {
    announceList: announceList,
    comment: 'KNA Cloud Service',
  }, function (err, torrent) {
    if (err) {
      callback(err);
      return;
    }
    fs.readFile(torrent_path, function (err, data) {
      if (err) {
        callback(err);
        return;
      }
      that.add(data, {download_dir:2, path: relative_path}, function (err) {
        console.log(err);
        callback(err);
      });
    });
  });
  rs.pipe(fs.createWriteStream(torrent_path));
};

module.exports = BtDownloader;