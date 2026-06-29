module.exports = {
  validateRegisterPayload: function (body) {
    const errors = [];

    if (!this.isObject(body)) {
      this.addError(errors, "body", "BODY_REQUIRED");
      this.rejectValidation(errors);
    }

    body.phone = this.cleanString(body.phone);
    body.password = this.cleanString(body.password);
    body.pin = this.cleanString(body.pin);
    body.displayName = this.cleanString(body.displayName);
    body.currency = this.cleanString(body.currency).toUpperCase();

    this.validatePhone(body.phone, errors);
    this.validatePassword(body.password, errors);
    this.validatePin(body.pin, errors);
    this.validateDisplayName(body.displayName, errors);
    this.validateCurrency(body.currency, errors);

    if (errors.length) {
      this.rejectValidation(errors);
    }
  },

  validateLoginPayload: function (body) {
    const errors = [];

    if (!this.isObject(body)) {
      this.addError(errors, "body", "BODY_REQUIRED");
      this.rejectValidation(errors);
    }

    body.phone = this.cleanString(body.phone);
    body.password = this.cleanString(body.password);

    this.validatePhone(body.phone, errors);

    if (!body.password) {
      this.addError(errors, "password", "PASSWORD_REQUIRED");
    } else if (body.password.length < 8 || body.password.length > 72) {
      this.addError(errors, "password", "PASSWORD_LENGTH_INVALID");
    }

    if (errors.length) {
      this.rejectValidation(errors);
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

  validatePhone: function (phone, errors) {
    if (!phone) {
      this.addError(errors, "phone", "PHONE_REQUIRED");
      return;
    }

    if (!/^\+?[0-9]{9,15}$/.test(phone)) {
      this.addError(errors, "phone", "PHONE_FORMAT_INVALID");
    }
  },

  validatePassword: function (password, errors) {
    if (!password) {
      this.addError(errors, "password", "PASSWORD_REQUIRED");
      return;
    }

    if (password.length < 8 || password.length > 72) {
      this.addError(errors, "password", "PASSWORD_LENGTH_INVALID");
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      this.addError(errors, "password", "PASSWORD_WEAK");
    }
  },

  validatePin: function (pin, errors) {
    if (!pin) {
      this.addError(errors, "pin", "PIN_REQUIRED");
      return;
    }

    if (!/^[0-9]{6}$/.test(pin)) {
      this.addError(errors, "pin", "PIN_FORMAT_INVALID");
    }
  },

  validateDisplayName: function (displayName, errors) {
    if (!displayName) {
      return;
    }

    if (displayName.length < 2 || displayName.length > 60) {
      this.addError(errors, "displayName", "DISPLAY_NAME_LENGTH_INVALID");
    }
  },

  validateCurrency: function (currency, errors) {
    if (!currency) {
      return;
    }

    if (!/^[A-Z]{3}$/.test(currency)) {
      this.addError(errors, "currency", "CURRENCY_FORMAT_INVALID");
    }
  },

  addError: function (errors, field, messageKey) {
    errors.push({
      field: field,
      messageKey: messageKey,
      message: EnvelopeService.message(messageKey),
    });
  },

  cleanString: function (value) {
    if (value === undefined || value === null) {
      return "";
    }

    return String(value).trim();
  },

  isObject: function (value) {
    return value && typeof value === "object" && !Array.isArray(value);
  },

  rejectValidation: function (errors) {
    throw AppErrorService.create(EnvelopeService.CODE.BAD_REQUEST, "VALIDATION_FAILED", {
      errors: errors,
    });
  },
};
