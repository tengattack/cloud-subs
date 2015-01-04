var fs = require('fs');

var Database = require('./../units/db');
var BTSite = require('./../units/bt-sites').BTSite;

var db = new Database();

var bts = BTSite('ktxp');
bts.init(function (err) {
if (err) {
  console.log(err);
  return;
}
bts.login(function (err, islogin) {
  if (err) {
    console.log(err);
  }
  if(!err && islogin) {
    var tbuf = new Buffer(1); //fs.createReadStream('./a456e5f878c1f404b34ef9a9aa5a13ea60304ab6.torrent');
    bts.upload('【KNA字幕組】【Space☆Dandy 宇宙浪子/太空丹迪】[18][720P][BIG5][MP4]',
      '【KNA字幕組】【Space☆Dandy 宇宙浪子/太空丹迪】[18][720P][BIG5][MP4]', tbuf, function (err, succeed) {
      console.log(err, succeed);
    });
  }
});

});