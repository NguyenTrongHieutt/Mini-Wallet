"use strict";

var assert = require("assert");
var routes = require("../../config/routes").routes;

var expectedRoutes = {
  "POST /api/v1/customer/auth/register": "CustomerAuthController.register",
  "POST /api/v1/customer/auth/login": "CustomerAuthController.login",
  "POST /api/v1/customer/auth/logout": "CustomerAuthController.logout",
  "POST /api/v1/customer/me": "CustomerController.me",
  "POST /api/v1/customer/wallet/balance": "CustomerWalletController.balance",
  "POST /api/v1/customer/services/list": "CustomerServiceController.list",
  "POST /api/v1/customer/providers/list": "CustomerServiceController.providers",
  "POST /api/v1/customer/services/input-fields": "CustomerServiceController.inputFields",
  "POST /api/v1/customer/transactions/list": "CustomerTransactionController.list",
  "POST /api/v1/customer/transactions/detail": "CustomerTransactionController.detail",
  "POST /api/v1/officer/auth/login": "OfficerAuthController.login",
  "POST /api/v1/officer/auth/logout": "OfficerAuthController.logout",
  "POST /api/v1/officer/me": "OfficerController.me",
  "POST /api/v1/officer/customers/list": "OfficerCustomerController.list",
  "POST /api/v1/officer/customers/detail": "OfficerCustomerController.detail",
  "POST /api/v1/officer/customers/lock": "OfficerCustomerController.lock",
  "POST /api/v1/officer/customers/unlock": "OfficerCustomerController.unlock",
  "POST /api/v1/officer/pockets/create": "OfficerPocketController.create",
  "POST /api/v1/officer/pockets/list": "OfficerPocketController.list",
  "POST /api/v1/officer/pockets/detail": "OfficerPocketController.detail",
  "POST /api/v1/officer/pockets/lock": "OfficerPocketController.lock",
  "POST /api/v1/officer/pockets/unlock": "OfficerPocketController.unlock",
  "POST /api/v1/officer/providers/create": "OfficerProviderController.create",
  "POST /api/v1/officer/providers/list": "OfficerProviderController.list",
  "POST /api/v1/officer/providers/detail": "OfficerProviderController.detail",
  "POST /api/v1/officer/providers/update": "OfficerProviderController.update",
  "POST /api/v1/officer/providers/activate": "OfficerProviderController.activate",
  "POST /api/v1/officer/providers/deactivate": "OfficerProviderController.deactivate",
  "POST /api/v1/officer/services/create": "OfficerServiceController.create",
  "POST /api/v1/officer/services/list": "OfficerServiceController.list",
  "POST /api/v1/officer/services/detail": "OfficerServiceController.detail",
  "POST /api/v1/officer/services/update": "OfficerServiceController.update",
  "POST /api/v1/officer/services/trans-fields/list": "OfficerServiceController.listTransFields",
  "POST /api/v1/officer/services/trans-fields/update": "OfficerServiceController.updateTransField",
  "POST /api/v1/officer/services/trans-fields/insert": "OfficerServiceController.insertTransField",
  "POST /api/v1/officer/services/trans-validations/list": "OfficerServiceController.listTransValidations",
  "POST /api/v1/officer/services/trans-validations/update": "OfficerServiceController.updateTransValidation",
  "POST /api/v1/officer/services/trans-validations/insert": "OfficerServiceController.insertTransValidation",
  "POST /api/v1/officer/services/field-builder/update": "OfficerServiceController.updateFieldBuilder",
  "POST /api/v1/officer/services/actions/update": "OfficerServiceController.updateActions",
  "POST /api/v1/officer/services/trans-definition/detail": "OfficerServiceController.detailTransDefinition",
  "POST /api/v1/officer/services/trans-definition/update": "OfficerServiceController.updateTransDefinition",
  "POST /api/v1/officer/services/publish": "OfficerServiceController.publish",
  "POST /api/v1/officer/services/unpublish": "OfficerServiceController.unpublish",
  "POST /api/v1/transactions/request": "TransactionController.request",
  "POST /api/v1/transactions/confirm": "TransactionController.confirm",
  "POST /api/v1/transactions/verify": "TransactionController.verify",
  "POST /api/v1/officer/transactions/trigger": "TransactionController.trigger",
  "POST /api/v1/officer/trails/list": "OfficerTrailController.list",
  "POST /api/v1/officer/trails/detail": "OfficerTrailController.detail",
  "POST /api/v1/officer/transactions/list": "OfficerTransactionController.list",
  "POST /api/v1/officer/transactions/detail": "OfficerTransactionController.detail",
  "POST /api/v1/officer/ledger/entries/list": "OfficerLedgerController.listEntries",
  "POST /api/v1/officer/ledger/entries/detail": "OfficerLedgerController.entryDetail",
  "POST /api/v1/mock/biller/bills/create": "MockBillerController.createBill",
  "POST /api/v1/mock/biller/inquiry": "MockBillerController.inquiry",
  "POST /api/v1/mock/biller/payment": "MockBillerController.payment",
};

module.exports = [
  {
    name: "keeps every existing public route mapped to the same controller action",
    run: function () {
      Object.keys(expectedRoutes).forEach(function (route) {
        assert.strictEqual(routes[route], expectedRoutes[route], route);
      });
    },
  },
  {
    name: "uses POST for the existing API surface",
    run: function () {
      Object.keys(routes).forEach(function (route) {
        assert.strictEqual(route.indexOf("POST "), 0, route);
      });
    },
  },
];
