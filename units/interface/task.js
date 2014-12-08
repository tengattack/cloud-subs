
var fs = require('fs');
var path = require('path');

var _ = require('underscore');
var EventProxy = require('eventproxy');

var sys_config = require('./../../config').sys;
var Template = require('./../util/template');
var Files = require('./../util/files');
var Proxy = require('./../db/proxy'),
  TaskProxy = Proxy.Task,
  DownloadProxy = Proxy.Download;

var BTSite = require('./../bt-sites').BTSite;
var D = require('./../downloader');

function taskFetchAll() {
  return function (callback) {
    TaskProxy.fetchAll(callback);
  };
}

function taskNew(bangumi, episode) {
  return function (callback) {
    var templ = new Template(bangumi, episode);
    templ.init(function (err) {
      var opts = templ.options ? templ.options : {};
      TaskProxy.newAndSave(bangumi, episode, opts, callback);
    });
  };
}

function taskGet(id) {
  return function (callback) {
    TaskProxy.get(id, callback);
  };
}

function taskEncode(user_id, id, autopublish, opts) {
  var task_id = id;
  return function (callback) {
    TaskProxy.get(task_id, function (err, task) {
      if (err) {
        callback(err);
        return;
      }
      if (!task) {
        callback('task not found');
        return;
      }
      if (task.status == 'encoding') {
        callback('task encoding');
        return;
      }
      if (task && task.download_id && task.subtitle_id) {
        DownloadProxy.get(task.download_id, function (err, dl) {
          if (err) {
            callback(err);
            return;
          }
          if (dl.status != 'finish') {
            callback('task unready');
            return;
          }
          Files.get(task.subtitle_id, function (err, st) {
            if (err) {
              callback(err);
              return;
            }

            var updateTaskStatus = function (new_status, props, cb) {
              if (new_status) {
                task.status = new_status;
                task.updated_at = Date.now();
              }
              if (props) {
                for (var k in props) {
                  task[k] = props[k];
                }
              }
              task.save(cb);
            };

            if (!opts) opts = {};
            opts._autopublish = autopublish;
            updateTaskStatus('ready', {opts: opts});
            
            var asspath = path.join(sys_config.public_dir, st.path);
            var templ = new Template(task.bangumi, task.episode, dl.filename, asspath);
            templ.init(opts, function (err, succeed) {
              if (err) {
                updateTaskStatus('error');
                callback(err);
                return;
              }
              updateTaskStatus('encoding', {outfile: ''});
              callback(null, task);

              templ.run(function (err, outfile) {
                if (err) {
                  updateTaskStatus('error');
                  return;
                }
                var outfilename = path.basename(outfile);
                updateTaskStatus('finish', {outfile: outfilename}, function (err) {
                  if (autopublish) {
                    var fn_publish = taskPublish(user_id, task_id);
                    fn_publish(function (err) {
                      if (err) console.error(err);
                    });
                  }
                });
              }, function (stdout, stderr) {
                if (stderr) {
                  updateTaskStatus(null, {logs: stderr});
                } else if (stdout) {
                  updateTaskStatus(null, {logs: stdout});
                }
              }, function (step) {
                //checking
                updateTaskStatus(step);
              });
            });
          });
        });
      } else {
        callback('task unready');
      }
    });
  };
}

function btsitesUpload(user_id, task_id, title, intro, torrent_file, callback)
{
  var updateTaskStatus = function (new_status, props) {
    var task = {};
    if (new_status) task.status = new_status;
    if (props) {
      for (var k in props) {
        task[k] = props[k];
      }
    }
    TaskProxy.updateById(task_id, task, function() {});
  };

  var arr_btsites = ['ktxp', 'dmhy', 'popgo'];
  var ep = new EventProxy();
  var tbuf;
  //it will get from user upload
  ep.all(arr_btsites, function () {
    var bt_sites = {};
    for (var i = 0; i < arguments.length; i++) {
      bt_sites[arr_btsites[i]] = arguments[i];
    }
    updateTaskStatus('published', {bt_sites: bt_sites});
  });
  ep.fail(function (err) {
    console.log(err);
    if (callback) callback(err);
    updateTaskStatus('error');
  });
  ep.once('torrent_buf', function (tbuf) {
    if (callback) callback();

    _.each(arr_btsites, function (btsname) {
      var bts = BTSite(btsname, user_id);
      bts.init(function (err) {
        if (err) {
          console.log(err);
          ep.emit(btsname, false);
          return;
        }
        bts.login(function (err, islogin) {
          if (err) {
            console.log(err);
          }
          if(!err && islogin) {
            bts.upload(title, intro, tbuf, function (err, succeed) {
              if (err) {
                console.log(err);
              }
              if (succeed) {
                bts.getlastpublish(function (err, last) {
                  if (err) {
                    ep.emit(btsname, 'published, but URL was not found');
                  } else {
                    ep.emit(btsname, last.url);
                  }
                });
              } else {
                ep.emit(btsname, succeed);
              }
            });
            //ep.emit(btsname, true);
          } else {
            ep.emit(btsname, false);
          }
        });
      }); //bts.init
    }); //_.each
  });
  fs.readFile(torrent_file, ep.done('torrent_buf'));
}

function taskPublish(user_id, id) {
  var task_id = id;
  return function (callback) {
    TaskProxy.get(task_id, function (err, task) {
      if (err) {
        callback(err);
        return;
      }
      if (!task) {
        callback('task not found');
        return;
      }
      if (!task.outfile) {
        callback('task unready');
        return;
      }

      var updateTaskStatus = function (new_status, props) {
        if (new_status) task.status = new_status;
        if (props) {
          for (var k in props) {
            task[k] = props[k];
          }
        }
        task.updated_at = Date.now();
        task.save();
      };
      updateTaskStatus('publishing');
      callback(null, task);

      var datafile = sys_config.public_dir
        + 'dist/' + task.bangumi + '/' + task.outfile;
      var torrentfile = datafile + '.torrent';
      var btd = new D.BtDownloader();
      btd.init(function (err) {
        if (err) {
          updateTaskStatus('error');
          return;
        }
        btd.createTorrent(datafile, torrentfile, function (err) {
          if (err) {
            updateTaskStatus('error');
            return;
          }

          var templ = new Template(task.bangumi, task.episode);
          templ.init(function (err, succeed) {
            if (err) {
              updateTaskStatus('error');
              return;
            }
            if (templ.intro()) {
              btsitesUpload(user_id, task._id, templ.title(), templ.intro(), torrentfile);
            } else {
              updateTaskStatus('published');
            }
          });
        });
      });
    });
  };
}

function taskPublishNew(user_id, bangumi, episode, title, intro, torrent_file) {
  return function (callback) {
    if (!torrent_file || torrent_file.extname != '.torrent') {
      callback('invalid torrent file');
      return;
    }
    if (!title || !intro) {
      callback();
      return;
    }
    TaskProxy.newAndSave(bangumi, episode, function (err, task) {
      if (err) {
        callback(err);
        return;
      }
      task.status = 'publishing';
      task.save(function () {
        btsitesUpload(user_id, task._id, title, intro, torrent_file.savepath, function (err) {
          if (err) {
            callback(err);
            return;
          }
          callback(null, task);
        });
      });
    });
  };
}

function taskTemplate(bangumi, episode) {
  return function (callback) {
    var templ = new Template(bangumi, episode);
    templ.init(function (err, succeed) {
      var tobj = {
        bangumi: templ.info.bangumi,
        episode: templ.info.episode,
        title: templ.title(),
        intro: templ.intro(),
        options: templ.options
      };
      callback(null, tobj);
    });
  };
}

function taskDelete(task_id) {
  return function (callback) {
    TaskProxy.removeById(task_id, callback);
  };
}

function *task_route(action) {
  var user = this.session.user;
  if (!user || !user._id) {
    this.body = {errno: 6, message: 'need login'};
    return;
  }
  switch (action) {
    case 'query':
      var tasks = yield taskFetchAll();
      this.body = tasks;
      break;
    case 'create':
    case 'encode':
      var body = this.request.body;
      if (body) {
        var task;
        if (action == 'create') {
          body.episode = parseInt(body.episode);
          if (body.bangumi && body.episode != NaN) {
            //check bangumi is string
            task = yield taskNew(body.bangumi, body.episode);
            if (task) task = task[0];
          }
        } else if (action == 'encode') {
          task = yield taskEncode(user._id, body.id, body.autopublish, body.opts);
        }
        this.body = task ? task : {errno: 3};
      } else {
        this.body = {errno: 2};
      }
      break;
    case 'view':
    case 'publish':
      if (this.query && this.query.id) {
        var task;
        if (action == 'view') {
          task = yield taskGet(this.query.id);
        } else if (action == 'publish') {
          task = yield taskPublish(user._id, this.query.id);
        }
        this.body = task ? task : {errno: 3};
      } else {
        this.body = {errno: 2};
      }
      break;
    case 'publishnew':
      if (this.request.body && this.request.files) {
        var body = this.request.body;
        var task = yield taskPublishNew(
            user._id,
            body.bangumi, body.episode,
            body.title, body.intro, this.request.files.torrent_file
          );
        this.body = task ? task : {errno: 3};
      } else {
        this.body = {errno: 2};
      }
      break;
    case 'template':
      var q = { bangumi: '', episode: '' };
      if (this.query) {
        q.bangumi = this.query.bangumi;
        q.episode = this.query.episode;
      }
      var templ = yield taskTemplate(q.bangumi, q.episode);
      this.body = templ;
      break;
    case 'delete':
      if (this.request.body && this.request.body.id) {
        var body = this.request.body;
        var r = yield taskDelete(body.id);
        this.body = r ? r[1] : {errno: 3};
      } else {
        this.body = {errno: 2};
      }
      break;
    default:
      this.status = 404;
      break;
  }
}

module.exports = task_route;