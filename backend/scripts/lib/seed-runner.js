"use strict";

var loader = require("./fixture-loader");
var operations = require("./seed-operations");

module.exports = {
  run: async function (options) {
    options = options || {};
    var manifest = loader.loadManifest(options.fixtureRoot);
    var entries = loader.selectSeeds(manifest, options.seedIds);
    var context = options.context;
    var env = options.env || process.env;
    var results = [];

    if (!context) {
      throw new Error("Seed context is required");
    }

    for (var i = 0; i < entries.length; i += 1) {
      var entry = entries[i];
      var handler = operations[entry.handler];
      if (typeof handler !== "function") {
        throw new Error("Unsupported seed handler: " + entry.handler);
      }

      var fixture = loader.loadFixture(entry.fixture, options.fixtureRoot);
      var result = await handler(context, fixture, env);
      results.push({ id: entry.id, result: result });
    }

    return results;
  },
};
