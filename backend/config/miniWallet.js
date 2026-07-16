var env = process.env;
var nodeEnv = env.NODE_ENV || "development";

function integer(name, fallback, minimum) {
  var raw = env[name];
  var value = raw === undefined || raw === "" ? fallback : Number(raw);

  if (!Number.isFinite(value) || Math.floor(value) !== value) {
    throw new Error(name + " must be an integer");
  }
  if (minimum !== undefined && value < minimum) {
    throw new Error(name + " must be at least " + minimum);
  }

  return value;
}

function boolean(name, fallback) {
  if (env[name] === undefined || env[name] === "") {
    return fallback;
  }

  return String(env[name]).toLowerCase() === "true";
}

function durationSeconds(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (/^[0-9]+$/.test(String(value))) {
    return Number(value);
  }

  var match = /^([0-9]+)(s|m|h|d)$/i.exec(String(value));
  if (!match) {
    throw new Error(
      "AUTH_TOKEN_TTL_SECONDS/JWT_EXPIRES_IN must be seconds or a duration such as 24h",
    );
  }

  var multiplier = { s: 1, m: 60, h: 3600, d: 86400 };
  return Number(match[1]) * multiplier[match[2].toLowerCase()];
}

function requiredProductionSecret(name, value) {
  if (nodeEnv !== "production") {
    return;
  }

  if (
    !value ||
    value === "mini-wallet-dev-secret" ||
    value === "mini-wallet-dev-session-secret" ||
    value === "change-me-in-local-env"
  ) {
    throw new Error(name + " must be configured with a non-placeholder value");
  }
}

var jwtSecret = env.JWT_SECRET || "mini-wallet-dev-secret";
var sessionSecret =
  env.SESSION_SECRET || env.JWT_SECRET || "mini-wallet-dev-session-secret";
var authTokenTtlSeconds = durationSeconds(
  env.AUTH_TOKEN_TTL_SECONDS || env.JWT_EXPIRES_IN,
  24 * 60 * 60,
);

requiredProductionSecret("JWT_SECRET", jwtSecret);
requiredProductionSecret("SESSION_SECRET", sessionSecret);

module.exports.miniWallet = {
  environment: nodeEnv,
  database: {
    uri: env.MONGO_URI || "",
    host: env.MONGO_HOST || "127.0.0.1",
    port: integer("MONGO_PORT", 27017, 1),
    name: env.MONGO_DATABASE || "mini_wallet",
  },
  auth: {
    jwtSecret: jwtSecret,
    sessionSecret: sessionSecret,
    tokenTtlSeconds: authTokenTtlSeconds,
    cookieName: env.AUTH_COOKIE_NAME || "jwt",
    cookieSecure: boolean("COOKIE_SECURE", nodeEnv === "production"),
  },
  wallet: {
    defaultCurrency: String(env.DEFAULT_CURRENCY || "VND").toUpperCase(),
    registrationBalance: integer("REGISTRATION_BALANCE", 0, 0),
  },
  pagination: {
    defaultPageSize: integer("DEFAULT_PAGE_SIZE", 20, 1),
    maxPageSize: integer("MAX_PAGE_SIZE", 100, 1),
  },
  transactions: {
    trailTtlMs: integer("TRAIL_TTL_SECONDS", 15 * 60, 1) * 1000,
    pocketLockTtlMs: integer("POCKET_LOCK_TTL_SECONDS", 5 * 60, 1) * 1000,
    providerTimeoutMs: integer("PROVIDER_TIMEOUT_MS", 10000, 1),
  },
  cors: {
    origins:
      env.CORS_ORIGIN ||
      "http://localhost:3000,http://localhost:5173,http://localhost:8080",
  },
};
