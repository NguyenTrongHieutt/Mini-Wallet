module.exports = {
  me: async function (req, res) {
    return res.ok(EnvelopeService.CODE.OK, "OFFICER_PROFILE", {
      officer: AuthService.publicUser(req.info.user),
    });
  },
};
