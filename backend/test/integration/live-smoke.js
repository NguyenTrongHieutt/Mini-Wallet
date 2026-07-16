"use strict";

var assert = require("assert");
var mongodb = require("mongodb");

var integrationUri = process.env.MONGO_INTEGRATION_URI;
if (!integrationUri) {
  console.error(
    "MONGO_INTEGRATION_URI is required, for example " +
      "mongodb://127.0.0.1:27017/mini_wallet_integration?replicaSet=rs0",
  );
  process.exit(1);
}

var databaseName = extractDatabaseName(integrationUri);
if (!/_integration$/.test(databaseName)) {
  console.error(
    "Integration database name must end with _integration; received " +
      databaseName,
  );
  process.exit(1);
}

process.env.NODE_ENV = "test";
process.env.MONGO_URI = integrationUri;
process.env.MONGO_DATABASE = databaseName;
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "mini-wallet-integration-jwt-secret";
process.env.SESSION_SECRET =
  process.env.SESSION_SECRET || "mini-wallet-integration-session-secret";
process.env.DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY || "VND";
process.env.REGISTRATION_BALANCE = "0";
process.env.PROVIDER_TIMEOUT_MS = process.env.PROVIDER_TIMEOUT_MS || "250";
process.env.OFFICER_PHONE =
  process.env.OFFICER_PHONE || "0999999901";
process.env.OFFICER_PASSWORD =
  process.env.OFFICER_PASSWORD || "IntegrationPassword123";

var sails = require("sails");
var seedRunner = require("../../scripts/lib/seed-runner");

run().then(
  function () {
    console.log("Backend integration smoke passed");
    process.exit(0);
  },
  function (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  },
);

async function run() {
  await dropIntegrationDatabase();
  await loadSails();

  try {
    await verifySeedIdempotency();
    var sender = await registerCustomer(
      "0988000001",
      "123456",
      "Integration Sender",
    );
    await verifyRegistrationRollback();
    await verifyDuplicateRegistration(sender.customer.phone);

    var officer = await Officer.findOne({
      phone: process.env.OFFICER_PHONE,
    });
    assert.ok(officer, "Seeded officer must exist");

    assert.strictEqual(await customerBalance(sender.customer), 0);
    await cashIn(officer, sender.customer.phone, 1000, "Cash-in 1");
    await cashIn(officer, sender.customer.phone, 1000, "Cash-in 2");
    assert.strictEqual(
      await customerBalance(sender.customer),
      2000,
      "Two consecutive cash-ins must preserve pocket checksum",
    );

    await verifyProviderFailureRollback(officer, sender.customer);

    var receiver = await registerCustomer(
      "0988000002",
      "654321",
      "Integration Receiver",
    );
    await verifyConcurrentTransaction(sender, receiver);
    await verifyFinalLedgerCounts();
  } finally {
    await closeApplication();
    await dropIntegrationDatabase();
  }
}

async function verifySeedIdempotency() {
  var context = seedContext();
  var first = await seedRunner.run({
    context: context,
    env: process.env,
  });
  var firstCounts = await seedCounts();
  var second = await seedRunner.run({
    context: context,
    env: process.env,
  });
  var secondCounts = await seedCounts();

  assert.deepStrictEqual(
    first.map(seedId),
    ["currencies", "officer", "p2p", "cash-in"],
  );
  assert.deepStrictEqual(second.map(seedId), first.map(seedId));
  assert.deepStrictEqual(secondCounts, firstCounts);
  assert.deepStrictEqual(secondCounts, {
    currencies: 9,
    definitions: 2,
    fields: 6,
    officers: 1,
    pockets: 2,
    services: 2,
    validations: 4,
  });
}

async function registerCustomer(phone, pin, displayName) {
  var result = await AuthService.registerCustomer({
    phone: phone,
    password: "Password123",
    pin: pin,
    displayName: displayName,
  });
  var customer = await Customer.findOne({ phone: phone });

  assert.ok(result.data.auth.accessToken);
  assert.ok(customer);
  return {
    customer: customer,
    token: result.data.auth.accessToken,
  };
}

async function verifyRegistrationRollback() {
  var customerCount = await Customer.count();
  var pocketCount = await Pocket.count({ ownerType: "customer" });
  var originalCreate = Session.create;

  Session.create = function () {
    return Promise.reject(new Error("FORCED_SESSION_FAILURE"));
  };

  try {
    await AuthService.registerCustomer({
      phone: "0988000003",
      password: "Password123",
      pin: "333333",
      displayName: "Must Roll Back",
    });
    assert.fail("Registration should fail when session persistence fails");
  } catch (err) {
    assert.strictEqual(err.message, "FORCED_SESSION_FAILURE");
  } finally {
    Session.create = originalCreate;
  }

  assert.strictEqual(await Customer.count(), customerCount);
  assert.strictEqual(
    await Pocket.count({ ownerType: "customer" }),
    pocketCount,
  );
}

async function verifyDuplicateRegistration(phone) {
  var customerCount = await Customer.count();
  var pocketCount = await Pocket.count({ ownerType: "customer" });
  var conflict;

  try {
    await AuthService.registerCustomer({
      phone: phone,
      password: "Password123",
      pin: "123456",
    });
  } catch (err) {
    conflict = err;
  }

  assert.ok(conflict);
  assert.strictEqual(conflict.code, EnvelopeService.CODE.CONFLICT);
  assert.strictEqual(await Customer.count(), customerCount);
  assert.strictEqual(
    await Pocket.count({ ownerType: "customer" }),
    pocketCount,
  );
}

async function cashIn(officer, customerPhone, amount, message) {
  var result = await TransactionOrchestratorService.trigger(
    {
      serviceCode: "CASH_IN",
      customerPhone: customerPhone,
      amount: amount,
      currency: "VND",
      message: message,
    },
    { user: officer, userType: "officer" },
  );

  assert.strictEqual(result.receipt.status, "done");
  return result;
}

async function verifyProviderFailureRollback(officer, customer) {
  var service = await Service.findOne({ code: "CASH_IN" });
  var bankPocket = await Pocket.findOne({
    ownerType: "bank",
    ownerId: "CASH_IN_BANK",
  });
  var customerPocket = await Pocket.findOne({
    ownerType: "customer",
    ownerId: String(customer.id),
  });
  var before = {
    bankBalance: bankPocket.balance,
    customerBalance: customerPocket.balance,
    entries: await PocketEntry.count(),
    transactions: await Transaction.count(),
  };

  await Provider.create({
    type: "bank",
    code: "FAIL_PROVIDER",
    serviceCode: "CASH_IN",
    name: "Integration failure provider",
    verifyUrl: "http://127.0.0.1:1/fail",
    status: "active",
    identityKey: "CASH_IN:FAIL_PROVIDER",
  });
  await Service.update(
    { id: service.id },
    {
      actions: {
        provider: {
          codeSource: "FIXED",
          codeValue: "FAIL_PROVIDER",
        },
        request: { enabled: false },
        confirm: { enabled: false },
        verify: {
          enabled: true,
          errorCode: "PROVIDER_VERIFY_FAILED",
        },
      },
    },
  );

  var failure;
  try {
    await cashIn(officer, customer.phone, 500, "Must roll back");
  } catch (err) {
    failure = err;
  }

  assert.ok(failure);
  assert.strictEqual(failure.messageKey, "PROVIDER_VERIFY_FAILED");
  assert.strictEqual(await PocketEntry.count(), before.entries);
  assert.strictEqual(await Transaction.count(), before.transactions);

  bankPocket = await Pocket.findOne({ id: bankPocket.id });
  customerPocket = await Pocket.findOne({ id: customerPocket.id });
  assert.strictEqual(bankPocket.balance, before.bankBalance);
  assert.strictEqual(customerPocket.balance, before.customerBalance);
  assert.strictEqual(bankPocket.status, "active");
  assert.ok(!bankPocket.lockedBy);
  assert.strictEqual(
    await TransactionTrail.count({ status: "failed" }),
    1,
  );

  await Service.update(
    { id: service.id },
    {
      actions: {
        request: { enabled: false },
        confirm: { enabled: false },
        verify: { enabled: false },
      },
    },
  );
}

async function verifyConcurrentTransaction(sender, receiver) {
  var info = { user: sender.customer, userType: "customer" };
  var preview = await TransactionService.engineRequestTransaction(
    {
      serviceCode: "P2P_TRANSFER",
      receiverPhone: receiver.customer.phone,
      amount: 1000,
      currency: "VND",
    },
    info,
  );
  await TransactionService.engineConfirmTransaction(
    { transRefId: preview.transRefId },
    info,
  );

  var verifyBody = {
    transRefId: preview.transRefId,
    pin: "123456",
  };
  var outcomes = await Promise.all([
    settle(TransactionService.engineVerifyTransaction(verifyBody, info)),
    settle(TransactionService.engineVerifyTransaction(verifyBody, info)),
  ]);
  var successes = outcomes.filter(function (outcome) {
    return outcome.ok;
  });
  var failures = outcomes.filter(function (outcome) {
    return !outcome.ok;
  });

  assert.strictEqual(successes.length, 1);
  assert.strictEqual(failures.length, 1);
  assert.strictEqual(successes[0].value.status, "done");
  assert.strictEqual(await customerBalance(sender.customer), 900);
  assert.strictEqual(await customerBalance(receiver.customer), 1000);
  assert.strictEqual(
    await Transaction.count({ transRefId: preview.transRefId }),
    1,
  );
}

async function verifyFinalLedgerCounts() {
  assert.strictEqual(await Customer.count(), 2);
  assert.strictEqual(await Pocket.count({ ownerType: "customer" }), 2);
  assert.strictEqual(await Transaction.count(), 3);
  assert.strictEqual(await PocketEntry.count(), 4);
  assert.strictEqual(await TransactionTrail.count({ status: "done" }), 3);
  assert.strictEqual(await TransactionTrail.count({ status: "failed" }), 1);
}

async function customerBalance(customer) {
  var result = await CustomerWalletService.getBalance(customer, {});
  return result.pocket.balance;
}

async function seedCounts() {
  return {
    currencies: await Currency.count(),
    definitions: await TransDefinition.count(),
    fields: await TransField.count(),
    officers: await Officer.count(),
    pockets: await Pocket.count(),
    services: await Service.count(),
    validations: await TransValidation.count(),
  };
}

function seedContext() {
  return {
    Currency: Currency,
    Officer: Officer,
    Pocket: Pocket,
    Service: Service,
    TransField: TransField,
    TransValidation: TransValidation,
    TransDefinition: TransDefinition,
    CryptoService: CryptoService,
  };
}

function seedId(entry) {
  return entry.id;
}

function settle(promise) {
  return promise.then(
    function (value) {
      return { ok: true, value: value };
    },
    function (error) {
      return { ok: false, error: error };
    },
  );
}

function loadSails() {
  return new Promise(function (resolve, reject) {
    sails.load(
      {
        hooks: { grunt: false },
        log: { level: "warn" },
        models: { migrate: "safe" },
      },
      function (err) {
        if (err) {
          return reject(err);
        }
        resolve();
      },
    );
  });
}

async function closeApplication() {
  if (
    global.MongoTransactionExecutorService &&
    MongoTransactionExecutorService.close
  ) {
    await MongoTransactionExecutorService.close();
  }

  if (!sails || !sails.lower) {
    return;
  }

  await new Promise(function (resolve) {
    sails.lower(function () {
      resolve();
    });
  });
}

async function dropIntegrationDatabase() {
  var client = await mongodb.MongoClient.connect(integrationUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.db(databaseName).dropDatabase();
  } finally {
    await client.close();
  }
}

function extractDatabaseName(uri) {
  var withoutQuery = String(uri).split("?")[0];
  var slash = withoutQuery.lastIndexOf("/");
  var name = slash === -1 ? "" : withoutQuery.slice(slash + 1);
  return decodeURIComponent(name);
}
