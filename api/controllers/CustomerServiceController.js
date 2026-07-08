module.exports = {
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
