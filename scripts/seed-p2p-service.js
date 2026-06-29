var sails = require('sails');

var SERVICE_CODE = 'P2P_TRANSFER';
var DEFAULT_CURRENCY = 'VND';
var SYSTEM_POCKET_OWNER_ID = 'SYSTEM_FEE';

sails.load({ hooks: { grunt: false }, log: { level: 'warn' } }, function loadApp(err) {
  if (err) {
    console.error('Failed to load Sails:', err);
    process.exit(1);
  }

  seedP2PService(function seedDone(seedErr, result) {
    if (seedErr) {
      console.error('Failed to seed P2P service:', seedErr);
      return sails.lower(function lowerAfterError() {
        process.exit(1);
      });
    }

    console.log(
      'Seeded P2P service. Service: ' +
        result.serviceCode +
        ', fields: ' +
        result.fields +
        ', validations: ' +
        result.validations +
        ', definition: ' +
        result.definitionCode
    );

    sails.lower(function lowerAfterSuccess() {
      process.exit(0);
    });
  });
});

async function seedP2PService(done) {
  try {
    var currency = await Currency.findOne({ code: DEFAULT_CURRENCY, status: 'active' });
    if (!currency) {
      throw new Error('Currency ' + DEFAULT_CURRENCY + ' not found. Run npm run seed:currencies first.');
    }

    var systemPocket = await ensureSystemFeePocket(currency);
    var service = await upsertService();
    var serviceId = String(service.id);

    await upsertTransFields(serviceId);
    await upsertTransValidations(serviceId);
    var definition = await upsertTransDefinition(serviceId, systemPocket);

    done(null, {
      serviceCode: service.code,
      fields: P2P_TRANS_FIELDS.length,
      validations: P2P_TRANS_VALIDATIONS.length,
      definitionCode: definition.code,
    });
  } catch (err) {
    done(err);
  }
}

async function ensureSystemFeePocket(currency) {
  var existing = await Pocket.findOne({
    ownerType: 'system',
    ownerId: SYSTEM_POCKET_OWNER_ID,
    currency: currency.id,
  });

  var pocket = {
    ownerType: 'system',
    ownerId: SYSTEM_POCKET_OWNER_ID,
    currency: currency.id,
    balance: existing ? existing.balance : 0,
    name: 'System Fee Wallet',
    status: 'active',
    createdBy: 'seed',
    updatedBy: 'seed',
  };
  pocket.checksum = CryptoService.checksumPocket(pocket);

  if (existing) {
    var updated = await Pocket.update({ id: existing.id }, pocket);
    return updated[0];
  }

  return Pocket.create(pocket);
}

async function upsertService() {
  var service = {
    code: SERVICE_CODE,
    name: 'P2P Transfer',
    description: 'Transfer money from one customer wallet to another customer wallet.',
    fieldBuilder: P2P_FIELD_BUILDER,
    actions: {
      request: { enabled: false },
      confirm: { enabled: false },
      verify: { enabled: false },
      preview: {
        fields: {
          input: {
            source: 'object',
            fields: {
              receiverPhone: 'RECEIVERPHONE',
            },
          },
        },
      },
    },
    fee: {
      type: 'fixed',
      value: 100,
      currency: DEFAULT_CURRENCY,
    },
    auth: {
      method: 'PIN',
    },
    status: 'active',
    createdBy: 'seed',
    updatedBy: 'seed',
  };

  return upsertOne(Service, { code: SERVICE_CODE }, service);
}

async function upsertTransFields(serviceId) {
  for (var i = 0; i < P2P_TRANS_FIELDS.length; i += 1) {
    var field = clone(P2P_TRANS_FIELDS[i]);
    field.service = serviceId;
    field.createdBy = 'seed';
    field.updatedBy = 'seed';

    await upsertOne(TransField, { service: serviceId, fieldName: field.fieldName }, field);
  }
}

async function upsertTransValidations(serviceId) {
  for (var i = 0; i < P2P_TRANS_VALIDATIONS.length; i += 1) {
    var validation = clone(P2P_TRANS_VALIDATIONS[i]);
    validation.service = serviceId;
    validation.createdBy = 'seed';
    validation.updatedBy = 'seed';

    await upsertOne(
      TransValidation,
      {
        service: serviceId,
        validateFunc: validation.validateFunc,
        validateFields: validation.validateFields,
      },
      validation
    );
  }
}

async function upsertTransDefinition(serviceId, systemPocket) {
  var definition = {
    code: serviceId,
    service: serviceId,
    glSteps: [
      {
        order: 1,
        amount: 'AMOUNT',
        debit: { level: 'productLevel', target: 'SENDERID' },
        credit: { level: 'productLevel', target: 'RECEIVERID' },
      },
      {
        order: 2,
        amount: 'DEBITFEE',
        debit: { level: 'productLevel', target: 'SENDERID' },
        credit: { level: 'wallet', target: String(systemPocket.id) },
      },
    ],
    status: 'active',
    createdBy: 'seed',
    updatedBy: 'seed',
  };

  return upsertOne(TransDefinition, { code: serviceId }, definition);
}

async function upsertOne(model, criteria, values) {
  var existing = await model.findOne(criteria);
  if (existing) {
    var updated = await model.update({ id: existing.id }, values);
    return updated[0];
  }

  return model.create(values);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

var P2P_FIELD_BUILDER = [
  {
    order: 1,
    name: 'USERID',
    role: 'sender customer id',
    rule: 'mapping',
    source: 'user',
    variable: 'id',
    datatype: 'string',
    errorCode: 'USER_REQUIRED',
  },
  {
    order: 2,
    name: 'SERVICECODE',
    role: 'service code',
    rule: 'fixed',
    source: 'constant',
    value: SERVICE_CODE,
    datatype: 'string',
    errorCode: 'SERVICE_REQUIRED',
  },
  {
    order: 3,
    name: 'RECEIVERPHONE',
    role: 'receiver phone',
    rule: 'mapping',
    source: 'body',
    variable: 'receiverPhone',
    datatype: 'string',
    errorCode: 'RECEIVER_PHONE_REQUIRED',
  },
  {
    order: 4,
    name: 'AMOUNT',
    role: 'transfer amount',
    rule: 'mapping',
    source: 'body',
    variable: 'amount',
    datatype: 'number',
    errorCode: 'AMOUNT_REQUIRED',
  },
  {
    order: 5,
    name: 'CURRENCY',
    role: 'currency code',
    rule: 'mapping',
    source: 'body',
    variable: 'currency',
    defaultValue: DEFAULT_CURRENCY,
    datatype: 'string',
    errorCode: 'CURRENCY_REQUIRED',
  },
  {
    order: 6,
    name: 'SENDERID',
    role: 'sender pocket id',
    rule: 'query',
    source: 'database',
    query: 'Pocket.getActivePocketByOwner',
    params: [{ source: 'constant', value: 'customer' }, 'USERID', 'CURRENCY'],
    output: 'id',
    datatype: 'string',
    errorCode: 'SENDER_POCKET_NOT_FOUND',
  },
  {
    order: 7,
    name: 'RECEIVERCUSTOMERID',
    role: 'receiver customer id',
    rule: 'query',
    source: 'database',
    query: 'Customer.getActiveCustomerByPhone',
    params: ['RECEIVERPHONE'],
    output: 'id',
    datatype: 'string',
    errorCode: 'RECEIVER_NOT_FOUND',
  },
  {
    order: 8,
    name: 'RECEIVERID',
    role: 'receiver pocket id',
    rule: 'query',
    source: 'database',
    query: 'Pocket.getActivePocketByOwner',
    params: [{ source: 'constant', value: 'customer' }, 'RECEIVERCUSTOMERID', 'CURRENCY'],
    output: 'id',
    datatype: 'string',
    errorCode: 'RECEIVER_POCKET_NOT_FOUND',
  },
];

var P2P_TRANS_FIELDS = [
  {
    fieldName: 'RECEIVERPHONE',
    fieldFormat: 'string',
    minLength: 9,
    maxLength: 15,
    regex: '^\\+?[0-9]{9,15}$',
    isRequired: true,
    needSecured: false,
    order: 1,
    errorCode: 'RECEIVER_PHONE_INVALID',
    status: 'active',
  },
  {
    fieldName: 'AMOUNT',
    fieldFormat: 'number',
    minLength: 1,
    isRequired: true,
    needSecured: false,
    order: 2,
    errorCode: 'AMOUNT_INVALID',
    status: 'active',
  },
  {
    fieldName: 'CURRENCY',
    fieldFormat: 'string',
    minLength: 3,
    maxLength: 3,
    regex: '^[A-Z]{3}$',
    isRequired: false,
    needSecured: false,
    order: 3,
    errorCode: 'CURRENCY_INVALID',
    status: 'active',
  },
];

var P2P_TRANS_VALIDATIONS = [
  {
    validateFunc: 'validateReceiverIsNotSender',
    validateFields: 'SENDERID:RECEIVERID',
    order: 1,
    errorCode: 'SELF_TRANSFER',
    status: 'active',
  },
  {
    validateFunc: 'validateSenderAccountSufficiency',
    validateFields: 'SENDERID:AMOUNT:DEBITFEE',
    order: 2,
    errorCode: 'INSUFFICIENT_BALANCE',
    status: 'active',
  },
];
