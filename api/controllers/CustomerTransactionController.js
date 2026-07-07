module.exports = {
  list: async function (req, res) {
    try {
      const data = await TransactionQueryService.listCustomerTransactions(
        req.info.user,
        req.body || {},
      );

      return res.ok(EnvelopeService.CODE.OK, "CUSTOMER_TRANSACTIONS_LISTED", data);
    } catch (err) {
      return EnvelopeService.handleError(res, err, "CUSTOMER_TRANSACTIONS_LIST_FAILED");
    }
  },

  detail: async function (req, res) {
    try {
      const data = await TransactionQueryService.getCustomerTransactionDetail(
        req.info.user,
        req.body || {},
      );

      return res.ok(EnvelopeService.CODE.OK, "CUSTOMER_TRANSACTION_DETAIL", data);
    } catch (err) {
      return EnvelopeService.handleError(res, err, "CUSTOMER_TRANSACTION_DETAIL_FAILED");
    }
  },
};
