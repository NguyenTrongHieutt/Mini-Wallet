module.exports = function sendOK() {
  var res = this.res;
  var result = EnvelopeService.normalize(arguments, EnvelopeService.CODE.OK, 'OK');

  res.status(200);
  return res.jsonx(EnvelopeService.format(result.code, result.message, result.data));
};
