"use strict";

var sails = require("sails");
var seedRunner = require("./seed-runner");

module.exports = {
  run: function (seedIds) {
    sails.load(
      { hooks: { grunt: false }, log: { level: "warn" } },
      function loadApp(err) {
        if (err) {
          console.error("Failed to load Sails:", err);
          return process.exit(1);
        }

        seedRunner
          .run({
            seedIds: seedIds,
            context: buildContext(),
            env: process.env,
          })
          .then(function (results) {
            results.forEach(logResult);
            lowerAndExit(0);
          })
          .catch(function (seedErr) {
            console.error("Seed failed:", seedErr.message || seedErr);
            lowerAndExit(1);
          });
      },
    );
  },
};

function buildContext() {
  return {
    Currency: Currency,
    Officer: Officer,
    Pocket: Pocket,
    Service: Service,
    TransField: TransField,
    TransValidation: TransValidation,
    TransDefinition: TransDefinition,
    CryptoService: CryptoService,
  };
}

function logResult(entry) {
  var result = entry.result || {};
  if (entry.id === "currencies") {
    console.log(
      "Seeded currencies. Created: " +
        result.created +
        ", Updated: " +
        result.updated +
        ", Total: " +
        result.total,
    );
    return;
  }

  if (entry.id === "officer") {
    console.log("Officer seed " + result.action);
    return;
  }

  console.log(
    "Seeded " +
      result.serviceCode +
      " service. Fields: " +
      result.fields +
      ", validations: " +
      result.validations +
      ", pocket: " +
      result.pocketId,
  );
}

function lowerAndExit(exitCode) {
  sails.lower(function () {
    process.exit(exitCode);
  });
}
