module.exports = {
  list: async function (req, res) {
    try {
      const data = await ServiceInputFieldService.listActiveServices(
        req.body || {},
      );

      return res.ok(EnvelopeService.CODE.OK, "CUSTOMER_SERVICES_LISTED", data);
    } catch (err) {
      return EnvelopeService.handleError(
        res,
        err,
        "CUSTOMER_SERVICES_LIST_FAILED",
      );
    }
  },

  providers: async function (req, res) {
    try {
      const data = await ServiceInputFieldService.listActiveProviders(
        req.body || {},
      );

      return res.ok(EnvelopeService.CODE.OK, "CUSTOMER_PROVIDERS_LISTED", data);
    } catch (err) {
      return EnvelopeService.handleError(
        res,
        err,
        "CUSTOMER_PROVIDERS_LIST_FAILED",
      );
    }
  },

  inputFields: async function (req, res) {
    try {
      const data = await ServiceInputFieldService.getRequestInputFields(
        req.body || {},
      );

      return res.ok(EnvelopeService.CODE.OK, "SERVICE_INPUT_FIELDS", data);
    } catch (err) {
      return EnvelopeService.handleError(
        res,
        err,
        "SERVICE_INPUT_FIELDS_FAILED",
      );
    }
  },
};
