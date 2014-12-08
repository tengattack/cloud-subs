
var fs = require('fs');

var BtDownloader = require('./units/downloader/bt');
var BaiduDownloader = require('./units/downloader/baidu');

//var tbud = new Buffer(1); // bad torrent for test
var torrentfile = './units-test/a456e5f878c1f404b34ef9a9aa5a13ea60304ab6.torrent';
fs.readFile(torrentfile, function (err, data) {

var tbud = data;

var btd = new BtDownloader();
btd.init(function (err) {
  if (err) {
    console.log(err);
    return;
  }
  btd.dl(tbud, function (err, info) {
    console.log(err, succeed);
  }, function (percentage, speed) {
    console.log(percentage, speed);
  }, function (err, status) {
    console.log('dl fin', status, err);
  });

});
});


var bdd = new BaiduDownloader();
var url = 'http://pan.baidu.com/s/1hIzim';
bdd.init(function (err) {
  bdd.dl(url, {}, function (err, info) {
    console.log(err, info);
  }, function (percentage, speed) {
    console.log(percentage, speed);
  }, function (err, status) {
    console.log('dl fin', status, err);
  });
});
