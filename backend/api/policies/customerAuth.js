var DOMAIN = require("../../config/domain").domain;

module.exports = function(req, res, next) {
  return require('./bearerAuth')(req, res, function() {
    if (req.info.userType !== DOMAIN.userType.CUSTOMER) {
      return res.error(EnvelopeService.CODE.FORBIDDEN, 'CUSTOMER_PERMISSION_REQUIRED');
    }

    return next();
  });
};
