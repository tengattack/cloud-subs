var _ = require('underscore');

var models = require('../model');
var Download = models.Download;

exports.get = function(id, callback) {
  Download.findOne({
    _id: id
  }, callback);
};

exports.getById = exports.get;

exports.newAndSave = function(task_id, type, file_id, url, callback) {
  var dl = new Download();
  dl.task_id = task_id;
  dl.type = type;
  dl.file_id = file_id;
  dl.url = url;

  dl.save(callback);
};

exports.fetchAll = function(callback) {
  var opts = {sort: {'created_at': -1}};
  Download.find({}, null, opts, callback);
};

exports.updateById = function(id, data, callback) {
  var set = {'updated_at': Date.now()};
  _.extend(set, data);
  Task.update({ _id: id }, {$set: set}).exec(callback);
};

exports.removeById = function(id, callback) {
  Download.remove({
    _id: id
  }, callback);
};
