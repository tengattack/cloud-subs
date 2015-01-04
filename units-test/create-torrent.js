
var sys_config = require('./../config').sys;
var BtDownloader = require('./../units/downloader/bt');

var datafile = sys_config.root_dir + 'test／stay.txt';
var torrentfile = datafile + '.torrent';

var btd = new BtDownloader();
btd.createTorrent(datafile, torrentfile, function (err, stdout) {
if (err) {
  console.log(err);
  return;
}
console.log(stdout);
});