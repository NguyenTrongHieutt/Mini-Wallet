"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");

module.exports = [
  {
    name: "keeps transaction business logic in runtime services",
    run: function () {
      var serviceModel = read("api/models/Service.js");
      var fieldModel = read("api/models/TransField.js");
      var validationModel = read("api/models/TransValidation.js");
      var runtime = read("api/services/RuntimeProcessService.js");
      var inputFields = read("api/services/ServiceInputFieldService.js");

      assert.ok(/ServiceRuntimeService\.buildTransactionFields/.test(serviceModel));
      assert.strictEqual(/function resolveField/.test(serviceModel), false);
      assert.strictEqual(/ProviderActionGatewayService\.run/.test(serviceModel), false);

      assert.ok(
        /TransactionFieldValidationService\.validateFields/.test(fieldModel),
      );
      assert.strictEqual(/function validateOneField/.test(fieldModel), false);

      assert.ok(
        /TransactionValidationService\.validateTransaction/.test(
          validationModel,
        ),
      );
      assert.strictEqual(/function buildRoleRule/.test(validationModel), false);

      assert.ok(
        /ServiceRuntimeService\.buildTransactionFields/.test(runtime),
      );
      assert.ok(
        /TransactionFieldValidationService\.validateFields/.test(runtime),
      );
      assert.ok(
        /TransactionValidationService\.validateTransaction/.test(runtime),
      );
      assert.strictEqual(/TransField\.validateFields/.test(runtime), false);
      assert.strictEqual(
        /TransValidation\.validateTransaction/.test(runtime),
        false,
      );

      assert.ok(
        /ServiceRuntimeService\.loadActiveByCode/.test(inputFields),
      );
      assert.ok(/ServiceRuntimeService\.sortByOrder/.test(inputFields));
    },
  },
];

function read(relativePath) {
  return fs.readFileSync(
    path.resolve(__dirname, "../..", relativePath),
    "utf8",
  );
}
