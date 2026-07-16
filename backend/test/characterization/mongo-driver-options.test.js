"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var mongodbVersion = require("../../node_modules/mongodb/package.json").version;

var ledgerRepositoryPath = path.resolve(
  __dirname,
  "../../api/services/LedgerRepositoryService.js",
);
var runtimeProcessPath = path.resolve(
  __dirname,
  "../../api/services/RuntimeProcessService.js",
);

module.exports = [
  {
    name: "uses MongoDB 3.6 compatible after-update options for ledger writes",
    run: function () {
      var source = fs.readFileSync(ledgerRepositoryPath, "utf8");
      var runtimeSource = fs.readFileSync(runtimeProcessPath, "utf8");
      var findOneAndUpdateCount = occurrences(source, /\.findOneAndUpdate\s*\(/g);
      var returnOriginalFalseCount = occurrences(
        source,
        /returnOriginal\s*:\s*false/g,
      );
      var mongodbMajor = Number(mongodbVersion.split(".")[0]);

      assert.strictEqual(mongodbMajor, 3, "characterization targets mongodb 3.x");
      assert.ok(
        findOneAndUpdateCount > 0,
        "ledger runtime must contain an atomic findOneAndUpdate",
      );
      assert.strictEqual(
        returnOriginalFalseCount,
        findOneAndUpdateCount,
        "every ledger findOneAndUpdate must return the updated document",
      );
      assert.strictEqual(
        /returnDocument\s*:/.test(source),
        false,
        "mongodb 3.6 does not use the returnDocument option",
      );
      assert.strictEqual(
        /\.collections\./.test(runtimeSource),
        false,
        "runtime orchestration must not access raw Mongo collections",
      );
    },
  },
];

function occurrences(source, pattern) {
  var matches = source.match(pattern);
  return matches ? matches.length : 0;
}
