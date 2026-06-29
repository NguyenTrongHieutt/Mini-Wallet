module.exports = {
  processRequestStep: async function (transInput) {
    const message = await NeonMessageService.buildMessage(transInput);
    const service = await Service.loadActiveById(message.trail.serviceId);

    try {
      const transBody = await Service.buildTransactionFields(
        service,
        message.transInput,
        message.trail
      );

      await TransField.validateFields(service, transBody);
      await Service.runRequestAction(service, transBody);
      Service.calculateFee(service, transBody);
      await TransValidation.validateTransaction(service, transBody);

      const updatedTrail = await TransactionTrail.updatePending(message.trail, transBody);

      return Service.buildPreview(updatedTrail, service, transBody);
    } catch (err) {
      await TransactionTrail.markFailed(message.trail, err);
      throw err;
    }
  },
};
