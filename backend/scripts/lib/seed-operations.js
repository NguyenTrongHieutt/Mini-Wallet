"use strict";

var clone = function (value) {
  return JSON.parse(JSON.stringify(value));
};

module.exports = {
  currencies: seedCurrencies,
  officer: seedOfficer,
  service: seedService,
  upsertOne: upsertOne,
};

async function seedCurrencies(context, fixture) {
  var currencies = fixture && fixture.currencies;
  if (!Array.isArray(currencies) || !currencies.length) {
    throw new Error("Currency fixture must contain currencies");
  }

  var result = { created: 0, updated: 0, total: currencies.length };
  for (var i = 0; i < currencies.length; i += 1) {
    var values = clone(currencies[i]);
    values.code = String(values.code).toUpperCase();
    applyAudit(values);

    var operation = await upsertOne(
      context.Currency,
      { code: values.code },
      values,
    );
    result[operation.action] += 1;
  }

  return result;
}

async function seedOfficer(context, fixture, env) {
  env = env || {};
  var phone = requiredEnvironment(env, "OFFICER_PHONE");
  var password = requiredEnvironment(env, "OFFICER_PASSWORD");
  var displayName =
    clean(env.OFFICER_DISPLAY_NAME) ||
    (fixture && fixture.defaultDisplayName) ||
    "Officer";
  var existing = await context.Officer.findOne({ phone: phone });
  var values = {
    passwordHash: context.CryptoService.hashSecret(password),
    displayName: displayName,
    status: "active",
    updatedBy: "seed",
  };

  if (existing) {
    await context.Officer.update({ id: existing.id }, values);
    return { action: "updated", phone: phone };
  }

  values.phone = phone;
  values.createdBy = "seed";
  await context.Officer.create(values);
  return { action: "created", phone: phone };
}

async function seedService(context, fixture) {
  validateServiceFixture(fixture);

  var currencyCode = fixture.currencyCode;
  var currency = await context.Currency.findOne({
    code: currencyCode,
    status: "active",
  });
  if (!currency) {
    throw new Error(
      "Currency " +
        currencyCode +
        " not found. Run npm run seed:currencies first.",
    );
  }

  var pocket = await ensurePocket(context, fixture.pocket, currency);
  var serviceValues = clone(fixture.service);
  applyAudit(serviceValues);
  var serviceOperation = await upsertOne(
    context.Service,
    { code: serviceValues.code },
    serviceValues,
  );
  var service = serviceOperation.record;
  var serviceId = String(service.id);

  await upsertServiceChildren(
    context.TransField,
    fixture.transFields,
    serviceId,
    function (value) {
      return { service: serviceId, fieldName: value.fieldName };
    },
  );
  await upsertServiceChildren(
    context.TransValidation,
    fixture.transValidations,
    serviceId,
    function (value) {
      return {
        service: serviceId,
        validateFunc: value.validateFunc,
        validateFields: value.validateFields,
      };
    },
  );

  var definition = clone(fixture.definition);
  definition.code = serviceId;
  definition.service = serviceId;
  replaceToken(definition, "$SEED_POCKET_ID", String(pocket.id));
  applyAudit(definition);
  await upsertOne(
    context.TransDefinition,
    { code: serviceId },
    definition,
  );

  return {
    action: serviceOperation.action,
    serviceCode: service.code,
    pocketId: String(pocket.id),
    fields: fixture.transFields.length,
    validations: fixture.transValidations.length,
  };
}

async function ensurePocket(context, pocketFixture, currency) {
  var criteria = {
    ownerType: pocketFixture.ownerType,
    ownerId: pocketFixture.ownerId,
    currency: currency.id,
  };
  var existing = await context.Pocket.findOne(criteria);
  var values = clone(pocketFixture);
  var balancePolicy = values.balancePolicy || "preserve";
  delete values.balancePolicy;

  if (existing && balancePolicy === "preserve") {
    values.balance = Number(existing.balance);
  } else if (existing && balancePolicy === "minimum") {
    values.balance = Math.max(
      Number(existing.balance),
      Number(values.balance || 0),
    );
  } else {
    values.balance = Number(values.balance || 0);
  }

  values.currency = currency.id;
  values.createdBy =
    existing && existing.createdBy ? existing.createdBy : "seed";
  values.updatedBy = "seed";
  values.checksum = context.CryptoService.checksumPocket(values);

  if (existing) {
    var updated = await context.Pocket.update({ id: existing.id }, values);
    return updated[0];
  }

  return context.Pocket.create(values);
}

async function upsertServiceChildren(model, fixtures, serviceId, criteriaFor) {
  for (var i = 0; i < fixtures.length; i += 1) {
    var values = clone(fixtures[i]);
    values.service = serviceId;
    applyAudit(values);
    await upsertOne(model, criteriaFor(values), values);
  }
}

async function upsertOne(model, criteria, values) {
  var existing = await model.findOne(criteria);
  if (existing) {
    var updated = await model.update({ id: existing.id }, values);
    return { action: "updated", record: updated[0] };
  }

  return { action: "created", record: await model.create(values) };
}

function applyAudit(values) {
  values.createdBy = values.createdBy || "seed";
  values.updatedBy = "seed";
}

function requiredEnvironment(env, name) {
  var value = clean(env[name]);
  if (!value) {
    throw new Error(
      name + " is required. Set it before running the officer seed.",
    );
  }
  return value;
}

function clean(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function validateServiceFixture(fixture) {
  if (
    !fixture ||
    fixture.kind !== "service" ||
    !fixture.currencyCode ||
    !fixture.pocket ||
    !fixture.service ||
    !fixture.definition ||
    !Array.isArray(fixture.transFields) ||
    !Array.isArray(fixture.transValidations)
  ) {
    throw new Error("Invalid service fixture");
  }
}

function replaceToken(value, token, replacement) {
  if (Array.isArray(value)) {
    value.forEach(function (item) {
      replaceToken(item, token, replacement);
    });
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  Object.keys(value).forEach(function (key) {
    if (value[key] === token) {
      value[key] = replacement;
    } else {
      replaceToken(value[key], token, replacement);
    }
  });
}
