module.exports = {
  createBill: async function (req, res) {
    try {
      const data = await MockBillerService.createBill(req.body || {});
      return res.ok(EnvelopeService.CODE.OK, "MOCK_BILL_CREATED", data);
    } catch (err) {
      return EnvelopeService.handleError(res, err, "MOCK_BILL_CREATE_FAILED");
    }
  },

  inquiry: async function (req, res) {
    try {
      const data = await MockBillerService.inquiry(req.body || {});
      return res.ok(EnvelopeService.CODE.OK, "MOCK_BILL_INQUIRY_SUCCESS", data);
    } catch (err) {
      return EnvelopeService.handleError(res, err, "MOCK_BILL_INQUIRY_FAILED");
    }
  },

  payment: async function (req, res) {
    try {
      const data = await MockBillerService.payment(req.body || {});
      return res.ok(EnvelopeService.CODE.OK, "MOCK_BILL_PAYMENT_SUCCESS", data);
    } catch (err) {
      return EnvelopeService.handleError(res, err, "MOCK_BILL_PAYMENT_FAILED");
    }
  },
};
