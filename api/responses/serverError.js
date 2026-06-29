module.exports = function serverError() {
  var res = this.res;
  var result = EnvelopeService.normalize(arguments, EnvelopeService.CODE.SERVER_ERROR, 'SERVER_ERROR');

  res.status(200);
  return res.jsonx(EnvelopeService.format(result.code, result.message, result.data));
};
