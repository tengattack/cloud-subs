var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var DownloadSchema = new Schema({
  task_id: {
    type: ObjectId
  },
  type: {
    type: String
  },
  filename: {
    type: String
  },
  file_id: {
    type: ObjectId
  },
  url: {
    type: String
  },
  percentage: {
    type: String
  },
  speed: {
    type: String
  },
  status: {
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

mongoose.model('Download', DownloadSchema, 'download');
