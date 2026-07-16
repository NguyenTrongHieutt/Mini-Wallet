"use strict";

var assert = require("assert");
var AuthService = require("../../api/services/AuthService");
var JwtService = require("../../api/services/JwtService");
var TOKEN_TTL_SECONDS = 24 * 60 * 60;

module.exports = [
  {
    name: "keeps the default JWT lifetime aligned with the auth session TTL",
    run: function () {
      var previousConfigService = global.MiniWalletConfigService;
      global.MiniWalletConfigService = configService();

      try {
        var token = JwtService.sign({ userId: "customer-1", userType: "customer" });
        var payload = JwtService.verify(token);

        assert.strictEqual(payload.exp - payload.iat, TOKEN_TTL_SECONDS);
      } finally {
        restoreGlobal("MiniWalletConfigService", previousConfigService);
      }
    },
  },
  {
    name: "uses the same TTL for persisted sessions and cookies",
    run: function () {
      var previousSession = global.Session;
      var previousCryptoService = global.CryptoService;
      var previousJwtService = global.JwtService;
      var previousConfigService = global.MiniWalletConfigService;
      var createdSession;
      var before = Date.now();

      global.Session = {
        create: function (session) {
          createdSession = session;
          return Promise.resolve(session);
        },
      };
      global.CryptoService = {
        hashToken: function (token) {
          return "hash:" + token;
        },
      };
      global.JwtService = {
        sign: function () {
          return "signed-token";
        },
      };
      global.MiniWalletConfigService = configService();

      return AuthService.createAuthSession({ id: "customer-1" }, "customer")
        .then(function (auth) {
          var after = Date.now();
          var tokenTtlMs = TOKEN_TTL_SECONDS * 1000;
          var minExpiry = before + tokenTtlMs;
          var maxExpiry = after + tokenTtlMs;

          assert.strictEqual(auth.token, "signed-token");
          assert.strictEqual(createdSession.expiredAt, auth.expiredAt);
          assert.ok(auth.expiredAt.getTime() >= minExpiry);
          assert.ok(auth.expiredAt.getTime() <= maxExpiry);
          assert.strictEqual(AuthService.cookieOptions().maxAge, tokenTtlMs);
        })
        .then(
          function () {
            restoreGlobal("Session", previousSession);
            restoreGlobal("CryptoService", previousCryptoService);
            restoreGlobal("JwtService", previousJwtService);
            restoreGlobal("MiniWalletConfigService", previousConfigService);
          },
          function (err) {
            restoreGlobal("Session", previousSession);
            restoreGlobal("CryptoService", previousCryptoService);
            restoreGlobal("JwtService", previousJwtService);
            restoreGlobal("MiniWalletConfigService", previousConfigService);
            throw err;
          },
        );
    },
  },
];

function configService() {
  return {
    auth: function () {
      return {
        cookieName: "jwt",
        cookieSecure: false,
        jwtSecret: "backend-characterization-test-secret",
        tokenTtlSeconds: TOKEN_TTL_SECONDS,
      };
    },
  };
}

function restoreGlobal(name, value) {
  if (value === undefined) {
    delete global[name];
  } else {
    global[name] = value;
  }
}
