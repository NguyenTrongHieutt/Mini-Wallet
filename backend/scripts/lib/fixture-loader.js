"use strict";

var fs = require("fs");
var path = require("path");

var SUPPORTED_SCHEMA_VERSION = 1;
var DEFAULT_FIXTURE_ROOT = path.resolve(__dirname, "../../fixtures");
var DEFAULT_MANIFEST = "manifest.v1.json";

module.exports = {
  loadManifest: function (fixtureRoot) {
    var root = fixtureRoot || DEFAULT_FIXTURE_ROOT;
    var manifest = readJson(path.join(root, DEFAULT_MANIFEST));

    validateVersion(manifest, DEFAULT_MANIFEST);
    if (!Array.isArray(manifest.seeds) || !manifest.seeds.length) {
      throw new Error("Seed manifest must define a non-empty seeds array");
    }

    var seen = {};
    manifest.seeds.forEach(function (entry) {
      if (!entry || !entry.id || !entry.handler) {
        throw new Error("Every seed manifest entry requires id and handler");
      }
      if (seen[entry.id]) {
        throw new Error("Duplicate seed id in manifest: " + entry.id);
      }
      seen[entry.id] = true;
    });

    return manifest;
  },

  loadFixture: function (fileName, fixtureRoot) {
    if (!fileName) {
      return null;
    }

    var root = fixtureRoot || DEFAULT_FIXTURE_ROOT;
    var resolvedRoot = path.resolve(root);
    var fixturePath = path.resolve(resolvedRoot, fileName);
    if (
      fixturePath !== resolvedRoot &&
      fixturePath.indexOf(resolvedRoot + path.sep) !== 0
    ) {
      throw new Error("Fixture path must remain inside the fixture directory");
    }

    var fixture = readJson(fixturePath);
    validateVersion(fixture, fileName);
    return fixture;
  },

  selectSeeds: function (manifest, requestedIds) {
    if (!requestedIds || !requestedIds.length) {
      return manifest.seeds.slice();
    }

    var byId = {};
    manifest.seeds.forEach(function (entry) {
      byId[entry.id] = entry;
    });

    return requestedIds.map(function (id) {
      if (!byId[id]) {
        throw new Error("Unknown seed id: " + id);
      }
      return byId[id];
    });
  },

  fixtureRoot: DEFAULT_FIXTURE_ROOT,
};

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    err.message = "Unable to load fixture " + filePath + ": " + err.message;
    throw err;
  }
}

function validateVersion(document, name) {
  if (
    !document ||
    document.schemaVersion !== SUPPORTED_SCHEMA_VERSION
  ) {
    throw new Error(
      "Unsupported schemaVersion in " +
        name +
        ". Expected " +
        SUPPORTED_SCHEMA_VERSION,
    );
  }
}
