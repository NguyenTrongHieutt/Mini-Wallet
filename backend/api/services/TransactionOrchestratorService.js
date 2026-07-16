module.exports = {
  trigger: async function (body, info) {
    body = CommonService.isPlainObject(body) ? body : {};

    const requestBody = Object.assign({}, body);
    const preview = await TransactionService.engineRequestTransaction(
      requestBody,
      info,
    );

    const transRefId = preview && preview.transRefId;
    if (!transRefId) {
      throw AppErrorService.create(
        EnvelopeService.CODE.SERVER_ERROR,
        "TRANSACTION_TRIGGER_REFERENCE_MISSING",
      );
    }

    const nextBody = Object.assign({}, body, { transRefId: transRefId });
    const confirmation = await TransactionService.engineConfirmTransaction(
      nextBody,
      info,
    );
    const receipt = await TransactionService.engineVerifyTransaction(
      nextBody,
      info,
    );

    return {
      transRefId: transRefId,
      preview: preview,
      confirmation: confirmation,
      receipt: receipt,
    };
  },
};
