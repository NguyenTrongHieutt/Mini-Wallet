module.exports = {
  balance: async function (req, res) {
    try {
      const data = await CustomerWalletService.getBalance(
        req.info.user,
        req.body || {},
      );
      return res.ok(
        EnvelopeService.CODE.OK,
        "CUSTOMER_WALLET_BALANCE",
        data,
      );
    } catch (err) {
      return EnvelopeService.handleError(
        res,
        err,
        "CUSTOMER_WALLET_BALANCE_FAILED",
      );
    }
  },
};
