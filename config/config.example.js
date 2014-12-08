
var path = require('path');

var root_dir = path.resolve(__dirname, '..') + '/';
var public_dir = root_dir + 'public/';

var upload_dir = public_dir + 'data/';
var tmp_dir = public_dir + 'data/tmp/';
var templ_dir = root_dir + 'templates/';

var configs = {
  'sys': {
    'root_dir': root_dir,
    'public_dir': public_dir,
    'tmp_dir': tmp_dir,
    'template_dir': templ_dir,
  },
  'web': {
    'ADMIN_USERNAME': 'kna'
  },
  'keys': {
    'SESSION_KEY': '',
  },
  'downloader': {
    'utorrent': {
      'PORT': 8063,
      'HOST': 'localhost',
      'USERNAME': 'admin',
      'PASSWORD': '',
      'WEBSITE': 'http://mahou-shoujo.moe/'
    }
  },
  'ocr': {
    'ENGINE': 'ruokuai',
    'USERNAME': '',
    'PASSWORD': ''
  },
  'db': {
    "DB_HOST": "localhost",
    "DB_PORT": "27017",
    "DB_NAME": "cloudsubs",
    "DB_USER": "cloudsubs",
    "DB_PASS": "",
    //"DB_PREFIX": "cs_",
  }
};

module.exports = configs;
