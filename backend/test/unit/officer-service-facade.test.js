"use strict";

var assert = require("assert");
var facade = require("../../api/services/OfficerServiceService");
var crud = require("../../api/services/OfficerServiceCrudService");
var configuration = require(
  "../../api/services/OfficerServiceConfigurationService",
);
var transFields = require("../../api/services/OfficerTransFieldService");
var transValidations = require(
  "../../api/services/OfficerTransValidationService",
);

module.exports = [
  {
    name: "keeps the legacy officer service facade contract",
    run: function () {
      assert.deepStrictEqual(Object.keys(facade).sort(), [
        "create",
        "detail",
        "detailTransDefinition",
        "insertTransField",
        "insertTransValidation",
        "list",
        "listTransFields",
        "listTransValidations",
        "publish",
        "unpublish",
        "update",
        "updateActions",
        "updateFieldBuilder",
        "updateTransDefinition",
        "updateTransField",
        "updateTransValidation",
      ]);
    },
  },
  {
    name: "delegates each facade method to its focused service",
    run: function () {
      assert.strictEqual(facade.create, crud.create);
      assert.strictEqual(facade.list, crud.list);
      assert.strictEqual(facade.detail, crud.detail);
      assert.strictEqual(facade.update, crud.update);
      assert.strictEqual(facade.publish, crud.publish);
      assert.strictEqual(facade.unpublish, crud.unpublish);

      assert.strictEqual(facade.listTransFields, transFields.list);
      assert.strictEqual(facade.insertTransField, transFields.insert);
      assert.strictEqual(facade.updateTransField, transFields.update);

      assert.strictEqual(facade.listTransValidations, transValidations.list);
      assert.strictEqual(facade.insertTransValidation, transValidations.insert);
      assert.strictEqual(facade.updateTransValidation, transValidations.update);

      assert.strictEqual(
        facade.updateFieldBuilder,
        configuration.updateFieldBuilder,
      );
      assert.strictEqual(facade.updateActions, configuration.updateActions);
      assert.strictEqual(
        facade.detailTransDefinition,
        configuration.detailTransDefinition,
      );
      assert.strictEqual(
        facade.updateTransDefinition,
        configuration.updateTransDefinition,
      );
    },
  },
];
