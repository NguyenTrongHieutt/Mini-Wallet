module.exports = {
  create: async function (req, res) {
    try {
      const data = await OfficerProviderService.create(
        req.body || {},
        req.info.user,
      );
      return res.ok(EnvelopeService.CODE.OK, "OFFICER_PROVIDER_CREATED", data);
    } catch (err) {
      return EnvelopeService.handleError(
        res,
        err,
        "OFFICER_PROVIDER_CREATE_FAILED",
      );
    }
  },

  list: async function (req, res) {
    try {
      const data = await OfficerProviderService.list(req.body || {});
      return res.ok(EnvelopeService.CODE.OK, "OFFICER_PROVIDERS_LISTED", data);
    } catch (err) {
      return EnvelopeService.handleError(
        res,
        err,
        "OFFICER_PROVIDERS_LIST_FAILED",
      );
    }
  },

  detail: async function (req, res) {
    try {
      const data = await OfficerProviderService.detail(req.body || {});
      return res.ok(EnvelopeService.CODE.OK, "OFFICER_PROVIDER_DETAIL", data);
    } catch (err) {
      return EnvelopeService.handleError(
        res,
        err,
        "OFFICER_PROVIDER_DETAIL_FAILED",
      );
    }
  },

  update: async function (req, res) {
    try {
      const data = await OfficerProviderService.update(
        req.body || {},
        req.info.user,
      );
      return res.ok(EnvelopeService.CODE.OK, "OFFICER_PROVIDER_UPDATED", data);
    } catch (err) {
      return EnvelopeService.handleError(
        res,
        err,
        "OFFICER_PROVIDER_UPDATE_FAILED",
      );
    }
  },

  activate: async function (req, res) {
    return changeStatus(req, res, "active");
  },

  deactivate: async function (req, res) {
    return changeStatus(req, res, "inactive");
  },
};

async function changeStatus(req, res, targetStatus) {
  const isActive = targetStatus === "active";
  try {
    const data = await OfficerProviderService.changeStatus(
      req.body || {},
      req.info.user,
      targetStatus,
    );
    return res.ok(
      EnvelopeService.CODE.OK,
      isActive ? "PROVIDER_ACTIVATED" : "PROVIDER_DEACTIVATED",
      data,
    );
  } catch (err) {
    return EnvelopeService.handleError(
      res,
      err,
      isActive ? "PROVIDER_ACTIVATE_FAILED" : "PROVIDER_DEACTIVATE_FAILED",
    );
  }
}
