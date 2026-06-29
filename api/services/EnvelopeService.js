var CODE = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INVALID_STATE: 422,
  SERVER_ERROR: 500,
};

var MESSAGE = {
  OK: "OK",
  ERROR: "Error",
  BAD_REQUEST: "Bad request",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Not found",
  SERVER_ERROR: "Server error",

  REGISTER_FAILED: "Register failed",
  LOGIN_FAILED: "Login failed",
  LOGOUT_FAILED: "Logout failed",
  REQUIRED_PHONE_PIN: "phone and pin are required",
  REQUIRED_PHONE_SECRET: "phone and password/pin are required",
  VALIDATION_FAILED: "Validation failed",
  BODY_REQUIRED: "Request body is required",
  PHONE_REQUIRED: "Phone is required",
  PHONE_FORMAT_INVALID: "Phone must contain 9 to 15 digits",
  PASSWORD_REQUIRED: "Password is required",
  PASSWORD_LENGTH_INVALID: "Password must be between 8 and 72 characters",
  PASSWORD_WEAK: "Password must include at least one letter and one number",
  PIN_REQUIRED: "PIN is required",
  PIN_FORMAT_INVALID: "PIN must be exactly 6 digits",
  DISPLAY_NAME_LENGTH_INVALID: "Display name must be between 2 and 60 characters",
  CURRENCY_FORMAT_INVALID: "Currency must be a 3-letter ISO code",
  CUSTOMER_PHONE_EXISTS: "Customer phone already exists",
  DEFAULT_CURRENCY_NOT_FOUND: "Default currency not found",
  CUSTOMER_REGISTERED: "Customer registered",
  INVALID_CREDENTIALS: "Invalid credentials",
  LOGIN_SUCCESS: "Login success",
  LOGOUT_SUCCESS: "Logout success",
  UNAUTHENTICATED: "Unauthenticated",

  REQUIRED_AUTH_TOKEN: "Missing bearer token",
  INVALID_TOKEN: "Invalid or expired token",
  USER_NOT_ACTIVE: "User is not active",
  AUTHENTICATION_FAILED: "Authentication failed",
  CUSTOMER_PERMISSION_REQUIRED: "Customer permission required",
  OFFICER_PERMISSION_REQUIRED: "Officer permission required",
};

module.exports = {
  CODE: CODE,
  MESSAGE: MESSAGE,

  format: function (code, messageKey, data) {
    var payload = {
      err: code,
      message: this.message(messageKey),
    };

    if (data !== undefined) {
      payload.data = data;
    }

    return payload;
  },

  message: function (messageKey) {
    if (!messageKey) {
      return MESSAGE.OK;
    }

    return MESSAGE[messageKey] || messageKey;
  },

  normalize: function (args, defaultCode, defaultMessageKey) {
    var first = args[0];

    if (
      first &&
      typeof first === "object" &&
      first.err !== undefined &&
      first.message !== undefined
    ) {
      return {
        code: first.err,
        message: first.message,
        data: first.data,
      };
    }

    if (
      first &&
      typeof first === "object" &&
      first.code !== undefined &&
      first.message !== undefined
    ) {
      return {
        code: first.code,
        message: first.message,
        data: first.data,
      };
    }

    if (typeof first === "number") {
      return {
        code: first,
        message: args[1] || defaultMessageKey,
        data: args[2],
      };
    }

    if (typeof first === "string") {
      return {
        code: defaultCode,
        message: first,
        data: args[1],
      };
    }

    return {
      code: defaultCode,
      message: defaultMessageKey,
      data: first,
    };
  },
  handleError: function handleError(res, err, fallbackMessage) {
    if (err && err.isAppError) {
      return res.error(err.code, err.messageKey, err.data);
    }

    sails.log.error(err);

    return res.error(EnvelopeService.CODE.SERVER_ERROR, fallbackMessage);
  },
};
