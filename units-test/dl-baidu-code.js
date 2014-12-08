
var sys_config = require('./config').sys;
var BaiduDownloader = require('./units/downloader/baidu');

var bdd = new BaiduDownloader();
//var url = 'http://pan.baidu.com/s/1hIzim';
var url = 'http://pan.baidu.com/s/1jGvF3Um';
var code = 'tf2o';
bdd.init(function (err) {
  bdd.dl(url, {code: code}, function (err, info) {
    console.log(err, info);
  }, function (percentage, speed) {
    console.log(percentage, speed);
  }, function (err, status) {
    console.log('dl fin', status, err);
  });
});
