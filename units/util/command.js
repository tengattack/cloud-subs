
var fs = require('fs');

var iconv = require('iconv-lite');
var exec = require('child_process').exec;

//TODO: in English Windows
//CHECK: we use 'chcp 65001' in cmd for utf-8 encoding
var ENV_CHARSET = 'utf8';

exports.writeFile = function (outfile, cmd, options, callback) {
  if (ENV_CHARSET == 'utf-8') {
    fs.writeFile(outfile, cmd, options, callback);
  } else {
    var data = iconv.encode(cmd, ENV_CHARSET);
    if (callback) {
      fs.writeFile(outfile, data, options, callback);
    } else {
      callback = options;
      fs.writeFile(outfile, data, callback);
    }
  }
};

exports.exec = function (cmd, fn_stdout, callback) {
  //1M buffer
  var c = exec(cmd, {encoding: 'binary', maxBuffer: 1024 * 1024}, function (err, stdout, stderr) {
    if (err) {
      err.message = iconv.decode(new Buffer(err.message, 'binary'), ENV_CHARSET);
    }
    callback(err, stdout, stderr);
  });
  if (fn_stdout) {
    c.stdout.on('data', function (data) {
      data = iconv.decode(new Buffer(data, 'binary'), ENV_CHARSET);
      fn_stdout(data);
    });
    c.stderr.on('data', function (data) {
      data = iconv.decode(new Buffer(data, 'binary'), ENV_CHARSET);
      fn_stdout(null, data);
    });
  }
  /*c.on('exit', function (code) {
    if (code !== 0) {
      ep.emit('error', 'failed to exec \'' + cmd + '\'');
    } else {
      ep.emit('next');
    }
  });*/
  return c;
};