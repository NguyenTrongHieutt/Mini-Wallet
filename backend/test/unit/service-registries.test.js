"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var FieldBuilderRegistryService = require(
  "../../api/services/FieldBuilderRegistryService",
);
var ValidationRegistryService = require(
  "../../api/services/ValidationRegistryService",
);
var ProviderActionGatewayService = require(
  "../../api/services/ProviderActionGatewayService",
);

module.exports = [
  {
    name: "keeps field-builder database queries behind an explicit allowlist",
    run: function () {
      var previousCustomer = global.Customer;
      var received;

      global.Customer = {
        getActiveCustomerByPhone: function () {
          received = Array.prototype.slice.call(arguments);
          return { id: "customer-1" };
        },
      };

      try {
        assert.deepStrictEqual(FieldBuilderRegistryService.names(), [
          "Customer.getActiveCustomerByPhone",
          "Pocket.getActivePocketByOwner",
        ]);
        assert.strictEqual(
          FieldBuilderRegistryService.supports(
            "Customer.getActiveCustomerByPhone",
          ),
          true,
        );
        assert.strictEqual(
          FieldBuilderRegistryService.supports("process.exit"),
          false,
        );
        assert.deepStrictEqual(
          FieldBuilderRegistryService.execute(
            "Customer.getActiveCustomerByPhone",
            ["0900000000", { SERVICECODE: "P2P" }],
          ),
          { id: "customer-1" },
        );
        assert.deepStrictEqual(received, [
          "0900000000",
          { SERVICECODE: "P2P" },
        ]);
      } finally {
        restoreGlobal("Customer", previousCustomer);
      }
    },
  },
  {
    name: "maps validation aliases to one canonical runtime handler",
    run: function () {
      var previousTransactionValidationService =
        global.TransactionValidationService;
      var received;

      global.TransactionValidationService = {
        validateRole: function (validation, transBody, service) {
          received = [validation, transBody, service];
          return "validated";
        },
      };

      try {
        assert.strictEqual(
          ValidationRegistryService.canonicalName("checkUserRole"),
          "validateRole",
        );
        assert.strictEqual(
          ValidationRegistryService.supports("arbitraryValidation"),
          false,
        );

        var validation = { validateFunc: "checkUserRole" };
        var transBody = { USERROLE: "customer" };
        var service = { code: "P2P" };
        assert.strictEqual(
          ValidationRegistryService.execute(validation, transBody, service),
          "validated",
        );
        assert.deepStrictEqual(received, [validation, transBody, service]);
      } finally {
        restoreGlobal(
          "TransactionValidationService",
          previousTransactionValidationService,
        );
      }
    },
  },
  {
    name: "uses centralized provider timeout with optional action override",
    run: function () {
      var previousConfig = global.MiniWalletConfigService;

      global.MiniWalletConfigService = {
        transactions: function () {
          return { providerTimeoutMs: 4321 };
        },
      };

      try {
        assert.strictEqual(ProviderActionGatewayService.timeoutMs({}), 4321);
        assert.strictEqual(
          ProviderActionGatewayService.timeoutMs({ timeoutMs: 8765 }),
          8765,
        );
      } finally {
        restoreGlobal("MiniWalletConfigService", previousConfig);
      }
    },
  },
  {
    name: "does not resolve field-builder handlers by traversing global paths",
    run: function () {
      var source = fs.readFileSync(
        path.resolve(
          __dirname,
          "../../api/services/ServiceRuntimeService.js",
        ),
        "utf8",
      );
      var gatewaySource = fs.readFileSync(
        path.resolve(
          __dirname,
          "../../api/services/ProviderActionGatewayService.js",
        ),
        "utf8",
      );

      assert.strictEqual(/target\s*=\s*global/.test(source), false);
      assert.strictEqual(/timeoutMs\s*\|\|\s*10000/.test(gatewaySource), false);
      assert.ok(
        /FieldBuilderRegistryService\.execute/.test(source),
        "Service runtime must delegate query handlers to the registry",
      );
      assert.ok(
        /MiniWalletConfigService\.transactions\(\)\.providerTimeoutMs/.test(
          gatewaySource,
        ),
        "provider gateway must use centralized timeout config",
      );
    },
  },
];

function restoreGlobal(name, previous) {
  if (previous === undefined) {
    delete global[name];
  } else {
    global[name] = previous;
  }
}
