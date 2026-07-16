module.exports = {
  create: async function (req, res) {
    try {
      const data = await OfficerPocketService.create(
        req.body || {},
        req.info.user,
      );
      return res.ok(EnvelopeService.CODE.OK, "OFFICER_POCKET_CREATED", data);
    } catch (err) {
      return EnvelopeService.handleError(
        res,
        err,
        "OFFICER_POCKET_CREATE_FAILED",
      );
    }
  },

  list: async function (req, res) {
    try {
      const data = await OfficerPocketService.list(req.body || {});
      return res.ok(EnvelopeService.CODE.OK, "OFFICER_POCKETS_LISTED", data);
    } catch (err) {
      return EnvelopeService.handleError(
        res,
        err,
        "OFFICER_POCKETS_LIST_FAILED",
      );
    }
  },

  detail: async function (req, res) {
    try {
      const data = await OfficerPocketService.detail(req.body || {});
      return res.ok(EnvelopeService.CODE.OK, "OFFICER_POCKET_DETAIL", data);
    } catch (err) {
      return EnvelopeService.handleError(
        res,
        err,
        "OFFICER_POCKET_DETAIL_FAILED",
      );
    }
  },

  lock: async function (req, res) {
    try {
      const data = await OfficerPocketService.changeStatus(
        req.body || {},
        req.info.user,
        "locked",
      );
      return res.ok(EnvelopeService.CODE.OK, "POCKET_LOCKED", data);
    } catch (err) {
      return EnvelopeService.handleError(res, err, "POCKET_LOCK_FAILED");
    }
  },

  unlock: async function (req, res) {
    try {
      const data = await OfficerPocketService.changeStatus(
        req.body || {},
        req.info.user,
        "active",
      );
      return res.ok(EnvelopeService.CODE.OK, "POCKET_UNLOCKED", data);
    } catch (err) {
      return EnvelopeService.handleError(res, err, "POCKET_UNLOCK_FAILED");
    }
  },
};
