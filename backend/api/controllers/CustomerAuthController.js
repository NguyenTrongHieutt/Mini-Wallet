module.exports = {
  register: async function (req, res) {
    try {
      const result = await AuthService.registerCustomer(req.body);
      AuthService.setAuthCookie(res, result.token);
      return res.ok(EnvelopeService.CODE.OK, "CUSTOMER_REGISTERED", result.data);
    } catch (err) {
      return EnvelopeService.handleError(res, err, "REGISTER_FAILED");
    }
  },

  login: async function (req, res) {
    try {
      const result = await AuthService.loginCustomer(req.body);
      AuthService.setAuthCookie(res, result.token);
      return res.ok(EnvelopeService.CODE.OK, "LOGIN_SUCCESS", result.data);
    } catch (err) {
      return EnvelopeService.handleError(res, err, "LOGIN_FAILED");
    }
  },

  logout: async function (req, res) {
    try {
      const data = await AuthService.logout(req.info);
      AuthService.clearAuthCookie(res);
      return res.ok(EnvelopeService.CODE.OK, "LOGOUT_SUCCESS", data);
    } catch (err) {
      return EnvelopeService.handleError(res, err, "LOGOUT_FAILED");
    }
  },
};
