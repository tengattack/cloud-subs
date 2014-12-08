
var Template = require('./../util/template');

function templList() {
  return function (callback) {
    Template.list(callback);
  };
}

function *bangumi(action) {
  switch (action) {
    case 'query':
      var bangumis = yield templList();
      this.body = bangumis;
      break;
    default:
      this.status = 404;
      break;
  }
}

module.exports = bangumi;