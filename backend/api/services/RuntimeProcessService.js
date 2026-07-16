var DOMAIN = require("../../config/domain").domain;

module.exports = {
  processRequestStep: async function (transInput) {
    const message = await NeonMessageService.buildMessage(transInput);
    const service = await ServiceRuntimeService.loadActiveById(
      message.trail.serviceId,
    );

    try {
      const transBody = await ServiceRuntimeService.buildTransactionFields(
        service,
        message.transInput,
        message.trail,
      );
      await TransactionFieldValidationService.validateFields(
        service,
        transBody,
      );
      await ServiceRuntimeService.runRequestAction(service, transBody);
      ServiceRuntimeService.calculateFee(service, transBody);
      await TransactionValidationService.validateTransaction(
        service,
        transBody,
      );

      const updatedTrail = await TransactionTrail.updateDraft(
        message.trail,
        message.transInput,
        transBody,
      );

      return ServiceRuntimeService.buildPreview(
        updatedTrail,
        service,
        transBody,
      );
    } catch (err) {
      if (!message.isEdit) {
        await TransactionTrail.markFailed(
          message.trail,
          err,
          DOMAIN.status.INIT,
        );
      }
      throw err;
    }
  },

  processConfirmStep: async function (transInput) {
    const message = await NeonMessageService.buildMessage(transInput);
    const service = await ServiceRuntimeService.loadActiveById(
      message.trail.serviceId,
    );
    const transBody = message.TRANSBODY || {};
    let lockedPending = false;
    try {
      const pendingTrail = await TransactionTrail.lockPending(
        message.trail,
        transBody,
      );
      lockedPending = true;
      await ServiceRuntimeService.runConfirmAction(service, transBody);
      const updatedTrail = await TransactionTrail.updatePendingOutput(
        pendingTrail,
        transBody,
      );

      return ServiceRuntimeService.buildConfirmResult(updatedTrail, service);
    } catch (err) {
      if (lockedPending) {
        await TransactionTrail.markFailed(
          message.trail,
          err,
          DOMAIN.status.PENDING,
        );
      }
      throw err;
    }
  },

  processVerifyStep: async function (transInput) {
    const message = await NeonMessageService.buildMessage(transInput);
    const service = await ServiceRuntimeService.loadActiveById(
      message.trail.serviceId,
    );
    const transBody = message.TRANSBODY || {};
    let lockedPocket = null;

    try {
      lockedPocket = await Pocket.validateStateAndLockPocket(
        transBody.SENDERID,
        message.trail.id,
      );
      await TransactionTrail.checkStatusTrail(message.trail.id);
      ServiceRuntimeService.verifyAuth(service, message.transInput);
      await TransactionFieldValidationService.validateFields(
        service,
        transBody,
      );
      ServiceRuntimeService.calculateFee(service, transBody);
      await TransactionValidationService.validateTransaction(
        service,
        transBody,
      );

      const definition = await TransDefinition.loadActiveByService(service);
      const currency = await Currency.loadActive(
        transBody.CURRENCY || MiniWalletConfigService.wallet().defaultCurrency,
      );
      const glSteps = ServiceRuntimeService.sortByOrder(
        definition.glSteps || [],
      );
      let receipt;

      try {
        receipt = await MongoTransactionExecutorService.withTransaction(
          async function (connection) {
            const repository = LedgerRepositoryService.create(connection);
            for (let i = 0; i < glSteps.length; i += 1) {
              const step = glSteps[i];
              await settleLedgerStep(
                repository,
                step,
                transBody,
                message.trail.id,
                currency.id,
              );
            }

            const transaction = await repository.insertTransaction(
              buildTransaction(
                message.trail.id,
                service,
                transBody,
                currency.id,
              ),
            );

            await ServiceRuntimeService.runVerifyAction(service, transBody);

            const updatedTrail = await repository.completeTrail(
              message.trail.id,
              transBody,
              getActor(transBody),
            );
            if (!updatedTrail) {
              throw AppErrorService.create(
                EnvelopeService.CODE.INVALID_STATE,
                "TRANSACTION_TRAIL_NOT_PENDING",
              );
            }

            return {
              trail: updatedTrail,
              transaction: transaction,
              message: transaction.message,
              currency: currency,
            };
          },
        );
      } catch (err) {
        let reportedError = err;
        if (MongoTransactionExecutorService.isTransactionUnavailable(err)) {
          reportedError = AppErrorService.create(
            EnvelopeService.CODE.INVALID_STATE,
            "MONGO_TRANSACTION_UNAVAILABLE",
            { message: err && err.message ? err.message : "" },
          );
        }

        await TransactionTrail.markFailed(
          message.trail,
          reportedError,
          DOMAIN.status.PENDING,
        );
        throw reportedError;
      } finally {
        await Pocket.releaseLockedPocket(lockedPocket, message.trail.id);
        lockedPocket = null;
      }

      return ServiceRuntimeService.buildReceipt(receipt, service);
    } catch (err) {
      if (lockedPocket) {
        await Pocket.releaseLockedPocket(lockedPocket, message.trail.id);
      }

      throw err;
    }
  },
};

async function settleLedgerStep(
  repository,
  step,
  transBody,
  transRefId,
  currencyId,
) {
  const amount = Number(transBody[step.amount]);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "LEDGER_AMOUNT_INVALID",
      { stepOrder: step.order, amountField: step.amount },
    );
  }

  const targets = resolveLedgerTargets(step, transBody);
  const debitPocket = await loadLedgerPocket(
    repository,
    targets.debitPocketId,
    "DEBIT_POCKET_NOT_FOUND",
    "DEBIT_POCKET_CHECKSUM_INVALID",
  );
  const creditPocket = await loadLedgerPocket(
    repository,
    targets.creditPocketId,
    "CREDIT_POCKET_NOT_FOUND",
    "CREDIT_POCKET_CHECKSUM_INVALID",
  );
  const debited = await repository.debitPocket(debitPocket, amount);
  if (!debited) {
    throw AppErrorService.create(
      EnvelopeService.CODE.INVALID_STATE,
      "INSUFFICIENT_BALANCE",
      { pocketId: debitPocket.id, amount: amount },
    );
  }

  const credited = await repository.creditPocket(creditPocket, amount);
  if (!credited) {
    throw AppErrorService.create(
      EnvelopeService.CODE.INVALID_STATE,
      "POCKET_UPDATE_FAILED",
      { pocketId: creditPocket.id },
    );
  }

  const now = new Date();
  await repository.insertPocketEntry({
    transRefId: transRefId,
    stepOrder: Number(step.order || 0),
    debitPocketId: debitPocket.id,
    creditPocketId: creditPocket.id,
    amount: amount,
    currency: currencyId,
    status: DOMAIN.status.SETTLED,
    createdBy: getActor(transBody),
    updatedBy: getActor(transBody),
    createdAt: now,
    updatedAt: now,
  });
}

function resolveLedgerTargets(step, transBody) {
  const debitPocketId = resolveLedgerTarget(step.debit, transBody);
  const creditPocketId = resolveLedgerTarget(step.credit, transBody);

  if (!debitPocketId || !creditPocketId) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "UNSUPPORTED_LEDGER_TARGET",
      { step: step },
    );
  }

  return {
    debitPocketId: debitPocketId,
    creditPocketId: creditPocketId,
  };
}

function resolveLedgerTarget(target, transBody) {
  if (target && target.level === DOMAIN.ledgerLevel.WALLET) {
    return target.target;
  }

  if (target && target.level === DOMAIN.ledgerLevel.PRODUCT) {
    return transBody[target.target];
  }

  return null;
}

async function loadLedgerPocket(
  repository,
  pocketId,
  notFoundCode,
  checksumCode,
) {
  const pocket = await repository.findPocket(pocketId);
  if (!pocket) {
    throw AppErrorService.create(
      EnvelopeService.CODE.NOT_FOUND,
      notFoundCode,
    );
  }

  Pocket.validateChecksum(pocket, checksumCode);
  if (pocket.status === DOMAIN.status.INACTIVE) {
    throw AppErrorService.create(
      EnvelopeService.CODE.INVALID_STATE,
      "POCKET_NOT_ACTIVE",
      { pocketId: pocketId, status: pocket.status },
    );
  }

  return pocket;
}

function buildTransaction(transRefId, service, transBody, currencyId) {
  const now = new Date();
  return {
    code: "TXN" + Date.now() + String(transRefId).slice(-6),
    serviceId: String(service.id),
    transRefId: transRefId,
    senderCustomer: transBody.USERID,
    receiverCustomer: transBody.RECEIVERCUSTOMERID,
    receiverProvider: transBody.PROVIDERID,
    amount: Number(transBody.AMOUNT),
    fee: Number(transBody.DEBITFEE || 0),
    totalAmount: Number(transBody.TOTALAMOUNT),
    currency: currencyId,
    message: transBody.MESSAGE || transBody.message,
    status: DOMAIN.status.DONE,
    createdBy: getActor(transBody),
    updatedBy: getActor(transBody),
    createdAt: now,
    updatedAt: now,
  };
}

function getActor(transBody) {
  return transBody.USERID || transBody.OFFICERID;
}
