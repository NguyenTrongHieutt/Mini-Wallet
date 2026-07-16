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
      await runValidation(validations[i], transBody, service);
    }
  },
};

async function runValidation(validation, transBody, service) {
  if (validation.validateFunc === "validateReceiverIsNotSender") {
    return validateReceiverIsNotSender(validation, transBody);
  }

  if (validation.validateFunc === "validateSenderAccountSufficiency") {
    return validateSenderAccountSufficiency(validation, transBody);
  }

  if (
    validation.validateFunc === "validateRole" ||
    validation.validateFunc === "validateUserRole" ||
    validation.validateFunc === "validateFieldRole" ||
    validation.validateFunc === "checkRole" ||
    validation.validateFunc === "checkUserRole"
  ) {
    return validateRole(validation, transBody, service);
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

function validateRole(validation, transBody, service) {
  const rule = buildRoleRule(validation, service);
  const value = transBody[rule.field];
  const actualRoles = normalizeRoles(value);

  if (!actualRoles.length) {
    throw AppErrorService.create(
      EnvelopeService.CODE.FORBIDDEN,
      validation.errorCode || "ROLE_REQUIRED",
      { field: rule.field },
    );
  }

  if (rule.denied.length && hasRole(actualRoles, rule.denied)) {
    throw AppErrorService.create(
      EnvelopeService.CODE.FORBIDDEN,
      validation.errorCode || "ROLE_NOT_ALLOWED",
      { field: rule.field, value: value, denied: rule.denied },
    );
  }

  if (rule.allowed.length && !hasRole(actualRoles, rule.allowed)) {
    throw AppErrorService.create(
      EnvelopeService.CODE.FORBIDDEN,
      validation.errorCode || "ROLE_NOT_ALLOWED",
      { field: rule.field, value: value, allowed: rule.allowed },
    );
  }
}

function buildRoleRule(validation, service) {
  const config = parseValidationConfig(validation.validateFields);
  let field = config.field || config.roleField;

  if (!field && config.fieldRole) {
    field = findFieldNameByRole(service, config.fieldRole);
  }

  if (!field && config.parts.length > 1) {
    field = config.parts[0];
    config.allowed = config.parts.slice(1).join(":");
  }

  if (!field) {
    field = "USERTYPE";
  }

  const allowed = normalizeRoles(
    config.allowed || config.roles || config.equals || config.value,
  );
  const denied = normalizeRoles(config.denied || config.notIn);

  if (!allowed.length && !denied.length && config.parts.length === 1) {
    allowed.push.apply(allowed, normalizeRoles(config.parts[0]));
  }

  return {
    field: field,
    allowed: allowed,
    denied: denied,
  };
}

function parseValidationConfig(validateFields) {
  const raw = CommonService.cleanString(validateFields);
  if (!raw) {
    return { parts: [] };
  }

  if (raw.charAt(0) === "{") {
    try {
      const parsed = JSON.parse(raw);
      parsed.parts = [];
      return parsed;
    } catch (err) {
      throw AppErrorService.create(
        EnvelopeService.CODE.BAD_REQUEST,
        "VALIDATION_CONFIG_INVALID",
        { validateFields: validateFields },
      );
    }
  }

  return {
    parts: raw.split(":").map(function (part) {
      return CommonService.cleanString(part);
    }),
  };
}

function findFieldNameByRole(service, role) {
  const expectedRole = CommonService.cleanString(role).toLowerCase();
  const fieldBuilder = (service && service.fieldBuilder) || [];

  for (let i = 0; i < fieldBuilder.length; i += 1) {
    if (
      CommonService.cleanString(fieldBuilder[i].role).toLowerCase() ===
      expectedRole
    ) {
      return fieldBuilder[i].name;
    }
  }

  throw AppErrorService.create(
    EnvelopeService.CODE.BAD_REQUEST,
    "VALIDATION_CONFIG_INVALID",
    { fieldRole: role },
  );
}

function normalizeRoles(value) {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    const result = [];
    for (let i = 0; i < value.length; i += 1) {
      result.push.apply(result, normalizeRoles(value[i]));
    }

    return result;
  }

  return String(value)
    .split(",")
    .map(function (role) {
      return CommonService.cleanString(role).toLowerCase();
    })
    .filter(function (role) {
      return !!role;
    });
}

function hasRole(actualRoles, expectedRoles) {
  for (let i = 0; i < expectedRoles.length; i += 1) {
    if (actualRoles.indexOf(expectedRoles[i]) !== -1) {
      return true;
    }
  }

  return false;
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
