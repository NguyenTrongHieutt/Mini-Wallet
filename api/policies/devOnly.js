module.exports = function (req, res, next) {
  if (sails.config.environment === "production") {
    return res.error(EnvelopeService.CODE.FORBIDDEN, "DEV_API_DISABLED");
  }
  return next();
};
