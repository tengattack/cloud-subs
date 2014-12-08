var _ = require('underscore');

var models = require('../model');
var Files = models.Files;

exports.get = function(id, callback) {
  Files.findOne({
    _id: id
  }, callback);
};

exports.getById = exports.get;

exports.newAndSave = function(type, name, size, path, callback) {
  var file = new Files();
  file.type = type;
  file.name = name;
  file.size = size;
  file.path = path;

  file.save(callback);
};

exports.fetchAll = function(callback) {
  Files.find(callback);
};

exports.removeById = function(id, callback) {
  Files.remove({
    _id: id
  }, callback);
};
