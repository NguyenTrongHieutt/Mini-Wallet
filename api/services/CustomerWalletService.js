module.exports = {
  getBalance: async function (customer, body) {
    body = CommonService.isPlainObject(body) ? body : {};

    const customerId = customer && customer.id
      ? String(customer.id)
      : "";
    if (!customerId) {
      throw AppErrorService.create(
        EnvelopeService.CODE.UNAUTHORIZED,
        "UNAUTHENTICATED",
      );
    }

    const requestedCurrency = CommonService.cleanString(body.currency);
    const currencyCode = (requestedCurrency || "VND").toUpperCase();
    if (!/^[A-Z]{3}$/.test(currencyCode)) {
      throw AppErrorService.create(
        EnvelopeService.CODE.BAD_REQUEST,
        "CURRENCY_FORMAT_INVALID",
      );
    }

    const currency = await Currency.loadActive(currencyCode);
    const pocket = await Pocket.findOne({
      ownerType: "customer",
      ownerId: customerId,
      currency: currency.id,
    });

    if (!pocket) {
      throw AppErrorService.create(
        EnvelopeService.CODE.NOT_FOUND,
        "CUSTOMER_WALLET_NOT_FOUND",
      );
    }

    Pocket.validateChecksum(pocket, "POCKET_CHECKSUM_INVALID");

    return {
      pocket: AuthService.publicPocket(pocket, currency),
    };
  },
};
