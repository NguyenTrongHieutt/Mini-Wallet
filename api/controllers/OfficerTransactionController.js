module.exports = {
  list: async function (req, res) {
    try {
      const data = await TransactionQueryService.listOfficerTransactions(req.body || {});
      return res.ok(EnvelopeService.CODE.OK, "OFFICER_TRANSACTIONS_LISTED", data);
    } catch (err) {
      return EnvelopeService.handleError(res, err, "OFFICER_TRANSACTIONS_LIST_FAILED");
    }
  },

  detail: async function (req, res) {
    try {
      const data = await TransactionQueryService.getOfficerTransactionDetail(req.body || {});
      return res.ok(EnvelopeService.CODE.OK, "OFFICER_TRANSACTION_DETAIL", data);
    } catch (err) {
      return EnvelopeService.handleError(res, err, "OFFICER_TRANSACTION_DETAIL_FAILED");
    }
  },
};
