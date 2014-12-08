
var _ = require('underscore');
var EventProxy = require('eventproxy');

var PW = require('./../util/password');
var BtSite = require('./../bt-sites').BTSite;
var Proxy = require('./../db/proxy'),
  UserProxy = Proxy.User,
  BtSitesProxy = Proxy.BtSites;

var web_config = require('./../../config').web;

function userCreate(nickname, username, password, cur_user_id) {
  return function (callback) {
    //find 'kna' user
    UserProxy.getUserByUserName(web_config.ADMIN_USERNAME, function (err, admain_user) {
      if (err) {
        callback(err);
        return;
      }
      //exists, but not me
      if (admain_user && admain_user._id != cur_user_id) {
        callback(null, {errno: 6, message: 'access denied'});
        return;
      }
      var password_hash = PW.password_hash(password);
      UserProxy.newAndSave(
        username, nickname, password_hash, '', true,
        function (err, u) {
          callback(err, u);
      });
    });
  };
}

function userLogin(username, password) {
  return function (callback) {
    UserProxy.getUserByUserName(username, function (err, u) {
      var r = { errno: 5, message: '' };
      if (err) {
        callback(err);
        return;
      }
      if (!u) {
        r.message = 'incorrect password/username';
        callback(null, r);
        return;
      }
      if (PW.password_check_hash(password, u.password)) {
        r.errno = 0;
        r.user = {
          _id: u._id,
          nickname: u.nickname,
          username: u.username,
          email: u.email,
        };
        callback(null, r);
      } else {
        r.message = 'incorrect password/username';
        callback(null, r);
      }
    });
  };
}

function userBtsites(user_id) {
  return function (callback) {
    BtSitesProxy.getBtSitesByUserId(user_id, function (err, btsites) {
      if (err) {
        callback(err);
        return;
      }
      var btss = {};
      _.each(btsites, function (bts) {
        btss[bts.site] = bts;
      });
      callback(null, btss);
    });
  };
}

function userBtsitesLogin(user_id, siteslist) {
  _.each(siteslist, function (site) {
    var bts = BtSite(site, user_id);
    bts.init(function (err) {
      if (!err) {
        bts.login(function (err) {});
      }
    });
  });
}

function userSettings(user_id, user_new_info, btsites_info) {
  return function (callback) {
    var ep = new EventProxy();
    var siteslist = [];
    ep.all(['user', 'btsites'], function (user, btss) {
      if (siteslist.length > 0) {
        setTimeout(function () {
          userBtsitesLogin(user_id, siteslist);
        }, 0);
      }
      callback(null, true);
    });
    ep.fail(callback);
    ep.once('getbtsites', function (arr_btss) {
      if (arr_btss) {
        _.each(arr_btss, function (bts) {
          if (btsites_info[bts.site]) {
            btsites_info[bts.site].exists = true;
            btsites_info[bts.site]._id = bts._id;
          }
        });
      }

      var count = 0;
      _.each(btsites_info, function (bts, site) {
        siteslist.push(site);
        count++;
      });

      if (count == 0) {
        ep.emit('btsites');
        return;
      }

      ep.after('bts', count, function (btss) {
        ep.emit('btsites', btss);
      });
      _.each(btsites_info, function (bts, site) {
        var sets = {
          username: bts.username,
          password: bts.password
        };
        //updateByIdAndSite
        //or new
        if (bts.exists) {
          BtSitesProxy.updateById(bts._id, sets, ep.group('bts'));
        } else {
          BtSitesProxy.newAndSave(user_id, site, sets.username, sets.password, '', ep.group('bts'));
        }
      });
      
    });

    if (_.isEmpty(user_new_info)) {
      ep.emit('user');
    } else {
      UserProxy.updateById(user_id, user_new_info, ep.done('user'));
    }

    if (_.isEmpty(btsites_info)) {
      ep.emit('btsites');
    } else {
      BtSitesProxy.getBtSitesByUserId(user_id, ep.done('getbtsites'));
    }
  };
}

function *user_route(action) {
  var body = this.request.body;
  switch (action) {
    case 'login':
      if (body.username && body.password) {
        var r = yield userLogin(body.username, body.password);
        if (r && r.errno === 0) {
          //succeed
          this.session.user = r.user;
        }
        this.body = r ? r : {errno: 3};
      } else {
        this.body = {errno: 2};
      }
      break;
    case 'logout':
      this.session = null;
      this.body = { errno: 0, islogin: false };
      break;
    case 'create':
      if (body && body.nickname && body.username && body.password) {
        var user_id = this.session.user ? this.session.user._id : undefined;
        var user = yield userCreate(body.nickname, body.username, body.password, user_id);
        this.body = user ? user : {errno: 3};
      } else {
        this.body = {errno: 2};
      }
      break;
    case 'info':
      var userinfo = { errno: 0, islogin: false };
      if (this.session.user) {
        userinfo.errno = 0;
        userinfo.islogin = true;
        userinfo.user = this.session.user;
        if (this.query.btsites) {
          //query btsites
          userinfo.btsites = yield userBtsites(userinfo.user._id);
        }
      }
      this.body = userinfo;
      break;
    case 'settings':
      if (!this.session.user || !this.session.user._id) {
        this.body = {errno: 5, message: 'need login'};
        return;
      }
      if (body && body.nickname) {
        var user = this.session.user;
        var btsites = ['dmhy', 'ktxp', 'popgo'];
        var btsites_info = {};
        var user_new_info = {};
        if (body.nickname != user.nickname) {
          user_new_info.nickname = body.nickname;
        }
        if (body.email != user.email) {
          user_new_info.email = body.email;
        }
        if (body.password) {
          user_new_info.password = PW.password_hash(body.password);
        }

        if (body.btsites) {
          _.each(btsites, function (site) {
            if (body.btsites[site] && !_.isEmpty(body.btsites[site])) {
              btsites_info[site] = {
                username: body.btsites[site].username,
                password: body.btsites[site].password,
              };
            }
          });
        }

        var succeed = yield userSettings(user._id, user_new_info, btsites_info);
        this.body = succeed ? {errno: 0} : {errno: 3};
      } else {
        this.body = {errno: 2};
      }
      break;
    default:
      this.status = 404;
      break;
  }
}

module.exports = user_route;