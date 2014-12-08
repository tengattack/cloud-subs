
var fs = require('fs');

var BtDownloader = require('./units/downloader/bt');
var BaiduDownloader = require('./units/downloader/baidu');


var bdd = new BaiduDownloader();
var url = 'http://pan.baidu.com/s/1qWsgy1A';
bdd.init(function (err) {
  bdd.dl(url, {}, function (err, info) {
    console.log(err, info);
  }, function (percentage, speed) {
    console.log(percentage, speed);
  }, function (err, status) {
    console.log('dl fin', status, err);
  });
});
