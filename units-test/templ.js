
var fs = require('fs');
var Template = require('./units/util/template');

//it will get from user upload
fs.readFile('./units-test/FSN2014 00.ass', function (err, data) {

var templ = new Template('FSN2014', 0, 'fate ubw00 720p.mp4', data);
templ.list(function (err, lists) {
  console.log(lists);
});

templ.init(function (err, succeed) {
  if (err) {
    console.log(err);
    return;
  }
  /*templ.run(function (err, outfile) {
    if (err) {
      console.log(err);
      return;
    }
    console.log(succeed);
  });*/
  console.log(templ.options);
});

});
