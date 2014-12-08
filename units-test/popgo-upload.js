
var fs = require('fs');

var Database = require('./units/db');
var BTSite = require('./units/bt-sites').BTSite;
var Template = require('./units/util/template');

var db = new Database();

var bts = BTSite('popgo');
var templ = new Template('Girlfriend (kari)', 1);
templ.init(function (err, succeed) {
  bts.m_cookie = 'PHPSESSID=971a0rfggk28qfsfd3f49anam6; uid=11055; pass=c5034599f88062b772118e82329d499e';
  //console.log(bts.TransformIntro(templ.intro()));
  bts.IsLogin(function (err, islogin) {
    console.log('IsLogin', err, islogin);
  });
  fs.readFile('[KNA][Girlfriend (kari)][01][720P][MP4][BIG5].mp4.torrent', function (err, data) {
    if (err) {
      console.log('readFile', err);
      return;
    }
    bts.upload(templ.title(), templ.intro(), data, function (err, info) {
      console.log('upload', err, info);
    });
  });
});

