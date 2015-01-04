
var fs = require('fs');

var Database = require('./../units/db');
var BTSite = require('./../units/bt-sites').BTSite;
var Template = require('./../units/util/template');

var db = new Database();

var bts = BTSite('bangumi', '544cbeded171e630092bba25');
var templ = new Template('Girlfriend (kari)', 1);
templ.init(function (err, succeed) {
  /*bts.IsLogin(function (err, islogin) {
    console.log('IsLogin', err, islogin);
  });*/
  bts.init(function () {
    bts.login(function (err, islogin) {
      if (err) {
        console.log('login', err, islogin);
        return;
      }
      fs.readFile('./[KNA][Girlfriend (kari)][01][720P][MP4][BIG5].mp4.torrent', function (err, data) {
        if (err) {
          console.log('readFile', err);
          return;
        }
        bts.upload(templ.title(), templ.intro(), data, function (err, info) {
          console.log('upload', err, info);
        });
      });
    });
  });
});

