var _ = require('underscore');

var models = require('../model');
var Task = models.Task;

exports.get = function(id, callback) {
  Task.findOne({
    _id: id
  }, callback);
};

exports.getById = exports.get;

exports.newAndSave = function(bangumi, episode, opts, callback) {
  if (opts instanceof Function) {
    callback = opts;
    opts = {};
  }
  var task = new Task();
  task.bangumi = bangumi;
  task.episode = episode;
  task.opts = opts;

  task.save(callback);
};

exports.updateById = function(id, data, callback) {
  var set = {'updated_at': Date.now()};
  _.extend(set, data);
  Task.update({ _id: id }, {$set: set}).exec(callback);
};

exports.fetchAll = function(callback) {
  var opts = {sort: {'created_at': -1}};
  Task.find({}, null, opts, callback);
};

exports.removeById = function(id, callback) {
  Task.remove({
    _id: id
  }, callback);
};
