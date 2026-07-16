module.exports = function badRequest() {
  var res = this.res;
  var result = EnvelopeService.normalize(arguments, EnvelopeService.CODE.BAD_REQUEST, 'BAD_REQUEST');

  res.status(200);
  return res.jsonx(EnvelopeService.format(result.code, result.message, result.data));
};
