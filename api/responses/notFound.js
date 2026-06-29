module.exports = function notFound() {
  var res = this.res;
  var result = EnvelopeService.normalize(arguments, EnvelopeService.CODE.NOT_FOUND, 'NOT_FOUND');

  res.status(200);
  return res.jsonx(EnvelopeService.format(result.code, result.message, result.data));
};
