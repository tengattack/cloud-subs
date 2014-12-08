var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  //uid: { type: Number, default: 0, unique: true, index: true },
  username_clean: { type: String, unique: true, index: true },
  username: { type: String },
  nickname: { type: String },

  password: { type: String },
  email: { type: String },  //, unique: true

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },

  activate: { type: Boolean, default: true },
});

UserSchema.virtual('uid').get(function () {
  return this._id.toHexString();
});

mongoose.model('User', UserSchema, 'user');
