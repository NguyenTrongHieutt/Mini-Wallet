module.exports = function forbidden() {
  var res = this.res;
  var result = EnvelopeService.normalize(arguments, EnvelopeService.CODE.FORBIDDEN, 'FORBIDDEN');

  res.status(200);
  return res.jsonx(EnvelopeService.format(result.code, result.message, result.data));
};
