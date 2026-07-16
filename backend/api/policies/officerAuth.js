var DOMAIN = require("../../config/domain").domain;

module.exports = function(req, res, next) {
  return require('./bearerAuth')(req, res, function() {
    if (req.info.userType !== DOMAIN.userType.OFFICER) {
      return res.error(EnvelopeService.CODE.FORBIDDEN, 'OFFICER_PERMISSION_REQUIRED');
    }

    return next();
  });
};
