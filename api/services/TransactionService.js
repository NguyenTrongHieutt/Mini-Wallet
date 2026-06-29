module.exports = {
  engineRequestTransaction: async function (body, info) {
    const transInput = this.normalizeInput(body, info);
    transInput.TRANSTEP = NeonMessageService.STEP.REQUEST;

    return NeonMessageService.routeProcess(transInput);
  },

  normalizeInput: function (body, info) {
    body = body || {};
    info = info || {};

    return {
      body: {
        serviceCode: this.cleanString(body.serviceCode).toUpperCase(),
        receiverPhone: this.cleanString(body.receiverPhone),
        amount: body.amount,
        currency: this.cleanString(body.currency || "VND").toUpperCase(),
        message: this.cleanString(body.message),
      },
      user: info.user,
      userType: info.userType,
    };
  },

  cleanString: function (value) {
    if (value === undefined || value === null) {
      return "";
    }

    return String(value).trim();
  },
};
