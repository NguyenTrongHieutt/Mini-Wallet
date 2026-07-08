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
  DISPLAY_NAME_LENGTH_INVALID:
    "Display name must be between 2 and 60 characters",
  CURRENCY_FORMAT_INVALID: "Currency must be a 3-letter ISO code",
  CUSTOMER_PHONE_EXISTS: "Customer phone already exists",
  DEFAULT_CURRENCY_NOT_FOUND: "Default currency not found",
  CUSTOMER_REGISTERED: "Customer registered",
  INVALID_CREDENTIALS: "Invalid credentials",
  LOGIN_SUCCESS: "Login success",
  LOGOUT_SUCCESS: "Logout success",
  UNAUTHENTICATED: "Unauthenticated",

  TRANSACTION_REQUESTED: "Transaction request created",
  TRANSACTION_REQUEST_FAILED: "Transaction request failed",
  TRANSACTION_CONFIRMED: "Transaction confirmed",
  TRANSACTION_CONFIRM_FAILED: "Transaction confirm failed",
  TRANSACTION_VERIFIED: "Transaction verified",
  TRANSACTION_VERIFY_FAILED: "Transaction verify failed",

  CUSTOMER_TRANSACTIONS_LISTED: "Customer transactions listed",
  CUSTOMER_TRANSACTIONS_LIST_FAILED: "Customer transactions list failed",
  CUSTOMER_TRANSACTION_DETAIL: "Customer transaction detail",
  CUSTOMER_TRANSACTION_DETAIL_FAILED: "Customer transaction detail failed",
  CUSTOMER_SERVICES_LISTED: "Customer services listed",
  CUSTOMER_SERVICES_LIST_FAILED: "Customer services list failed",
  CUSTOMER_PROVIDERS_LISTED: "Customer providers listed",
  CUSTOMER_PROVIDERS_LIST_FAILED: "Customer providers list failed",
  SERVICE_INPUT_FIELDS: "Service input fields",
  SERVICE_INPUT_FIELDS_FAILED: "Service input fields failed",

  TRANSACTION_NOT_FOUND: "Transaction not found",
  TRANSACTION_IDENTIFIER_REQUIRED: "Transaction identifier is required",
  TRANSACTION_TRAIL_NOT_FOUND: "Transaction trail not found",
  TRANSACTION_TRAIL_EXPIRED: "Transaction trail expired",
  TRANSACTION_TRAIL_FORBIDDEN: "Transaction trail access denied",
  TRANSACTION_TRAIL_NOT_PENDING: "Transaction trail is not pending",

  INVALID_PIN: "Invalid PIN",
  UNSUPPORTED_AUTH_METHOD: "Unsupported auth method",
  TRANS_DEFINITION_NOT_FOUND: "Transaction definition not found",
  LEDGER_AMOUNT_INVALID: "Ledger amount is invalid",
  SENDER_POCKET_NOT_ACTIVE: "Sender pocket is not active",
  SENDER_POCKET_LOCK_FAILED: "Sender pocket lock failed",
  DEBIT_POCKET_NOT_FOUND: "Debit pocket not found",
  CREDIT_POCKET_NOT_FOUND: "Credit pocket not found",
  POCKET_NOT_ACTIVE: "Pocket is not active",
  POCKET_NOT_FOUND: "Pocket not found",
  POCKET_CHECKSUM_INVALID: "Pocket checksum is invalid",
  DEBIT_POCKET_CHECKSUM_INVALID: "Debit pocket checksum is invalid",
  CREDIT_POCKET_CHECKSUM_INVALID: "Credit pocket checksum is invalid",
  UNSUPPORTED_LEDGER_TARGET: "Unsupported ledger target",
  POCKET_UPDATE_FAILED: "Pocket update failed",
  MONGO_TRANSACTION_UNAVAILABLE: "Mongo transaction is unavailable",
  SERVICE_CODE_REQUIRED: "Service code is required",
  SERVICE_NOT_FOUND: "Service not found",
  SERVICE_INACTIVE: "Service is inactive",
  TRANSACTION_FIELD_INVALID: "Transaction field is invalid",
  TRANSACTION_FIELD_BUILD_FAILED: "Transaction field build failed",
  RECEIVER_PHONE_REQUIRED: "Receiver phone is required",
  RECEIVER_PHONE_INVALID: "Receiver phone is invalid",
  RECEIVER_NOT_FOUND: "Receiver not found",
  AMOUNT_REQUIRED: "Amount is required",
  AMOUNT_INVALID: "Amount is invalid",
  CURRENCY_REQUIRED: "Currency is required",
  CURRENCY_INVALID: "Currency is invalid",
  CURRENCY_NOT_FOUND: "Currency not found",
  SENDER_POCKET_NOT_FOUND: "Sender pocket not found",
  RECEIVER_POCKET_NOT_FOUND: "Receiver pocket not found",
  SELF_TRANSFER: "Cannot transfer to the same wallet",
  INSUFFICIENT_BALANCE: "Insufficient balance",
  ROLE_REQUIRED: "Role is required",
  ROLE_NOT_ALLOWED: "Role is not allowed",
  VALIDATION_CONFIG_INVALID: "Validation config is invalid",
  UNSUPPORTED_FIELD_BUILDER_RULE: "Unsupported field builder rule",
  UNSUPPORTED_FIELD_BUILDER_QUERY: "Unsupported field builder query",
  UNSUPPORTED_VALIDATION_RULE: "Unsupported validation rule",
  PROVIDER_CODE_REQUIRED: "Provider code is required",
  PROVIDER_NOT_FOUND: "Provider not found",
  PROVIDER_ACTION_URL_REQUIRED: "Provider action URL is required",
  PROVIDER_ACTION_FAILED: "Provider action failed",
  PROVIDER_ACTION_TIMEOUT: "Provider action timeout",
  PROVIDER_RESPONSE_INVALID: "Provider response is invalid",

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
      payload.data = { ...data };
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
