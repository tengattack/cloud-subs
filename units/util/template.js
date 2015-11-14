
var path = require('path');
var fs = require('fs');
var util = require('util');
var command = require('./command');

var EventProxy = require('eventproxy');
var S = require('string');
var _ = require('underscore');
var sys_config = require('./../../config').sys;

function Template(bgm_name, episode, infile, ass_buf) {
  if (!bgm_name) {
    this.info = {
      bangumi: '',
      episode: '',
    };
    return;
  }

  var str_episode = S(parseInt(episode)).padLeft(2, '0').s;
  var basename = bgm_name + ' ' + str_episode;

  this.info = {
    bangumi: bgm_name,
    episode: str_episode,
    infile: infile,
  };
  this.basename = basename;
  this.ass_buf = ass_buf;

  if (!infile) {
    //not for run
    this.norun = true;
    return;
  } else {
    this.norun = false;
  }
}

Template.list = function(callback) {
  fs.readdir(sys_config.template_dir + 'bangumi', function (err, files) {
    //TODO: fs.lstatSync("./xx").isDirectory()
    callback(err, files);
  });
};

Template.stop = function(pid, callback) {
  var cmd = 'taskkill /f /t /pid ' + pid;
  command.exec(cmd, null, function (err, stdout, stderr) {
    // if stdout.indexOf('SUCCESS')
    callback();
  });
};

Template.prototype.ReadFile = function(path, callback) {
  fs.readFile(path, {encoding: 'utf8'}, callback);
};

Template.prototype.format = function(filename_f, title_f, intro_f, avs_f, command_f) {
  //set options
  //this.info.options = this.options;
  for (var k in this.options) {
    this.info['options.' + k] = this.options[k];
  }

  this.m_filename = S(filename_f).template(this.info).s;
  this.m_title = title_f ? S(title_f).template(this.info).s : undefined;
  this.m_intro = intro_f;

  this.outfile = this.out_dir + this.m_filename;
  if (this.norun) {
    return;
  }

  this.info.tmp_dir = sys_config.tmp_dir;
  this.info.working_dir = this.path;
  this.info.assfile = this.basename + '.ass';
  this.info.avsfile = this.basename + '.avs';
  this.info.outfile = this.outfile;

  this.m_avs = S(avs_f).template(this.info).s;
  this.m_commands = S(command_f).template(this.info).s;
  //this.m_commands += '\r\nexit'; //for exit cmd
};

Template.prototype.title = function () {
  return this.m_title;
};

Template.prototype.intro = function () {
  return this.m_intro;
};

Template.prototype.getoptions = function (optpath, callback) {
  if (!optpath) {
    callback('not set path');
    return;
  }
  var that = this;
  that.options = {};
  fs.exists(optpath, function (exists) {
    if (exists) {
      that.ReadFile(optpath, function (err, data) {
        var json_data = {};
        if (data) {
          try {
            var tmp_data = JSON.parse(data);
            for (var k in tmp_data) {
              if (k && tmp_data[k]) {
                if (tmp_data[k].type === 'string') {
                  json_data[k] = tmp_data[k].default ? tmp_data[k].default : '';
                }
              }
            }
          } catch (e) {
          }
          that.options = json_data;
          callback(null, json_data);
        }
      });
    } else {
      callback(null, {});
    }
  });
};

Template.prototype.mixoptions = function (opts) {
  for (var k in this.options) {
    if (opts[k]) {
      this.options[k] = opts[k];
    }
  }
};

Template.prototype.write = function (callback) {
  if (this.norun) {
    callback(null, true);
    return;
  }
  var asspath = this.path + this.basename + '.ass';
  var avspath = this.path + this.basename + '.avs';
  var cmdpath = this.path + 'run.bat'; //for Windowns

  var ep = new EventProxy();
  ep.all(['ass', 'avs', 'command'], function(ass, avs, command) {
    callback(null, true);
  });
  ep.fail(callback);

  fs.writeFile(asspath, this.ass_buf, ep.done('ass'));
  fs.writeFile(avspath, this.m_avs, ep.done('avs'));
  command.writeFile(cmdpath, this.m_commands, ep.done('command'));

  this.cmdpath = cmdpath;
};

Template.prototype.checkvideo = function (callback) {
  //run ffmpeg to check video
  var that = this;
  var cmd = 'ffmpeg -v error -i "' + this.outfile + '" -f null -';
  command.exec(cmd, null, function (err, stdout, stderr) {
    if (err) {
      callback(err);
      return;
    }
    if (stderr || stdout) {
      callback(stderr ? stderr : stdout);
      return;
    }
    callback(null, that.outfile);
  });
};

Template.prototype.run = function (callback, fn_status, fn_step) {
  if (this.norun) {
    callback('norun');
    return;
  }
  var that = this;
  //remove outfile
  if (this.outfile && fs.existsSync(this.outfile)) {
    fs.unlinkSync(this.outfile);
  }
  //fs.unlink(this.outfile, function () {
    //code page 65001 -> UTF-8
    var cmd = 'cmd /c call "' + that.cmdpath + '"';
    var child = command.exec(cmd,
      fn_status,
      function (err, stdout, stderr) {
        if (err) {
          callback(err);
        } else {
          if (fn_step) fn_step('checking');
          fs.exists(that.outfile, function (exists) {
            if (exists) {
              that.checkvideo(callback);
            } else {
              callback('not found outfile');
            }
          });
        }
    });
    return child.pid;
  //});
};

Template.prototype.init = function(opts, callback) {
  if (opts instanceof Function) {
    callback = opts;
    opts = {};
  }

  var that = this;
  var bgm_path = path.join(sys_config.template_dir, 'bangumi', this.info.bangumi) + '/';
  var common_path = path.join(sys_config.template_dir, 'common') + '/';

  this.info.bgm_dir = bgm_path;

  var ep = new EventProxy();
  var events = ['filename', 'title', 'intro', 'avs', 'subtitle', 'command', 'options', 'mkdir'];
  ep.all(events, function (filename, title, intro, avs, subtitle, str_command, options, mkdir) {
    that.mixoptions(opts);
    that.format(filename, title, intro, avs, str_command);
    that.write(function (err, succeed) {
      if (err) {
        callback(err);
        return;
      }
      callback(null, succeed);
    });
  });
  ep.fail(callback);

  this.ReadFile(bgm_path + 'filename.templ.txt', ep.done('filename'));
  this.ReadFile(bgm_path + 'title.templ.txt', function (err, data) {
    ep.emit('title', err ? undefined : data);
  });
  this.ReadFile(bgm_path + 'intro.templ.html', function (err, data) {
    ep.emit('intro', err ? undefined : data);
  });

  var optpath = bgm_path + 'options.json';
  this.getoptions(optpath, ep.done('options'));

  if (!this.norun) {
    //make dir
    var bgm_name = this.info.bangumi;
    var working_dir = sys_config.tmp_dir + 'bangumi';
    var out_dir = sys_config.public_dir + 'dist/' + bgm_name;
    fs.mkdir(working_dir, function (err) {
      working_dir += '/' + bgm_name;
      fs.mkdir(working_dir, function (err) {
        working_dir += '/' + that.info.episode;
        fs.mkdir(working_dir, function (err) {
          working_dir += '/';
          that.path = working_dir;
          //out_dir
          fs.mkdir(out_dir, function (err) {
            out_dir += '/';
            that.out_dir = out_dir;
            ep.emit('mkdir');
          });
        });
      });
    });

    fs.exists(bgm_path + 'templ.avs', function (exists) {
      var path = (exists ? bgm_path : common_path) + 'templ.avs';
      that.ReadFile(path, ep.done('avs'));
    });
    fs.exists(bgm_path + 'templ.command', function (exists) {
      var path = (exists ? bgm_path : common_path) + 'templ.command';
      that.ReadFile(path, ep.done('command'));
    });
    if (typeof this.ass_buf == 'string') {
      //is string
      var that = this;
      this.ReadFile(this.ass_buf, ep.done(function (data) {
        that.ass_buf = data;
        ep.emit('subtitle');
      }));
    } else {
      ep.emit('subtitle');
    }
  } else {
    ep.emit('avs');
    ep.emit('command');
    ep.emit('subtitle');
    ep.emit('mkdir');
  }
};

module.exports = Template;
