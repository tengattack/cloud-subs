//for baidu pan

var util = require('util');

var S = require('string');
var _ = require('underscore');

var request = require('./../util/request');
var ocr = require('./../ocr').ocr;

var bd_config = require('./../../config').downloader.baidu;

var MAX_TRY_TIMES = 10;
var BAIDUPAN_BASE_URL = 'http://pan.baidu.com';

function BaiduDownloader() {
}

BaiduDownloader.prototype.init = function (callback) {
  //check login
  callback(null, true);
};

BaiduDownloader.prototype._getvcode = function (url, callback) {
  request.get(url, { buffer: true }, function (err, response, body) {
    if (err) {
      callback('验证码获取失败');
      return;
    }
    ocr(body, 4, callback);
  });
};

BaiduDownloader.prototype._getcaptcha = function (app_id, callback) {
  var url = BAIDUPAN_BASE_URL
    + '/api/getcaptcha?prod=share&bdstoken=&channel=chunlei&clienttype=0&web=1&app_id=' + app_id;
  var that = this;
  request.get(url, function (err, response, body) {
    if (err) {
      callback(err);
      return;
    }
    var result = null;
    try {
      result = JSON.parse(body);
    } catch (e) {}
    if (result.errno != 0) {
      callback(result);
    } else {
      callback(null, result);
    }
  });
};

BaiduDownloader.prototype._verify = function (infos, code, callback) {
  var url = BAIDUPAN_BASE_URL
    + '/share/verify?shareid=' + infos.shareid
    + '&uk=' + infos.uk + '&t=' + Date.now()
    + '&channel=chunlei&clienttype=0&web=1';
  var formdata = {
    pwd: code,
    vcode: ''
  };
  request.post(url, formdata, {json: true}, function (err, response, body) {
    if (err) {
      callback('密码验证获取失败');
      return;
    }
    if (body.errno == 0) {
      var sekey;
      var newcookies = response.headers['set-cookie'];
      _.each(newcookies, function (cookieinfo) {
        var m = cookieinfo.match(/BDCLND=(.*?);/i);
        if (m && m[1]) {
          sekey = decodeURIComponent(m[1]);
        }
      });
      callback(null, sekey);
    } else if (body.errno == -20) {
      //需要验证码
      callback('verify need vcode');
    } else if (body.errno == -12) {
      callback('密码错误');
    } else {
      callback('未知错误');
    }
  });
};

BaiduDownloader.prototype._sharedownload = function (_context, callback, depth) {
  var depth = depth ? depth : 0;
  if (depth >= MAX_TRY_TIMES) {
    callback('max try times exceed');
    return;
  }
  var file = _context.file_list.list[0];
  var url = BAIDUPAN_BASE_URL + '/api/sharedownload?sign=' + _context.sign
    + '&timestamp=' + _context.timestamp
    + '&bdstoken=&channel=chunlei&clienttype=0&web=1'
    + '&app_id=' + file.app_id;

  var formdata = {
    encrypt: 0,
    product: 'share',
    uk: _context.uk,
    primaryid: _context.shareid,
    fid_list: '[' + file.fs_id + ']'
  };
  if (_context.vcode) {
    formdata = _.extend(formdata, _context.vcode);
  }
  if (_context.sekey) {
    formdata.extra = '{"sekey":"' + _context.sekey + '"}';
  }

  var that = this;
  request.post(url, formdata, function (err, response, body) {
    if (err) {
      callback(err);
      return;
    }
    var result = null;
    try {
      result = JSON.parse(body);
    } catch (e) {}
    if (result) {
      if (result.errno == -20) {
        //need vcode
        that._getcaptcha(file.app_id, function (err, result) {
          if (err) {
            callback(err);
            return;
          }
          that._getvcode(result.vcode_img, function (err, word) {
            _context.vcode = {
              vcode_str: result.vcode_str,
              vcode_input: word
            };
            that._sharedownload(_context, callback, depth + 1);
          });
        });
      } else if (result.errno == 0) {
        callback(null, result);
      } else {
        callback(result);
      }
    } else {
      callback('not found download link');
    }
  });
};

BaiduDownloader.prototype.filename = function () {
  return this._filename;
};

BaiduDownloader.prototype.dl = function (url, opts, callback, fn_process, fn_finish) {
  if (!S(url).startsWith(BAIDUPAN_BASE_URL + '/')) {
    callback('invalid url');
    return;
  }
  if (!opts) opts = {};
  var that = this;
  request.get(url, function (err, response, body) {
    if (err) {
      callback(err);
      return;
    }
    if (response.statusCode === 302) {
      if (opts.redirect_times && opts.redirect_times > 5) {
        callback('too many redirect');
      } else {
        if (!opts.redirect_times) {
          opts.redirect_times = 1;
        } else {
          opts.redirect_times++;
        }
        url = response.headers['location'];
        that.dl(url, opts, callback, fn_process, fn_finish);
      }
      return;
    }
    if (body.indexOf('<body class="acss_verify_code">') !== -1) {
      //need code
      if (!opts.code) {
        callback('需要密码');
        return;
      } else {
        //TODO: using url.parse
        var minfo = url.match(/shareid=(\d+)&uk=(\d+)/i);
        if (!minfo) {
          callback('share info not found');
          return;
        }
        var infos = {shareid: minfo[1], uk: minfo[2]};
        that._verify(infos, opts.code, function (err, sekey) {
          if (err) {
            callback(err);
            return;
          }
          if (!sekey) {
            callback('sekey not found');
            return;
          }
          opts.sekey = sekey;
          url = BAIDUPAN_BASE_URL + '/share/link'
            + '?shareid=' + infos.shareid
            + '&uk=' + infos.uk;
          that.dl(url, opts, callback, fn_process, fn_finish);
        });
        return;
      }
    }
    var m = body.match(/<script type="text\/javascript">(.*?yunData\.[\s\S]+?)<\/script>/i);
    if (m && m[1]) {
      var script_src = m[1];

      var mcontext = script_src.match(/var _context = ({.+?});/i);
      if (mcontext) {
        var _context = null;
        try {
          _context = JSON.parse(mcontext[1]);
        } catch (e) {}
        if (_context) {
          if (opts.sekey) {
            _context.sekey = opts.sekey;
          }
          that._sharedownload(_context, function (err, result) {
            if (err) {
              callback(err);
              return;
            }
            if (result && result.errno == 0) {
              if (result.list.length > 0 && result.list[0].dlink) {
                var f = result.list[0];
                var dlink = f.dlink;
                var fname = f.server_filename;
                that._filename = fname;
                //forward link
                request.get(dlink, { buffer: true }, function (err, response, body) {
                  if (err) {
                    callback(err);
                    return;
                  }
                  if (response.statusCode === 302) {
                    var dlink = response.headers['location'];
                    var _percentage = '', _speed = '';
                    var t = null;
                    if (fn_process) {
                      t = setInterval(function () {
                        fn_process(_percentage, _speed);
                      }, 2000);
                    }
                    request.axel(60, dlink, fname, url, function (percentage, speed) {
                      _percentage = percentage;
                      _speed = speed;
                    }, function (err, stdout) {
                      if (t) clearInterval(t);
                      if (fn_finish) fn_finish(err, stdout);
                    });
                    callback(null, true);
                  } else if (response.statusCode === 200) {
                    //download finish...
                    callback('download link non jump');
                  } else {
                    callback('HTTP/1.0 ' + response.statusCode + '\n' + body);
                  }
                });
                return;
              }
            }
            callback('not found download link');
          });
          return;
        }
        callback('unknown error');
      }
    } else {
      callback('not found script src');
    }
  });
};

module.exports = BaiduDownloader;
