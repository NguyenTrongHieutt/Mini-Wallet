module.exports = function(req, res, next) {
  return require('./bearerAuth')(req, res, function() {
    if (req.info.userType !== 'officer') {
      return res.error(EnvelopeService.CODE.FORBIDDEN, 'OFFICER_PERMISSION_REQUIRED');
    }

    return next();
  });
};
