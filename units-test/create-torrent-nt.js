
var fs = require('fs');
var nt = require('nt');

var rs = nt.make('http://tracker.publicbt.com:80/announce', './', ['app.js'], {
  announceList: [
    [ new Buffer('http://open.nyaatorrents.info:6544/announce') ],
    [ new Buffer('http://tracker.openbittorrent.com:80/announce') ],
    [ new Buffer('http://tracker.publicbt.com:80/announce') ],
    [ new Buffer('udp://tracker.openbittorrent.com:80/announce') ],
    [ new Buffer('http://www.mp4mkv.org/1b/announce.php') ],
    [ new Buffer('http://www.mp4mkv.org:2710/announce') ],
    [ new Buffer('http://tracker.ktxp.com:6868/announce') ],
    [ new Buffer('http://tracker.ktxp.com:7070/announce') ],
    [ new Buffer('http://t2.popgo.org:7456/annonce') ],
    [ new Buffer('http://bt.sc-ol.com:2710/announce') ],
    [ new Buffer('http://share.camoe.cn:8080/announce') ],
    [ new Buffer('http://tracker.prq.to/announce') ],
    [ new Buffer('http://61.154.116.205:8000/announce') ],
    [ new Buffer('http://bt.rghost.net:80/announce') ],
    [ new Buffer('http://bt.edwardk.info:4040/announce') ],
    [ new Buffer('http://208.67.16.113:8000/annonuce') ],
    [ new Buffer('udp://208.67.16.113:8000/annonuce') ],
  ],
  comment: 'KNA Cloud Service',
}, function (err, torrent) {
  console.log(err, torrent);
});
rs.pipe(fs.createWriteStream('mytorrent.torrent'));
