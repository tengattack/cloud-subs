
var OCRRuokuai = require('./ruokuai');

function ocr(image_buf, word_count, callback) {
  var ruokuai = new OCRRuokuai();
  ruokuai.ocr(image_buf, word_count, callback);
}

exports.ocr = ocr;