
var sys_config = require('./../config').sys;
var BaiduDownloader = require('./../units/downloader/baidu');

var bdd = new BaiduDownloader();
//var url = 'http://pan.baidu.com/s/1hIzim';
var url = 'http://pan.baidu.com/s/1pLaPBgZ';
var code = 'vnte';
bdd.init(function (err) {
  bdd.dl(url, {code: code}, function (err, info) {
    console.log(err, info);
  }, function (percentage, speed) {
    console.log(percentage, speed);
  }, function (err, status) {
    console.log('dl fin', status, err);
  });
});
