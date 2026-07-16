module.exports = {
  createBill: async function (body) {
    const input = normalizeBillIdentifier(body);
    const amount = Number(body && body.amount);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw AppErrorService.create(
        EnvelopeService.CODE.BAD_REQUEST,
        "MOCK_BILL_AMOUNT_INVALID",
      );
    }
    if (body.billInfo !== undefined && !CommonService.isPlainObject(body.billInfo)) {
      throw AppErrorService.create(
        EnvelopeService.CODE.BAD_REQUEST,
        "MOCK_BILL_INFO_INVALID",
      );
    }

    const existing = await MockBill.findOne({ identityKey: input.identityKey });
    if (existing) {
      throw AppErrorService.create(
        EnvelopeService.CODE.CONFLICT,
        "MOCK_BILL_ALREADY_EXISTS",
        { billId: String(existing.id) },
      );
    }

    try {
      const bill = await MockBill.create({
        providerCode: input.providerCode,
        billCode: input.billCode,
        identityKey: input.identityKey,
        amount: amount,
        billInfo: body.billInfo || {},
        status: "unpaid",
      });
      return publicBill(bill);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw AppErrorService.create(
          EnvelopeService.CODE.CONFLICT,
          "MOCK_BILL_ALREADY_EXISTS",
        );
      }
      throw err;
    }
  },

  inquiry: async function (body) {
    const input = normalizeBillIdentifier(body);
    const bill = await MockBill.findOne({ identityKey: input.identityKey });
    if (!bill) {
      throw AppErrorService.create(
        EnvelopeService.CODE.NOT_FOUND,
        "MOCK_BILL_NOT_FOUND",
      );
    }
    return publicBill(bill);
  },

  payment: async function (body) {
    const input = normalizeBillIdentifier(body);
    const transRefId = CommonService.cleanString(
      body.transRefId || body.TRANSREFID || body.transactionRef,
    );
    if (!transRefId) {
      throw AppErrorService.create(
        EnvelopeService.CODE.BAD_REQUEST,
        "MOCK_BILL_TRANS_REF_REQUIRED",
      );
    }

    let bill = await MockBill.findOne({ identityKey: input.identityKey });
    if (!bill) {
      throw AppErrorService.create(
        EnvelopeService.CODE.NOT_FOUND,
        "MOCK_BILL_NOT_FOUND",
      );
    }

    if (body.amount !== undefined && Number(body.amount) !== Number(bill.amount)) {
      throw AppErrorService.create(
        EnvelopeService.CODE.BAD_REQUEST,
        "MOCK_BILL_AMOUNT_MISMATCH",
        { expected: bill.amount, received: body.amount },
      );
    }

    if (bill.status === "paid") {
      if (String(bill.paidTransRefId) === transRefId) {
        const samePayment = publicBill(bill);
        samePayment.idempotent = true;
        return samePayment;
      }
      throw AppErrorService.create(
        EnvelopeService.CODE.CONFLICT,
        "MOCK_BILL_ALREADY_PAID",
        { paidTransRefId: bill.paidTransRefId },
      );
    }

    const updated = await MockBill.update(
      { id: bill.id, status: "unpaid" },
      { status: "paid", paidTransRefId: transRefId, paidAt: new Date() },
    );
    if (!updated || !updated[0]) {
      bill = await MockBill.findOne({ id: bill.id });
      if (bill && bill.status === "paid" && String(bill.paidTransRefId) === transRefId) {
        const concurrentPayment = publicBill(bill);
        concurrentPayment.idempotent = true;
        return concurrentPayment;
      }
      throw AppErrorService.create(
        EnvelopeService.CODE.CONFLICT,
        "MOCK_BILL_ALREADY_PAID",
      );
    }

    const result = publicBill(updated[0]);
    result.idempotent = false;
    return result;
  },
};

function normalizeBillIdentifier(body) {
  body = CommonService.isPlainObject(body) ? body : {};
  const providerCode = CommonService.cleanUpperString(
    body.providerCode || body.PROVIDERCODE,
  );
  const billCode = CommonService.cleanUpperString(body.billCode || body.BILLCODE);
  if (!providerCode) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "MOCK_BILL_PROVIDER_CODE_REQUIRED",
    );
  }
  if (!billCode) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "MOCK_BILL_CODE_REQUIRED",
    );
  }
  if (!/^[A-Z0-9_-]{2,50}$/.test(providerCode)) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "MOCK_BILL_PROVIDER_CODE_INVALID",
    );
  }
  if (!/^[A-Z0-9_-]{2,100}$/.test(billCode)) {
    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "MOCK_BILL_CODE_INVALID",
    );
  }
  return {
    providerCode: providerCode,
    billCode: billCode,
    identityKey: providerCode + "::" + billCode,
  };
}

function publicBill(bill) {
  return {
    id: String(bill.id),
    providerCode: bill.providerCode,
    billCode: bill.billCode,
    amount: bill.amount,
    billInfo: bill.billInfo || {},
    status: bill.status,
    paidTransRefId: bill.paidTransRefId || null,
    paidAt: bill.paidAt || null,
    createdAt: bill.createdAt,
    updatedAt: bill.updatedAt,
  };
}

function isDuplicateKeyError(err) {
  if (!err) return false;
  if (Number(err.code) === 11000 || Number(err.code) === 11001) return true;
  if (/E11000|duplicate key/i.test(err.message || "")) return true;
  const nested = err.originalError || err.raw || err.cause;
  return nested && nested !== err ? isDuplicateKeyError(nested) : false;
}
