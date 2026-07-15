module.exports = {
  list: async function (req, res) {
    try {
      const data = await OfficerCustomerService.list(req.body || {});
      return res.ok(EnvelopeService.CODE.OK, "OFFICER_CUSTOMERS_LISTED", data);
    } catch (err) {
      return EnvelopeService.handleError(
        res,
        err,
        "OFFICER_CUSTOMERS_LIST_FAILED",
      );
    }
  },

  detail: async function (req, res) {
    try {
      const data = await OfficerCustomerService.detail(req.body || {});
      return res.ok(EnvelopeService.CODE.OK, "OFFICER_CUSTOMER_DETAIL", data);
    } catch (err) {
      return EnvelopeService.handleError(
        res,
        err,
        "OFFICER_CUSTOMER_DETAIL_FAILED",
      );
    }
  },

  lock: async function (req, res) {
    try {
      const data = await OfficerCustomerService.changeStatus(
        req.body || {},
        req.info.user,
        "locked",
      );
      return res.ok(EnvelopeService.CODE.OK, "CUSTOMER_LOCKED", data);
    } catch (err) {
      return EnvelopeService.handleError(res, err, "CUSTOMER_LOCK_FAILED");
    }
  },

  unlock: async function (req, res) {
    try {
      const data = await OfficerCustomerService.changeStatus(
        req.body || {},
        req.info.user,
        "active",
      );
      return res.ok(EnvelopeService.CODE.OK, "CUSTOMER_UNLOCKED", data);
    } catch (err) {
      return EnvelopeService.handleError(res, err, "CUSTOMER_UNLOCK_FAILED");
    }
  },
};
