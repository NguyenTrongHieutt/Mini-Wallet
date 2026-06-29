module.exports = function sendError() {
  var res = this.res;
  var result = EnvelopeService.normalize(arguments, EnvelopeService.CODE.SERVER_ERROR, 'ERROR');

  res.status(200);
  return res.jsonx(EnvelopeService.format(result.code, result.message, result.data));
};
