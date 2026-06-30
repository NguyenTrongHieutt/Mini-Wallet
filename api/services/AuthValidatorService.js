module.exports = {
  validateRegisterPayload: function (body) {
    const errors = [];

    if (!CommonService.isPlainObject(body)) {
      addError(errors, "body", "BODY_REQUIRED");
      rejectValidation(errors);
    }

    body.phone = CommonService.cleanString(body.phone);
    body.password = CommonService.cleanString(body.password);
    body.pin = CommonService.cleanString(body.pin);
    body.displayName = CommonService.cleanString(body.displayName);
    body.currency = CommonService.cleanUpperString(body.currency);

    validatePhone(body.phone, errors);
    validatePassword(body.password, errors);
    validatePin(body.pin, errors);
    validateDisplayName(body.displayName, errors);
    validateCurrency(body.currency, errors);

    if (errors.length) {
      rejectValidation(errors);
    }
  },

  validateLoginPayload: function (body) {
    const errors = [];

    if (!CommonService.isPlainObject(body)) {
      addError(errors, "body", "BODY_REQUIRED");
      rejectValidation(errors);
    }

    body.phone = CommonService.cleanString(body.phone);
    body.password = CommonService.cleanString(body.password);

    validatePhone(body.phone, errors);

    if (!body.password) {
      addError(errors, "password", "PASSWORD_REQUIRED");
    } else if (body.password.length < 8 || body.password.length > 72) {
      addError(errors, "password", "PASSWORD_LENGTH_INVALID");
    }

    if (errors.length) {
      rejectValidation(errors);
    }
  },

  validateLogoutInput: function (user) {
    if (!user || !user.sessionId) {
      throw AppErrorService.create(EnvelopeService.CODE.UNAUTHORIZED, "UNAUTHENTICATED");
    }

    if (!user.user || !user.user.id || !user.userType) {
      throw AppErrorService.create(EnvelopeService.CODE.UNAUTHORIZED, "UNAUTHENTICATED");
    }

    if (["customer", "officer"].indexOf(user.userType) === -1) {
      throw AppErrorService.create(EnvelopeService.CODE.UNAUTHORIZED, "UNAUTHENTICATED");
    }
  },

};

function validatePhone(phone, errors) {
  if (!phone) {
    addError(errors, "phone", "PHONE_REQUIRED");
    return;
  }

  if (!/^\+?[0-9]{9,15}$/.test(phone)) {
    addError(errors, "phone", "PHONE_FORMAT_INVALID");
  }
}

function validatePassword(password, errors) {
  if (!password) {
    addError(errors, "password", "PASSWORD_REQUIRED");
    return;
  }

  if (password.length < 8 || password.length > 72) {
    addError(errors, "password", "PASSWORD_LENGTH_INVALID");
  }

  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    addError(errors, "password", "PASSWORD_WEAK");
  }
}

function validatePin(pin, errors) {
  if (!pin) {
    addError(errors, "pin", "PIN_REQUIRED");
    return;
  }

  if (!/^[0-9]{6}$/.test(pin)) {
    addError(errors, "pin", "PIN_FORMAT_INVALID");
  }
}

function validateDisplayName(displayName, errors) {
  if (!displayName) {
    return;
  }

  if (displayName.length < 2 || displayName.length > 60) {
    addError(errors, "displayName", "DISPLAY_NAME_LENGTH_INVALID");
  }
}

function validateCurrency(currency, errors) {
  if (!currency) {
    return;
  }

  if (!/^[A-Z]{3}$/.test(currency)) {
    addError(errors, "currency", "CURRENCY_FORMAT_INVALID");
  }
}

function addError(errors, field, messageKey) {
  errors.push({
    field: field,
    messageKey: messageKey,
    message: EnvelopeService.message(messageKey),
  });
}

function rejectValidation(errors) {
  throw AppErrorService.create(EnvelopeService.CODE.BAD_REQUEST, "VALIDATION_FAILED", {
    errors: errors,
  });
}
