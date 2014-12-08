var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var BtSitesSchema = new Schema({
  user_id: {
    type: ObjectId
  },
  site: {
    type: String
  },
  username: {
    type: String
  },
  password: {
    type: String
  },
  cookie: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('BtSites', BtSitesSchema, 'bt_sites');
