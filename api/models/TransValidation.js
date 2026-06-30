module.exports = {
  attributes: {
    service: {
      type: "string",
      required: true,
      index: true,
    },
    validateFunc: {
      type: "string",
      required: true,
    },
    validateFields: {
      type: "string",
      required: true,
    },
    order: {
      type: "integer",
      required: true,
    },
    errorCode: {
      type: "string",
    },
    status: {
      type: "string",
      enum: ["active", "inactive"],
      defaultsTo: "active",
      required: true,
      index: true,
    },
    createdBy: {
      type: "string",
    },
    updatedBy: {
      type: "string",
    },
  },

  validateTransaction: async function (service, transBody) {
    const validations = Service.sortByOrder(
      await TransValidation.find({
        service: String(service.id),
        status: "active",
      }),
    );

    for (let i = 0; i < validations.length; i += 1) {
      await runValidation(validations[i], transBody);
    }
  },
};

async function runValidation(validation, transBody) {
  if (validation.validateFunc === "validateReceiverIsNotSender") {
    return validateReceiverIsNotSender(validation, transBody);
  }

  if (validation.validateFunc === "validateSenderAccountSufficiency") {
    return validateSenderAccountSufficiency(validation, transBody);
  }

  throw AppErrorService.create(
    EnvelopeService.CODE.BAD_REQUEST,
    "UNSUPPORTED_VALIDATION_RULE",
    { validateFunc: validation.validateFunc },
  );
}

async function validateReceiverIsNotSender(validation, transBody) {
  if (String(transBody.SENDERID) === String(transBody.RECEIVERID)) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      validation.errorCode || "SELF_TRANSFER",
    );
  }
}

async function validateSenderAccountSufficiency(validation, transBody) {
  const senderPocket = await Pocket.findOne({
    id: transBody.SENDERID,
  });

  if (
    !senderPocket ||
    ["active", "locked"].indexOf(senderPocket.status) === -1
  ) {
    throw AppErrorService.create(
      EnvelopeService.CODE.NOT_FOUND,
      "SENDER_POCKET_NOT_FOUND",
    );
  }

  if (Number(senderPocket.balance) < Number(transBody.TOTALAMOUNT)) {
    throw AppErrorService.create(
      EnvelopeService.CODE.INVALID_STATE,
      validation.errorCode || "INSUFFICIENT_BALANCE",
      {
        balance: senderPocket.balance,
        totalAmount: transBody.TOTALAMOUNT,
      },
    );
  }
}
