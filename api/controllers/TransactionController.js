module.exports = {
  request: async function (req, res) {
    try {
      const data = await TransactionService.engineRequestTransaction(req.body, req.info);
      return res.ok(EnvelopeService.CODE.OK, "TRANSACTION_REQUESTED", data);
    } catch (err) {
      return EnvelopeService.handleError(res, err, "TRANSACTION_REQUEST_FAILED");
    }
  },

  confirm: async function (req, res) {
    try {
      const data = await TransactionService.engineConfirmTransaction(req.body, req.info);
      return res.ok(EnvelopeService.CODE.OK, "TRANSACTION_CONFIRMED", data);
    } catch (err) {
      return EnvelopeService.handleError(res, err, "TRANSACTION_CONFIRM_FAILED");
    }
  },
};
