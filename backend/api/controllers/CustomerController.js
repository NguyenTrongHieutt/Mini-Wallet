module.exports = {
  me: async function (req, res) {
    try {
      return res.ok(EnvelopeService.CODE.OK, "CUSTOMER_PROFILE", {
        customer: AuthService.publicUser(req.info.user),
      });
    } catch (err) {
      return EnvelopeService.handleError(res, err, "CUSTOMER_PROFILE_FAILED");
    }
  },
};
