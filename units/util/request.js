
var fs = require('fs');
var tough = require('tough-cookie');
var urlParse = require('url').parse;

var request = require('request');
var S = require('string');
var _ = require('underscore');

var sys_config = require('./../../config').sys;
var command = require('./command');

var j = request.jar();

var DEF_USER_AGENT = 'cloud-subs/0.1 (KNA) by tengattack';

exports.clearCookie = function (url) {
  if (j.store) {
    //memstore
    var context = urlParse(url);
    var host = tough.canonicalDomain(context.hostname);
    j.store.removeCookies(host, tough.defaultPath(context.pathname), function () {});
  }
};

exports.setCookie = function (str_cookie, url) {
  var arr_cookie = str_cookie.split(';');
  _.each(arr_cookie, function (sub_cookie) {
    sub_cookie = sub_cookie.trim();
    if (sub_cookie) {
      cookie = request.cookie(sub_cookie);
      j.setCookieSync(cookie, url);
    }
  });
};

exports.getCookie = function (url) {
  return j.getCookieStringSync(url);
};

exports.get = function (url, options, callback) {
  var cb;
  var opts = {
    method: 'GET',
    uri: url,
    followRedirect: false,
    headers: {
      'User-Agent': DEF_USER_AGENT
    },
    gzip: true,
    jar: j
  };
  if (options instanceof Function) {
    cb = options;
    options = null;
  } else {
    cb = callback;
  }
  if (options) {
    if (options.buffer) {
      //the body is returned as a Buffer
      opts.encoding = null;
    }
    if (options.json) {
      opts.json = options.json;
    }
    if (options.auth) {
      //user, pass
      opts.auth = options.auth;
      opts.auth.sendImmediately = true;
    }
  }

  request(opts, cb);
};

exports.post = function (url, form, options, callback) {
  var cb;
  var opts = {
    method: 'POST',
    uri: url,
    followRedirect: false,
    headers: {
      'User-Agent': DEF_USER_AGENT
    },
    gzip: true,
    jar: j
  };
  var multipart = false;
  if (options instanceof Function) {
    cb = options;
    options = null;
  } else {
    cb = callback;
  }
  if (options) {
    if (options.buffer) {
      //the body is returned as a Buffer
      opts.encoding = null;
    }
    if (options.json) {
      opts.json = options.json;
    }
    if (options.auth) {
      //user, pass
      opts.auth = options.auth;
      opts.auth.sendImmediately = true;
    }
    if (options.multipart) {
      multipart = true;
      opts.postambleCRLF = true;
    } else if (options.json) {
      opts.form = JSON.stringify(form);
    } else {
      opts.form = form;
    }
  } else {
    opts.form = form;
  }

  var r = request(opts, cb);
  if (multipart) {
    var f = r.form();
    _.each(form, function (value, key) {
      if (key === '__object') {
        _.each(value, function (item) {
          f.append(item.name, item.buffer, item.options);
        });
      } else {
        f.append(key, value);
      }
    });
  }
};

exports.axel = function (threads, url, filename, referer, fn_process, callback) {
  //var str_cookie = request.getCookie(BAIDUPAN_BASE_URL);
  var outfile = sys_config.tmp_dir + filename;
  var cmd = 'axel -n ' + threads + ' '
    //+ '-H "Cookie: ' + str_cookie + '" '
    + '-U "' + DEF_USER_AGENT + '" '
    + '-H "Referer: ' + referer + '" '
    + '-o "' + outfile + '" '
    + '"' + url + '"';

  var speed = '', process = '';
  var re_status = /\[\s*?([0-9\.]+?([A-Za-z]+?\/s|%))\]/gi;

  var runaxel = function () {
    command.exec(cmd, fn_process ? function (data) {
      var mstatus = false;
      while((arr = re_status.exec(data)) != null) {
        mstatus = true;
        str_status = arr[1];
        if (S(str_status).endsWith('%')) {
          process = str_status;
        } else {
          speed = str_status;
        }
      }
      if (mstatus) {
        fn_process(process, speed);
      }
    } : null, function (err, stdout, stderr) {
      //check if aborted
      var st_file = outfile + '.st';
      fs.exists(st_file, function (exists) {
        if (exists) {
          //next
          fn_process('aborted, restoring', '');
          runaxel();
        } else {
          callback(err, stdout, stderr);
        }
      });
    });
  };

  fs.exists(outfile, function (exists) {
    if (exists) {
      fs.exists(outfile + '.st', function (stexists) {
        if (stexists) {
          callback('downloading by others');
        } else {
          fn_process('100%', 'exists');
          setTimeout(function () {
            callback();
          }, 2000);
        }
      });
    } else {
      runaxel();
    }
  });

  //DONT REMOVE
  //remove old files
  /*fs.unlink(outfile, function (err) {
    fs.unlink(outfile + '.st', function () {
      runaxel();
    });
  });*/
};

exports.aria2 = function (threads, url, filename, referer, fn_process, callback) {
  //var str_cookie = request.getCookie(BAIDUPAN_BASE_URL);
  var cmd = 'aria2c -s ' + threads + ' '
    + '-x ' + (threads > 16 ? 16 : threads) + ' '
    + '-j ' + threads + ' '
    //+ '--header="Cookie: ' + str_cookie + '" '
    + '-U "' + DEF_USER_AGENT + '" '
    + '--header="Referer: ' + referer + '" '
    + '-d "' + sys_config.tmp_dir + '" '
    + '-o "' + filename + '" '
    + '"' + url + '"';

  var speed = '', process = '';
  var re_status = /\(([0-9\.]+?%)\).+?DL:(\S+?) /gi;

  command.exec(cmd, fn_process ? function (data) {
    var mstatus = false;
    while((arr = re_status.exec(data)) != null) {
      mstatus = true;

      process = arr[1];
      speed = arr[2];
    }
    if (mstatus) {
      fn_process(process, speed);
    }
  } : null, callback);
};