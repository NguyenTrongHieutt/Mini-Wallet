var sails = require("sails");

var SERVICE_CODE = "CASH_IN";
var DEFAULT_CURRENCY = "VND";
var BANK_OWNER_ID = "CASH_IN_BANK";
var BANK_SEED_BALANCE = 1000000000;

sails.load(
  { hooks: { grunt: false }, log: { level: "warn" } },
  function loadApp(err) {
    if (err) {
      console.error("Failed to load Sails:", err);
      process.exit(1);
    }

    seed(function done(seedErr, result) {
      if (seedErr) {
        console.error("Failed to seed CASH_IN service:", seedErr);
        return sails.lower(function () { process.exit(1); });
      }
      console.log(
        "Seeded " + result.serviceCode + " service and bank pocket " + result.bankPocketId,
      );
      sails.lower(function () { process.exit(0); });
    });
  },
);

async function seed(done) {
  try {
    var currency = await Currency.findOne({ code: DEFAULT_CURRENCY, status: "active" });
    if (!currency) {
      throw new Error("Currency VND not found. Run npm run seed:currencies first.");
    }

    var bankPocket = await ensureBankPocket(currency);
    var service = await upsertOne(Service, { code: SERVICE_CODE }, buildService());
    var serviceId = String(service.id);
    await upsertFields(serviceId);
    await upsertValidations(serviceId);
    await upsertOne(
      TransDefinition,
      { code: serviceId },
      {
        code: serviceId,
        service: serviceId,
        glSteps: [
          {
            order: 1,
            amount: "AMOUNT",
            debit: { level: "productLevel", target: "SENDERID" },
            credit: { level: "productLevel", target: "RECEIVERID" },
          },
        ],
        status: "active",
        createdBy: "seed",
        updatedBy: "seed",
      },
    );

    done(null, { serviceCode: service.code, bankPocketId: String(bankPocket.id) });
  } catch (err) {
    done(err);
  }
}

async function ensureBankPocket(currency) {
  var existing = await Pocket.findOne({
    ownerType: "bank",
    ownerId: BANK_OWNER_ID,
    currency: currency.id,
  });
  var values = {
    ownerType: "bank",
    ownerId: BANK_OWNER_ID,
    currency: currency.id,
    balance: existing ? Math.max(Number(existing.balance), BANK_SEED_BALANCE) : BANK_SEED_BALANCE,
    name: "Cash-in Settlement Bank",
    status: "active",
    createdBy: existing ? existing.createdBy : "seed",
    updatedBy: "seed",
  };
  values.checksum = CryptoService.checksumPocket(values);

  if (existing) {
    var updated = await Pocket.update({ id: existing.id }, values);
    return updated[0];
  }
  return Pocket.create(values);
}

function buildService() {
  return {
    code: SERVICE_CODE,
    name: "Officer Cash-in",
    description: "Officer credits a customer wallet from the cash-in settlement bank.",
    fieldBuilder: [
      {
        order: 1,
        name: "CUSTOMERPHONE",
        role: "receiver phone",
        rule: "mapping",
        source: "body",
        variable: "customerPhone",
        datatype: "string",
        errorCode: "RECEIVER_PHONE_REQUIRED",
      },
      {
        order: 2,
        name: "AMOUNT",
        role: "cash-in amount",
        rule: "mapping",
        source: "body",
        variable: "amount",
        datatype: "number",
        errorCode: "AMOUNT_REQUIRED",
      },
      {
        order: 3,
        name: "CURRENCY",
        role: "currency code",
        rule: "mapping",
        source: "body",
        variable: "currency",
        defaultValue: DEFAULT_CURRENCY,
        datatype: "string",
        errorCode: "CURRENCY_REQUIRED",
      },
      {
        order: 4,
        name: "SENDERID",
        role: "settlement bank pocket",
        rule: "query",
        source: "database",
        query: "Pocket.getActivePocketByOwner",
        params: [
          { source: "constant", value: "bank" },
          { source: "constant", value: BANK_OWNER_ID },
          "CURRENCY",
        ],
        output: "id",
        datatype: "string",
        errorCode: "SENDER_POCKET_NOT_FOUND",
      },
      {
        order: 5,
        name: "RECEIVERCUSTOMERID",
        role: "receiver customer id",
        rule: "query",
        source: "database",
        query: "Customer.getActiveCustomerByPhone",
        params: ["CUSTOMERPHONE"],
        output: "id",
        datatype: "string",
        errorCode: "RECEIVER_NOT_FOUND",
      },
      {
        order: 6,
        name: "RECEIVERID",
        role: "receiver pocket id",
        rule: "query",
        source: "database",
        query: "Pocket.getActivePocketByOwner",
        params: [
          { source: "constant", value: "customer" },
          "RECEIVERCUSTOMERID",
          "CURRENCY",
        ],
        output: "id",
        datatype: "string",
        errorCode: "RECEIVER_POCKET_NOT_FOUND",
      },
      {
        order: 7,
        name: "MESSAGE",
        role: "transaction message",
        rule: "mapping",
        source: "body",
        variable: "message",
        defaultValue: "Officer cash-in",
        datatype: "string",
        errorCode: "TRANSACTION_FIELD_INVALID",
      },
    ],
    actions: {
      request: { enabled: false },
      confirm: { enabled: false },
      verify: { enabled: false },
    },
    fee: { type: "fixed", value: 0, currency: DEFAULT_CURRENCY },
    auth: { method: "NONE" },
    status: "active",
    createdBy: "seed",
    updatedBy: "seed",
  };
}

async function upsertFields(serviceId) {
  var fields = [
    {
      fieldName: "CUSTOMERPHONE",
      fieldFormat: "string",
      minLength: 9,
      maxLength: 15,
      regex: "^\\+?[0-9]{9,15}$",
      isRequired: true,
      needSecured: false,
      order: 1,
      errorCode: "RECEIVER_PHONE_INVALID",
      status: "active",
    },
    {
      fieldName: "AMOUNT",
      fieldFormat: "number",
      minLength: 1,
      isRequired: true,
      needSecured: false,
      order: 2,
      errorCode: "AMOUNT_INVALID",
      status: "active",
    },
    {
      fieldName: "CURRENCY",
      fieldFormat: "string",
      minLength: 3,
      maxLength: 3,
      regex: "^[A-Z]{3}$",
      isRequired: true,
      needSecured: false,
      order: 3,
      errorCode: "CURRENCY_INVALID",
      status: "active",
    },
  ];

  for (var i = 0; i < fields.length; i += 1) {
    fields[i].service = serviceId;
    fields[i].createdBy = "seed";
    fields[i].updatedBy = "seed";
    await upsertOne(
      TransField,
      { service: serviceId, fieldName: fields[i].fieldName },
      fields[i],
    );
  }
}

async function upsertValidations(serviceId) {
  var validations = [
    {
      validateFunc: "validateRole",
      validateFields: "USERTYPE:officer",
      order: 1,
      errorCode: "OFFICER_PERMISSION_REQUIRED",
      status: "active",
    },
    {
      validateFunc: "validateSenderAccountSufficiency",
      validateFields: "SENDERID:AMOUNT:DEBITFEE",
      order: 2,
      errorCode: "INSUFFICIENT_BALANCE",
      status: "active",
    },
  ];

  for (var i = 0; i < validations.length; i += 1) {
    validations[i].service = serviceId;
    validations[i].createdBy = "seed";
    validations[i].updatedBy = "seed";
    await upsertOne(
      TransValidation,
      {
        service: serviceId,
        validateFunc: validations[i].validateFunc,
        validateFields: validations[i].validateFields,
      },
      validations[i],
    );
  }
}

async function upsertOne(model, criteria, values) {
  var existing = await model.findOne(criteria);
  if (existing) {
    var updated = await model.update({ id: existing.id }, values);
    return updated[0];
  }
  return model.create(values);
}
