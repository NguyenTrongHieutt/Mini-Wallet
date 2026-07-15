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
  TRANSACTION_TRIGGERED: "Transaction triggered successfully",
  TRANSACTION_TRIGGER_FAILED: "Transaction trigger failed",
  TRANSACTION_TRIGGER_REFERENCE_MISSING: "Transaction trigger did not return a reference",

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
  TRANSACTION_TRAIL_IDENTIFIER_REQUIRED: "Transaction trail id or transRefId is required",
  OFFICER_TRAILS_LISTED: "Transaction trails listed",
  OFFICER_TRAILS_LIST_FAILED: "Transaction trails list failed",
  OFFICER_TRAIL_DETAIL: "Transaction trail detail",
  OFFICER_TRAIL_DETAIL_FAILED: "Transaction trail detail failed",
  OFFICER_TRANSACTIONS_LISTED: "Officer transactions listed",
  OFFICER_TRANSACTIONS_LIST_FAILED: "Officer transactions list failed",
  OFFICER_TRANSACTION_DETAIL: "Officer transaction detail",
  OFFICER_TRANSACTION_DETAIL_FAILED: "Officer transaction detail failed",
  LEDGER_ENTRIES_LISTED: "Ledger entries listed",
  LEDGER_ENTRIES_LIST_FAILED: "Ledger entries list failed",
  LEDGER_ENTRY_DETAIL: "Ledger entry detail",
  LEDGER_ENTRY_DETAIL_FAILED: "Ledger entry detail failed",
  LEDGER_ENTRY_IDENTIFIER_REQUIRED: "Ledger entry id or entryId is required",
  LEDGER_ENTRY_NOT_FOUND: "Ledger entry not found",

  MOCK_BILL_CREATED: "Mock bill created",
  MOCK_BILL_CREATE_FAILED: "Mock bill creation failed",
  MOCK_BILL_INQUIRY_SUCCESS: "Mock bill inquiry succeeded",
  MOCK_BILL_INQUIRY_FAILED: "Mock bill inquiry failed",
  MOCK_BILL_PAYMENT_SUCCESS: "Mock bill payment succeeded",
  MOCK_BILL_PAYMENT_FAILED: "Mock bill payment failed",
  MOCK_BILL_PROVIDER_CODE_REQUIRED: "Mock bill providerCode is required",
  MOCK_BILL_PROVIDER_CODE_INVALID: "Mock bill providerCode format is invalid",
  MOCK_BILL_CODE_REQUIRED: "Mock bill billCode is required",
  MOCK_BILL_CODE_INVALID: "Mock bill billCode format is invalid",
  MOCK_BILL_AMOUNT_INVALID: "Mock bill amount must be a positive safe integer",
  MOCK_BILL_INFO_INVALID: "Mock bill billInfo must be an object",
  MOCK_BILL_ALREADY_EXISTS: "Mock bill already exists",
  MOCK_BILL_NOT_FOUND: "Mock bill not found",
  MOCK_BILL_TRANS_REF_REQUIRED: "Mock bill payment transRefId is required",
  MOCK_BILL_AMOUNT_MISMATCH: "Mock bill payment amount does not match",
  MOCK_BILL_ALREADY_PAID: "Mock bill was already paid by another transaction",
  DEV_API_DISABLED: "Development API is disabled in production",

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
  OFFICER_PROVIDER_CREATED: "Provider and provider pocket created",
  OFFICER_PROVIDER_CREATE_FAILED: "Provider creation failed",
  OFFICER_PROVIDERS_LISTED: "Officer providers listed",
  OFFICER_PROVIDERS_LIST_FAILED: "Officer providers list failed",
  OFFICER_PROVIDER_DETAIL: "Officer provider detail",
  OFFICER_PROVIDER_DETAIL_FAILED: "Officer provider detail failed",
  OFFICER_PROVIDER_UPDATED: "Provider updated",
  OFFICER_PROVIDER_UPDATE_FAILED: "Provider update failed",
  PROVIDER_ACTIVATED: "Provider activated",
  PROVIDER_ACTIVATE_FAILED: "Provider activation failed",
  PROVIDER_DEACTIVATED: "Provider deactivated",
  PROVIDER_DEACTIVATE_FAILED: "Provider deactivation failed",
  PROVIDER_IDENTIFIER_REQUIRED:
    "Provider id or serviceCode and providerCode are required",
  PROVIDER_TYPE_REQUIRED: "Provider type is required",
  PROVIDER_TYPE_INVALID: "Provider type format is invalid",
  PROVIDER_CODE_INVALID: "Provider code format is invalid",
  PROVIDER_SERVICE_CODE_INVALID: "Provider service code format is invalid",
  PROVIDER_NAME_REQUIRED: "Provider name is required",
  PROVIDER_NAME_LENGTH_INVALID:
    "Provider name must be between 2 and 100 characters",
  PROVIDER_CATEGORY_INVALID: "Provider category format is invalid",
  PROVIDER_URL_INVALID: "Provider URL must be a valid HTTP or HTTPS URL",
  PROVIDER_ALREADY_EXISTS:
    "A provider with this service code and provider code already exists",
  PROVIDER_UPDATE_REQUIRED: "At least one provider field must be supplied",
  PROVIDER_STATUS_INVALID: "Provider status must be active or inactive",
  OFFICER_SERVICE_CREATED: "Service draft created",
  OFFICER_SERVICE_CREATE_FAILED: "Service creation failed",
  OFFICER_SERVICES_LISTED: "Officer services listed",
  OFFICER_SERVICES_LIST_FAILED: "Officer services list failed",
  OFFICER_SERVICE_DETAIL: "Officer service detail",
  OFFICER_SERVICE_DETAIL_FAILED: "Officer service detail failed",
  OFFICER_SERVICE_UPDATED: "Service updated",
  OFFICER_SERVICE_UPDATE_FAILED: "Service update failed",
  SERVICE_IDENTIFIER_REQUIRED: "Service id or service code is required",
  SERVICE_CODE_INVALID: "Service code format is invalid",
  SERVICE_NAME_REQUIRED: "Service name is required",
  SERVICE_NAME_LENGTH_INVALID: "Service name must be between 2 and 100 characters",
  SERVICE_DESCRIPTION_LENGTH_INVALID: "Service description must not exceed 1000 characters",
  SERVICE_ACTIONS_INVALID: "Service actions must be an object",
  SERVICE_ACTION_NAME_INVALID: "Action name must be provider, request, confirm, verify or preview",
  SERVICE_ACTION_INVALID: "Action configuration must be an object",
  SERVICE_ACTIONS_UPDATED: "Service actions updated",
  SERVICE_ACTIONS_UPDATE_FAILED: "Service actions update failed",
  SERVICE_FEE_INVALID: "Service fee configuration is invalid",
  SERVICE_AUTH_INVALID: "Service auth method must be NONE or PIN",
  SERVICE_ALREADY_EXISTS: "A service with this code already exists",
  SERVICE_UPDATE_REQUIRED: "At least one service field must be supplied",
  SERVICE_STATUS_INVALID: "Service status must be draft, active or inactive",
  SERVICE_CONFIG_ACTIVE: "Unpublish the service before changing its configuration",
  SERVICE_TRANS_FIELDS_REQUIRED: "At least one active transaction field is required",
  SERVICE_TRANS_FIELD_UNBUILT: "An active transaction field is not produced by fieldBuilder",
  CONFIG_STATUS_INVALID: "Config status must be active or inactive",
  TRANS_FIELDS_LISTED: "Transaction fields listed",
  TRANS_FIELDS_LIST_FAILED: "Transaction fields list failed",
  TRANS_FIELD_INSERTED: "Transaction field inserted",
  TRANS_FIELD_INSERT_FAILED: "Transaction field insert failed",
  TRANS_FIELD_UPDATED: "Transaction field updated",
  TRANS_FIELD_UPDATE_FAILED: "Transaction field update failed",
  TRANS_FIELD_IDENTIFIER_REQUIRED: "Transaction field id is required",
  TRANS_FIELD_NOT_FOUND: "Transaction field not found",
  TRANS_FIELD_ALREADY_EXISTS: "A transaction field with this name already exists",
  TRANS_FIELD_INVALID: "Transaction field configuration is invalid",
  TRANS_FIELD_REGEX_INVALID: "Transaction field regex is invalid",
  TRANS_FIELD_UPDATE_REQUIRED: "At least one transaction field property must be supplied",
  TRANS_VALIDATIONS_LISTED: "Transaction validations listed",
  TRANS_VALIDATIONS_LIST_FAILED: "Transaction validations list failed",
  TRANS_VALIDATION_INSERTED: "Transaction validation inserted",
  TRANS_VALIDATION_INSERT_FAILED: "Transaction validation insert failed",
  TRANS_VALIDATION_UPDATED: "Transaction validation updated",
  TRANS_VALIDATION_UPDATE_FAILED: "Transaction validation update failed",
  TRANS_VALIDATION_IDENTIFIER_REQUIRED: "Transaction validation id is required",
  TRANS_VALIDATION_NOT_FOUND: "Transaction validation not found",
  TRANS_VALIDATION_ALREADY_EXISTS: "This transaction validation already exists",
  TRANS_VALIDATION_INVALID: "Transaction validation configuration is invalid",
  TRANS_VALIDATION_UPDATE_REQUIRED: "At least one transaction validation property must be supplied",
  FIELD_BUILDER_REQUIRED: "A non-empty fieldBuilder array is required",
  FIELD_BUILDER_INVALID: "fieldBuilder configuration is invalid",
  FIELD_BUILDER_UPDATED: "fieldBuilder updated",
  FIELD_BUILDER_UPDATE_FAILED: "fieldBuilder update failed",
  TRANS_DEFINITION_INVALID: "Transaction definition is invalid",
  TRANS_DEFINITION_DETAIL: "Transaction definition detail",
  TRANS_DEFINITION_DETAIL_FAILED: "Transaction definition detail failed",
  TRANS_DEFINITION_FIELD_UNKNOWN: "Transaction definition references an unknown runtime field",
  TRANS_DEFINITION_UPDATED: "Transaction definition updated",
  TRANS_DEFINITION_UPDATE_FAILED: "Transaction definition update failed",
  SERVICE_PUBLISHED: "Service published",
  SERVICE_PUBLISH_FAILED: "Service publish failed",
  SERVICE_UNPUBLISHED: "Service unpublished",
  SERVICE_UNPUBLISH_FAILED: "Service unpublish failed",

  REQUIRED_AUTH_TOKEN: "Missing bearer token",
  INVALID_TOKEN: "Invalid or expired token",
  USER_NOT_ACTIVE: "User is not active",
  AUTHENTICATION_FAILED: "Authentication failed",
  CUSTOMER_PERMISSION_REQUIRED: "Customer permission required",
  OFFICER_PERMISSION_REQUIRED: "Officer permission required",
  OFFICER_PROFILE: "Officer profile",
  OFFICER_CUSTOMERS_LISTED: "Officer customers listed",
  OFFICER_CUSTOMERS_LIST_FAILED: "Officer customers list failed",
  OFFICER_CUSTOMER_DETAIL: "Officer customer detail",
  OFFICER_CUSTOMER_DETAIL_FAILED: "Officer customer detail failed",
  CUSTOMER_IDENTIFIER_REQUIRED: "Customer id or phone is required",
  CUSTOMER_NOT_FOUND: "Customer not found",
  CUSTOMER_STATUS_INVALID: "Customer status must be active or locked",
  CUSTOMER_LOCKED: "Customer locked",
  CUSTOMER_LOCK_FAILED: "Customer lock failed",
  CUSTOMER_UNLOCKED: "Customer unlocked",
  CUSTOMER_UNLOCK_FAILED: "Customer unlock failed",
  OFFICER_POCKET_CREATED: "Pocket created",
  OFFICER_POCKET_CREATE_FAILED: "Pocket creation failed",
  OFFICER_POCKETS_LISTED: "Officer pockets listed",
  OFFICER_POCKETS_LIST_FAILED: "Officer pockets list failed",
  OFFICER_POCKET_DETAIL: "Officer pocket detail",
  OFFICER_POCKET_DETAIL_FAILED: "Officer pocket detail failed",
  POCKET_IDENTIFIER_REQUIRED: "Pocket id is required",
  POCKET_OWNER_TYPE_REQUIRED: "Pocket owner type is required",
  POCKET_OWNER_TYPE_INVALID: "Pocket owner type must be system or bank",
  POCKET_FILTER_OWNER_TYPE_INVALID: "Pocket owner type filter is invalid",
  POCKET_OWNER_ID_REQUIRED: "Pocket owner id is required",
  POCKET_OWNER_ID_LENGTH_INVALID: "Pocket owner id must not exceed 100 characters",
  POCKET_NAME_REQUIRED: "Pocket name is required",
  POCKET_NAME_LENGTH_INVALID: "Pocket name must be between 2 and 100 characters",
  POCKET_BALANCE_INVALID: "Pocket balance must be a non-negative safe integer",
  POCKET_ALREADY_EXISTS: "A pocket already exists for this owner and currency",
  POCKET_STATUS_INVALID: "Pocket status must be active or locked",
  POCKET_LOCKED: "Pocket locked",
  POCKET_LOCK_FAILED: "Pocket lock failed",
  POCKET_UNLOCKED: "Pocket unlocked",
  POCKET_UNLOCK_FAILED: "Pocket unlock failed",
  POCKET_TRANSACTION_LOCKED: "Pocket is temporarily locked by a transaction",
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
