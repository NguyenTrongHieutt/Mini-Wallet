module.exports = async function(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.indexOf('Bearer ') === 0
      ? header.slice(7)
      : (req.cookies && req.cookies[AuthService.AUTH_COOKIE_NAME]) || req.param('token');

    if (!token) {
      return res.error(EnvelopeService.CODE.UNAUTHORIZED, 'REQUIRED_AUTH_TOKEN');
    }

    let payload;
    try {
      payload = JwtService.verify(token);
    } catch (err) {
      return res.error(EnvelopeService.CODE.UNAUTHORIZED, 'INVALID_TOKEN');
    }

    const session = await Session.findOne({
      tokenHash: CryptoService.hashToken(token),
      status: 'active'
    });

    if (!session || new Date(session.expiredAt).getTime() <= Date.now()) {
      return res.error(EnvelopeService.CODE.UNAUTHORIZED, 'INVALID_TOKEN');
    }

    if (String(session.userId) !== String(payload.userId) || session.userType !== payload.userType) {
      return res.error(EnvelopeService.CODE.UNAUTHORIZED, 'INVALID_TOKEN');
    }

    const model = session.userType === 'officer' ? Officer : Customer;
    const user = await model.findOne({ id: session.userId });

    if (!user || user.status !== 'active') {
      return res.error(EnvelopeService.CODE.UNAUTHORIZED, 'USER_NOT_ACTIVE');
    }

    req.info = req.info || {};
    req.info.user = user;
    req.info.userType = session.userType;
    req.info.sessionId = session.id;

    await Session.update({ id: session.id }, { lastUsedAt: new Date() });
    return next();
  } catch (err) {
    sails.log.error(err);
    return res.error('AUTHENTICATION_FAILED');
  }
};
