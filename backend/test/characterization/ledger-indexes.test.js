"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");

var bootstrapPath = path.resolve(__dirname, "../../config/bootstrap.js");

module.exports = [
  {
    name: "enforces one transaction and one ledger entry per trail step",
    run: function () {
      var source = fs.readFileSync(bootstrapPath, "utf8");

      assert.ok(
        /model:\s*Transaction[\s\S]*?keys:\s*\{\s*transRefId:\s*1\s*\}[\s\S]*?unique:\s*true/.test(
          source,
        ),
        "Transaction.transRefId must have a unique index",
      );
      assert.ok(
        /model:\s*PocketEntry[\s\S]*?keys:\s*\{\s*transRefId:\s*1,\s*stepOrder:\s*1\s*\}[\s\S]*?unique:\s*true/.test(
          source,
        ),
        "PocketEntry trail and step order must have a compound unique index",
      );
    },
  },
];
