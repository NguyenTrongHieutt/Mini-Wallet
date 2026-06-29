module.exports = function(req, res, next) {
  return require('./bearerAuth')(req, res, function() {
    if (req.info.userType !== 'customer') {
      return res.error(EnvelopeService.CODE.FORBIDDEN, 'CUSTOMER_PERMISSION_REQUIRED');
    }

    return next();
  });
};
