
var ocr_config = require('./../../config').ocr;
var request = require('./../util/request');

var RUOKUAI_API = 'http://api.ruokuai.com/create.json';
var RUOKUAI_TYPE = {
  4: '3040',
  5: '3050'
};

var SOFT_INFO = {
  'id': 23066,
  'name': 'x264-cloud',
  'key': 'a574d6c397a943cea48a8874f90dc5cd'
};

function OCRRuokuai() {

}

OCRRuokuai.prototype.ocr = function(image_buf, word_count, callback) {
  var typeid = RUOKUAI_TYPE[word_count];
  if (!typeid) {
    callback('unsupported type');
    return;
  }
  var formdata = {
    username: ocr_config.USERNAME,
    password: ocr_config.PASSWORD,
    typeid: typeid,
    //timeout: 90,
    softid: SOFT_INFO.id,
    softkey: SOFT_INFO.key,
    __object: [{ 
      type: 'buffer',
      name: 'image',
      buffer: image_buf,
      options: {
        filename: 'vimg.png'
    }}],
    submit: 'Submit'
  };
  request.post(RUOKUAI_API, formdata, { multipart: true }, function (err, response, body) {
    if (err) {
      callback(err);
      return;
    }
    var result;
    try {
      result = body ? JSON.parse(body) : null;
    } catch (e) {
    }
    if (result) {
      if (result.Error) {
        callback(result.Error);
      } else if (result.Result && typeof result.Result == 'string') {
        callback(null, result.Result);
      } else {
        callback(null, '');
      }
    } else {
      callback('ocr failed');
    }
  });
}

module.exports = OCRRuokuai;