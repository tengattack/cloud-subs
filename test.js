
var fs = require('fs');

if (process.argv.length <= 2) {
  console.log('not found test module.');
} else {
  require('./units-test/' + process.argv[2]);
}
