
//exports.BTSiteBase = require('./base');
var btsites_config = require('./../../config').bt_sites;

var BTSiteDmhy = require('./dmhy'),
  BTSiteKtxp = require('./ktxp'),
  BTSitePopgo = require('./popgo'),
  BTSiteCamoe = require('./camoe'),
  BTSiteAcgrip = require('./acgrip'),
  BTSiteBangumi = require('./bangumi');

var BTSite = function (site, user_id, category) {
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
    case 'acgrip':
      bts = new BTSiteAcgrip(opts);
      break;
    case 'bangumi':
      bts = new BTSiteBangumi(opts);
      break;
  }
  if (bts) {
    if (category) {
      bts.setCategory(category);
    }
    if (user_id) {
      bts.setUserId(user_id);
    }
  }
  return bts;
};

exports.BTSite = BTSite;
