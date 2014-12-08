
var fs = require('fs');
var path = require('path');

var sys_config = require('./../../config').sys;
var Files = require('./../util/files');
var D = require('./../downloader');

var Proxy = require('./../db/proxy'),
  DownloadProxy = Proxy.Download,
  TaskProxy = Proxy.Task;

function dlFetchAll() {
  return function (callback) {
    DownloadProxy.fetchAll(callback);
  };
}

function saveTorrentFile(file) {
  var f = new Files('torrent', file);
  if (f.valid()) {
    return function (callback) {
      f.save(callback);
    };
  }
  return function (callback) {
    callback(new Error('invalid file'));
  };
}

function dlTorrentFile(task_id, file) {
  return function (callback) {
    var fpath = path.join(sys_config.public_dir, file.path);
    fs.readFile(fpath, function (err, data) {
      if (err) {
        callback(err);
        return;
      }
      var btbuf = data;
      var btd = new D.BtDownloader();
      btd.init(function (err) {
        if (err) {
          callback(err);
          return;
        }
        DownloadProxy.newAndSave(task_id, 'torrent', file._id, file.path, function (err, dl) {
          if (err) {
            callback(err);
            return;
          }
          var dlobj = dl;
          TaskProxy.updateById(task_id, {download_id: dlobj._id}, function () {});
          btd.dl(btbuf, null, function (err) {
            if (err) {
              dlobj.status = 'error';
              dlobj.save();
              callback(err);
              return;
            }
            callback(null, dlobj);
          }, function (percentage, speed) {
            if (!dlobj.filename) {
              dlobj.filename = btd.filename();
              dlobj.status = 'downloading';
            }
            dlobj.percentage = percentage;
            dlobj.speed = speed;
            dlobj.updated_at = Date.now();
            dlobj.save();
          }, function (err) {
            if (err) {
              dlobj.status = 'error';
            } else {
              dlobj.percentage = '100%';
              //dlobj.speed = '';
              dlobj.status = 'finish';
            }
            dlobj.updated_at = Date.now();
            dlobj.save();
          });
        });
      });
    });
  };
}

function dlBaiduPanFile(task_id, baidupan_url, baidupan_code) {
  return function (callback) {
    var bdd = new D.BaiduDownloader();
    bdd.init(function (err) {
      if (err) {
        callback(err);
        return;
      }
      var saveurl = baidupan_url;
      if (baidupan_code) {
        saveurl += '#code=' + baidupan_code;
      }
      DownloadProxy.newAndSave(task_id, 'baidupan', undefined, saveurl, function (err, dl) {
        if (err) {
          callback(err);
          return;
        }
        var bd_opts;
        var dlobj = dl;
        if (baidupan_code) {
          bd_opts = {code: baidupan_code};
        }
        TaskProxy.updateById(task_id, {download_id: dlobj._id}, function () {});
        bdd.dl(baidupan_url, bd_opts, function (err, info) {
          if (err) {
            console.error('download baidupan', err);
            dlobj.status = 'error';
            dlobj.save();
            callback(err);
            return;
          }
          callback(null, dlobj);
        }, function (percentage, speed) {
          if (!dlobj.filename) {
            dlobj.filename = bdd.filename();
            dlobj.status = 'downloading';
          }
          dlobj.percentage = percentage;
          dlobj.speed = speed;
          dlobj.updated_at = Date.now();
          dlobj.save();
        }, function (err) {
          if (err) {
            console.error('download baidupan', err);
            dlobj.status = 'error';
          } else {
            dlobj.percentage = '100%';
            //dlobj.speed = '';
            dlobj.status = 'finish';
          }
          dlobj.updated_at = Date.now();
          dlobj.save();
        });
      });
    });
  };
}

function dlDownloaded(task_id, download_id) {
  return function (callback) {
    DownloadProxy.get(download_id, function (err, dlobj) {
      if (err) {
        callback(err);
        return;
      }
      if (!dlobj) {
        callback('the download not found');
        return;
      }
      TaskProxy.updateById(task_id, {download_id: dlobj._id}, function (err, task) {
        if (err) {
          callback(err);
          return;
        }
        callback(null, dlobj);
      });
    });
  };
}

function dlGet(id) {
  return function (callback) {
    DownloadProxy.get(id, callback);
  };
}

function *download_route(action) {
  switch (action) {
    case 'query':
      var dls = yield dlFetchAll();
      this.body = dls;
      break;
    case 'add':
      var body = this.request.body;
      if (body.type == 'baidupan' && body.baidupan_url.match(/^http:\/\/pan.baidu.com\//)) {
        var df = yield dlBaiduPanFile(body.task_id, body.baidupan_url, body.baidupan_code);
        if (!df) {
          this.body = {errno: 3};
          return;
        }
        this.body = df;
      } else if (body.type == 'torrent' && this.request.files && this.request.files.torrent_file) {
        var sf = yield saveTorrentFile(this.request.files.torrent_file);
        if (!sf) {
          this.body = {errno: 3};
          return;
        }
        var df = yield dlTorrentFile(body.task_id, sf[0]);
        if (!df) {
          this.body = {errno: 3};
          return;
        }
        this.body = df;
      } else if (body.type == 'downloaded' && body.download_id) {
        var df = yield dlDownloaded(body.task_id, body.download_id);
        this.body = df ? df : {errno: 3};
      } else {
        this.body = {errno: 2};
      }
      break;
    case 'status':
      if (this.query && this.query.id) {
        var dl = yield dlGet(this.query.id);
        this.body = dl ? dl : {errno: 3};
      } else {
        this.body = {errno: 2};
      }
      break;
    default:
      this.status = 404;
      break;
  }
}

module.exports = download_route;
