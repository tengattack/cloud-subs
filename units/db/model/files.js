var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var FilesSchema = new Schema({
  type: {
    type: String
  },
  name: {
    type: String
  },
  size: {
    type: Number
  },
  path: {
    type: String
  },
  upload_at: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('Files', FilesSchema, 'files');
