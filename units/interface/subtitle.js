
var Files = require('./../util/files');
var Proxy = require('./../db/proxy'),
  TaskProxy = Proxy.Task;

function stSave(task_id, file) {
  var f = new Files('subtitle', file);
  if (f.valid()) {
    return function (callback) {
      f.save(function (err, _f) {
        if (err) {
          callback(err);
          return;
        }
        TaskProxy.updateById(task_id, {subtitle_id: _f._id}, function () {});
        callback(null, _f);
      });
    };
  }
  return function (callback) {
    callback(new Error('invalid file'));
  };
}

function stGet(id) {
  return function (callback) {
    Files.get(id, callback);
  };
}

function *subtitle_route(action) {
  switch (action) {
    case 'upload':
      var task_id = this.request.body ? this.request.body.task_id : undefined;
      if (task_id && this.request.files && this.request.files.subtitle_file) {
        var st = yield stSave(task_id, this.request.files.subtitle_file);
        this.body = st ? st : {errno: 3};
      } else {
        this.body = {errno: 2};
      }
      break;
    case 'info':
      if (this.query && this.query.id) {
        var st = yield stGet(this.query.id);
        this.body = st ? st : {errno: 3};
      } else {
        this.body = {errno: 2};
      }
      break;
    default:
      this.status = 404;
      break;
  }
}

module.exports = subtitle_route;
