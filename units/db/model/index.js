var mongoose = require('mongoose');

// models
require('./bt-sites');
require('./download');
require('./files');
require('./task');
require('./user');

exports.BtSites = mongoose.model('BtSites');
exports.Download = mongoose.model('Download');
exports.Files = mongoose.model('Files');
exports.Task = mongoose.model('Task');
exports.User = mongoose.model('User');
