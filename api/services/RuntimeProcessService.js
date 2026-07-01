module.exports = {
  processRequestStep: async function (transInput) {
    const message = await NeonMessageService.buildMessage(transInput);
    const service = await Service.loadActiveById(message.trail.serviceId);

    try {
      const transBody = await Service.buildTransactionFields(
        service,
        message.transInput,
        message.trail,
      );
      await TransField.validateFields(service, transBody);
      await Service.runRequestAction(service, transBody);
      Service.calculateFee(service, transBody);
      await TransValidation.validateTransaction(service, transBody);

      const updatedTrail = await TransactionTrail.updatePending(
        message.trail,
        transBody,
      );

      return Service.buildPreview(updatedTrail, service, transBody);
    } catch (err) {
      await TransactionTrail.markFailed(message.trail, err);
      throw err;
    }
  },

  processConfirmStep: async function (transInput) {
    const message = await NeonMessageService.buildMessage(transInput);
    const service = await Service.loadActiveById(message.trail.serviceId);
    const transBody = message.TRANSBODY || {};
    try {
      await Service.runConfirmAction(service, transBody);
      const updatedTrail = await TransactionTrail.updatePending(
        message.trail,
        transBody,
      );

      return Service.buildConfirmResult(updatedTrail, service);
    } catch (err) {
      await TransactionTrail.markFailed(message.trail, err);
      throw err;
    }
  },

  processVerifyStep: async function (transInput) {
    const message = await NeonMessageService.buildMessage(transInput);
    const service = await Service.loadActiveById(message.trail.serviceId);
    const transBody = message.TRANSBODY || {};
    let tx = null;
    let lockedPocket = null;

    try {
      lockedPocket = await Pocket.validateStateAndLockPocket(
        transBody.SENDERID,
        message.trail.id,
      );
      await TransactionTrail.checkStatusTrail(message.trail.id);
      Service.verifyAuth(service, message.transInput);
      await TransField.validateFields(service, transBody);
      Service.calculateFee(service, transBody);
      await TransValidation.validateTransaction(service, transBody);

      const definition = await TransDefinition.loadActiveByService(service);
      const currency = await Currency.loadActive(transBody.CURRENCY || "VND");
      const glSteps = Service.sortByOrder(definition.glSteps || []);
      tx = await MongoTransactionExecutorService.getConnection();
      const session = tx.client.startSession();
      tx.session = session;
      let receipt;

      try {
        await session.withTransaction(async function () {
          const entries = [];

          for (let i = 0; i < glSteps.length; i += 1) {
            const step = glSteps[i];
            const amount = Number(transBody[step.amount]);
            if (!Number.isFinite(amount) || amount <= 0) {
              throw AppErrorService.create(
                EnvelopeService.CODE.BAD_REQUEST,
                "LEDGER_AMOUNT_INVALID",
                { stepOrder: step.order, amountField: step.amount },
              );
            }

            let debitPocketId;
            let creditPocketId;
            if (step.debit && step.debit.level === "wallet") {
              debitPocketId = step.debit.target;
            } else if (step.debit && step.debit.level === "productLevel") {
              debitPocketId = transBody[step.debit.target];
            }
            if (step.credit && step.credit.level === "wallet") {
              creditPocketId = step.credit.target;
            } else if (step.credit && step.credit.level === "productLevel") {
              creditPocketId = transBody[step.credit.target];
            }

            if (!debitPocketId || !creditPocketId) {
              throw AppErrorService.create(
                EnvelopeService.CODE.BAD_REQUEST,
                "UNSUPPORTED_LEDGER_TARGET",
                { step: step },
              );
            }

            const debitPocket = await tx.collections.pockets.findOne(
              { _id: tx.toObjectId(debitPocketId) },
              { session: tx.session },
            );
            if (!debitPocket) {
              throw AppErrorService.create(
                EnvelopeService.CODE.NOT_FOUND,
                "DEBIT_POCKET_NOT_FOUND",
              );
            }
            tx.normalizeId(debitPocket);
            Pocket.validateChecksum(
              debitPocket,
              "DEBIT_POCKET_CHECKSUM_INVALID",
            );
            if (debitPocket.status === "inactive") {
              throw AppErrorService.create(
                EnvelopeService.CODE.INVALID_STATE,
                "POCKET_NOT_ACTIVE",
                { pocketId: debitPocketId, status: debitPocket.status },
              );
            }

            const creditPocket = await tx.collections.pockets.findOne(
              { _id: tx.toObjectId(creditPocketId) },
              { session: tx.session },
            );
            if (!creditPocket) {
              throw AppErrorService.create(
                EnvelopeService.CODE.NOT_FOUND,
                "CREDIT_POCKET_NOT_FOUND",
              );
            }
            tx.normalizeId(creditPocket);
            Pocket.validateChecksum(
              creditPocket,
              "CREDIT_POCKET_CHECKSUM_INVALID",
            );
            if (creditPocket.status === "inactive") {
              throw AppErrorService.create(
                EnvelopeService.CODE.INVALID_STATE,
                "POCKET_NOT_ACTIVE",
                { pocketId: creditPocketId, status: creditPocket.status },
              );
            }

            const debited = await tx.collections.pockets.findOneAndUpdate(
              {
                _id: tx.toObjectId(debitPocket.id),
                status: debitPocket.status,
                balance: { $gte: amount },
              },
              {
                $inc: { balance: -amount },
                $set: { updatedBy: "engine", updatedAt: new Date() },
              },
              { returnDocument: "after", session: tx.session },
            );
            if (!debited || !debited.value) {
              throw AppErrorService.create(
                EnvelopeService.CODE.INVALID_STATE,
                "INSUFFICIENT_BALANCE",
                { pocketId: debitPocket.id, amount: amount },
              );
            }
            const updatedDebitPocket = tx.normalizeId(debited.value);
            const debitChecksum = CryptoService.checksumPocket({
              ownerType: updatedDebitPocket.ownerType,
              ownerId: updatedDebitPocket.ownerId,
              currency: updatedDebitPocket.currency,
              balance: updatedDebitPocket.balance,
            });
            await tx.collections.pockets.updateOne(
              { _id: tx.toObjectId(updatedDebitPocket.id) },
              { $set: { checksum: debitChecksum, updatedAt: new Date() } },
              { session: tx.session },
            );
            const credited = await tx.collections.pockets.findOneAndUpdate(
              {
                _id: tx.toObjectId(creditPocket.id),
                status: creditPocket.status,
              },
              {
                $inc: { balance: amount },
                $set: { updatedBy: "engine", updatedAt: new Date() },
              },
              { returnDocument: "after", session: tx.session },
            );
            if (!credited || !credited.value) {
              throw AppErrorService.create(
                EnvelopeService.CODE.INVALID_STATE,
                "POCKET_UPDATE_FAILED",
                { pocketId: creditPocket.id },
              );
            }
            const updatedCreditPocket = tx.normalizeId(credited.value);
            const creditChecksum = CryptoService.checksumPocket({
              ownerType: updatedCreditPocket.ownerType,
              ownerId: updatedCreditPocket.ownerId,
              currency: updatedCreditPocket.currency,
              balance: updatedCreditPocket.balance,
            });
            await tx.collections.pockets.updateOne(
              { _id: tx.toObjectId(updatedCreditPocket.id) },
              { $set: { checksum: creditChecksum, updatedAt: new Date() } },
              { session: tx.session },
            );

            const now = new Date();
            const entry = {
              transRefId: tx.toObjectId(message.trail.id),
              stepOrder: Number(step.order || 0),
              debitPocketId: tx.toObjectId(debitPocket.id),
              creditPocketId: tx.toObjectId(creditPocket.id),
              amount: amount,
              currency: tx.toObjectId(currency.id),
              status: "settled",
              createdBy: transBody.USERID || transBody.OFFICERID,
              updatedBy: transBody.USERID || transBody.OFFICERID,
              createdAt: now,
              updatedAt: now,
            };
            const insertedEntry = await tx.collections.pocketEntries.insertOne(
              entry,
              { session: tx.session },
            );
            entry._id = insertedEntry.insertedId;
            entries.push(tx.normalizeId(entry));
          }

          const now = new Date();
          const transaction = {
            code: "TXN" + Date.now() + String(message.trail.id).slice(-6),
            serviceId: String(service.id),
            transRefId: tx.toObjectId(message.trail.id),
            senderCustomer: transBody.USERID
              ? tx.toObjectId(transBody.USERID)
              : undefined,
            receiverCustomer: transBody.RECEIVERCUSTOMERID
              ? tx.toObjectId(transBody.RECEIVERCUSTOMERID)
              : undefined,
            receiverProvider: transBody.PROVIDERID
              ? tx.toObjectId(transBody.PROVIDERID)
              : undefined,
            amount: Number(transBody.AMOUNT),
            fee: Number(transBody.DEBITFEE || 0),
            totalAmount: Number(transBody.TOTALAMOUNT),
            currency: tx.toObjectId(currency.id),
            message: transBody.MESSAGE || transBody.message,
            status: "done",
            createdBy: transBody.USERID || transBody.OFFICERID,
            updatedBy: transBody.USERID || transBody.OFFICERID,
            createdAt: now,
            updatedAt: now,
          };
          const insertedTransaction =
            await tx.collections.transactions.insertOne(transaction, {
              session: tx.session,
            });
          transaction._id = insertedTransaction.insertedId;

          await Service.runVerifyAction(service, transBody);

          const updatedTrail = await tx.collections.trails.findOneAndUpdate(
            { _id: tx.toObjectId(message.trail.id), status: "pending" },
            {
              $set: {
                outputMessage: { TRANSBODY: transBody },
                status: "done",
                updatedBy: transBody.USERID || transBody.OFFICERID,
                updatedAt: new Date(),
              },
            },
            { returnDocument: "after", session: tx.session },
          );
          if (!updatedTrail || !updatedTrail.value) {
            throw AppErrorService.create(
              EnvelopeService.CODE.INVALID_STATE,
              "TRANSACTION_TRAIL_NOT_PENDING",
            );
          }

          receipt = {
            trail: tx.normalizeId(updatedTrail.value),
            transaction: tx.normalizeId(transaction),
            message: transaction.message,
            currency: currency,
          };
        });
      } catch (err) {
        const message = err && err.message ? err.message : "";
        if (
          message.indexOf("Transaction numbers are only allowed") !== -1 ||
          message.indexOf("replica set member or mongos") !== -1 ||
          message.indexOf("Transaction") !== -1
        ) {
          throw AppErrorService.create(
            EnvelopeService.CODE.INVALID_STATE,
            "MONGO_TRANSACTION_UNAVAILABLE",
            { message: message },
          );
        }
        await TransactionTrail.markFailed(message.trail, err);
        throw err;
      } finally {
        await session.endSession();
        await Pocket.releaseLockedPocket(lockedPocket, message.trail.id);
        lockedPocket = null;
      }

      return Service.buildReceipt(receipt, service);
    } catch (err) {
      if (lockedPocket) {
        await Pocket.releaseLockedPocket(lockedPocket, message.trail.id);
      }

      throw err;
    }
  },
};
