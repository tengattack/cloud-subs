

var fs = require('fs');
var _ = require('underscore');

var sys_config = require('./config').sys;

var Template = require('./units/util/template');
var Database = require('./units/db');

var BtDownloader = require('./units/downloader/bt');
var BTSite = require('./units/bt-sites').BTSite;

var db = new Database();

var templ = new Template('FSN2014', 0);
/*templ.list(function (err, lists) {
  console.log(lists);
});*/

templ.init(function (err, succeed) {
  if (err) {
    console.log(err);
    return;
  }

var datafile = templ.outfile;
var torrentfile = datafile + '.torrent';

var btd = new BtDownloader();
btd.createTorrent(datafile, torrentfile, function (err, stdout) {
if (err) {
  console.log(err);
  return;
}

//it will get from user upload
fs.readFile(torrentfile, function (err, data) {

  var tbuf = data; //fs.createReadStream('t.torrent');

  var btss = [BTSite('dmhy') , BTSite('ktxp')];
  _.each(btss, function (bts) {
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
        bts.upload(templ.title(), templ.intro(), tbuf, function (err, succeed) {
          console.log(err, succeed);
        });
      }
    });
  });
  });

}); //fs.readFile

}); //btd.createTorrent

}); //templ.init
