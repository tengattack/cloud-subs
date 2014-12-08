
var config = require('./../../config').db;
var mongoose = require('mongoose');


function Database() {
  this.connect();
}

Database.prototype.connect = function() {
  var connectUrl = 'mongodb://' + config.DB_USER + ':' + config.DB_PASS + '@' + config.DB_HOST + ':' + config.DB_PORT + '/' + config.DB_NAME;
  mongoose.connect(connectUrl, function (err) {
    if (err) {
      console.error('connect to %s error: ', config.db, err.message);
      process.exit(1);
    }
  });
};

module.exports = Database;
