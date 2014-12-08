var EventProxy = require('eventproxy');

var models = require('../model');
var BtSites = models.BtSites;

exports.getBtSite = function(id, callback) {
  BtSites.findOne({
    _id: id
  }, callback);
};

exports.getBtSiteById = exports.getBtSites;

exports.getBtSiteByUserIdAndSite = function(user_id, site, callback) {
  BtSites.findOne({
    user_id: user_id,
    site: site
  }, callback);
};

exports.getBtSitesByUserId = function(user_id, callback) {
  BtSites.find({
    user_id: user_id
  }, callback);
};

exports.newAndSave = function(user_id, site, username, password, cookie, callback) {
  var btsite = new BtSites();
  btsite.user_id = user_id;
  btsite.site = site;
  btsite.username = username;
  btsite.password = password;
  btsite.cookie = cookie;

  btsite.save(callback);
};

exports.updateById = function(id, data, callback) {
  data.updated_at = Date.now();
  BtSites.update({ _id: id }, {$set: data}).exec(callback);
};

exports.updateCookieById = function(id, cookie, callback) {
  BtSites.update({ _id: id }, {$set: {'cookie': cookie, 'updated_at': Date.now()}}).exec(callback);
};

exports.fetchAll = function(callback) {
  BtSites.find(callback);
};

exports.removeBtSiteById = function(id, callback) {
  BtSites.remove({
    _id: id
  }, callback);
};
