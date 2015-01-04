
//exports.BTSiteBase = require('./base');
var btsites_config = require('./../../config').bt_sites;

var BTSiteDmhy = require('./dmhy'),
  BTSiteKtxp = require('./ktxp'),
  BTSitePopgo = require('./popgo'),
  BTSiteCamoe = require('./camoe'),
  BTSiteBangumi = require('./bangumi');

var BTSite = function (site, user_id) {
  var bts = null;
  var opts = (btsites_config && btsites_config.options) ? btsites_config.options[site] : null;
  switch (site) {
    case 'dmhy':
      bts = new BTSiteDmhy(opts);
      break;
    case 'ktxp':
      bts = new BTSiteKtxp(opts);
      break;
    case 'popgo':
      bts = new BTSitePopgo(opts);
      break;
    case 'camoe':
      bts = new BTSiteCamoe(opts);
      break;
    case 'bangumi':
      bts = new BTSiteBangumi(opts);
      break;
  }
  if (bts) bts.setUserId(user_id);
  return bts;
};

exports.BTSite = BTSite;