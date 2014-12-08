var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var TaskSchema = new Schema({
  bangumi: {
    type: String
  },
  episode: {
    type: Number
  },
  download_id: {
    type: ObjectId
  },
  subtitle_id: {
    type: ObjectId
  },
  opts: {
    type: Schema.Types.Mixed
  },
  outfile: {
    type: String
  },
  status: {
    type: String
  },
  logs: {
    type: String
  },
  bt_sites: {
    type: Schema.Types.Mixed
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

mongoose.model('Task', TaskSchema, 'task');
