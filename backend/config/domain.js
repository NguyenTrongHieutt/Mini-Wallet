module.exports.domain = {
  status: {
    ACTIVE: "active",
    INACTIVE: "inactive",
    LOCKED: "locked",
    REVOKED: "revoked",
    EXPIRED: "expired",
    INIT: "init",
    DRAFT: "draft",
    PENDING: "pending",
    DONE: "done",
    FAILED: "failed",
    CANCELLED: "cancelled",
    SETTLED: "settled",
  },
  ownerType: {
    CUSTOMER: "customer",
    PROVIDER: "provider",
    SYSTEM: "system",
    BANK: "bank",
  },
  userType: {
    CUSTOMER: "customer",
    OFFICER: "officer",
  },
  authMethod: {
    NONE: "NONE",
    PIN: "PIN",
  },
  ledgerLevel: {
    WALLET: "wallet",
    PRODUCT: "productLevel",
  },
  action: {
    PROVIDER: "provider",
    REQUEST: "request",
    CONFIRM: "confirm",
    VERIFY: "verify",
    PREVIEW: "preview",
  },
};
