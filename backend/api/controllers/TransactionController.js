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

  verify: async function (req, res) {
    try {
      const data = await TransactionService.engineVerifyTransaction(req.body, req.info);
      return res.ok(EnvelopeService.CODE.OK, "TRANSACTION_VERIFIED", data);
    } catch (err) {
      return EnvelopeService.handleError(res, err, "TRANSACTION_VERIFY_FAILED");
    }
  },

  trigger: async function (req, res) {
    try {
      const data = await TransactionOrchestratorService.trigger(
        req.body || {},
        req.info,
      );
      return res.ok(EnvelopeService.CODE.OK, "TRANSACTION_TRIGGERED", data);
    } catch (err) {
      return EnvelopeService.handleError(res, err, "TRANSACTION_TRIGGER_FAILED");
    }
  },
};
