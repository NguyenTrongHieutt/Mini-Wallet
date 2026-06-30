module.exports = {
  STEP: {
    REQUEST: 1,
    CONFIRM: 2,
    VERIFY: 3,
  },

  routeProcess: async function (transInput) {
    switch (Number(transInput.TRANSTEP)) {
      case this.STEP.REQUEST:
        return RuntimeProcessService.processRequestStep(transInput);
      case this.STEP.CONFIRM:
        return RuntimeProcessService.processConfirmStep(transInput);
      default:
        throw AppErrorService.create(
          EnvelopeService.CODE.BAD_REQUEST,
          "UNSUPPORTED_VALIDATION_RULE"
        );
    }
  },

  buildMessage: async function (transInput) {
    return TransactionTrail.buildMessage(transInput);
  },
};
