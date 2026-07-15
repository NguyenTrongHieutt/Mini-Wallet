module.exports = {
  list: async function (req, res) {
    try {
      const data = await OfficerTrailService.list(req.body || {});
      return res.ok(EnvelopeService.CODE.OK, "OFFICER_TRAILS_LISTED", data);
    } catch (err) {
      return EnvelopeService.handleError(res, err, "OFFICER_TRAILS_LIST_FAILED");
    }
  },

  detail: async function (req, res) {
    try {
      const data = await OfficerTrailService.detail(req.body || {});
      return res.ok(EnvelopeService.CODE.OK, "OFFICER_TRAIL_DETAIL", data);
    } catch (err) {
      return EnvelopeService.handleError(res, err, "OFFICER_TRAIL_DETAIL_FAILED");
    }
  },
};
