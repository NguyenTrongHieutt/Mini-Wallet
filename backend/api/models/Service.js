var DOMAIN = require("../../config/domain").domain;

module.exports = {
  attributes: {
    code: {
      type: "string",
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: "string",
      required: true,
      index: true,
    },
    description: {
      type: "string",
      index: true,
    },
    fieldBuilder: {
      type: "array",
      defaultsTo: [],
    },
    actions: {
      type: "json",
    },
    fee: {
      type: "json",
      required: true,
    },
    auth: {
      type: "json",
      required: true,
    },
    status: {
      type: "string",
      enum: [
        DOMAIN.status.DRAFT,
        DOMAIN.status.ACTIVE,
        DOMAIN.status.INACTIVE,
      ],
      defaultsTo: DOMAIN.status.DRAFT,
      required: true,
      index: true,
    },
    createdBy: {
      type: "string",
    },
    updatedBy: {
      type: "string",
    },
  },

  loadActiveByCode: function (serviceCode) {
    return ServiceRuntimeService.loadActiveByCode(serviceCode);
  },

  loadActiveById: function (serviceId) {
    return ServiceRuntimeService.loadActiveById(serviceId);
  },

  buildTransactionFields: function (service, transInput, trail) {
    return ServiceRuntimeService.buildTransactionFields(
      service,
      transInput,
      trail,
    );
  },

  calculateFee: function (service, transBody) {
    return ServiceRuntimeService.calculateFee(service, transBody);
  },

  buildPreview: function (trail, service, transBody) {
    return ServiceRuntimeService.buildPreview(trail, service, transBody);
  },

  buildConfirmResult: function (trail, service) {
    return ServiceRuntimeService.buildConfirmResult(trail, service);
  },

  runRequestAction: function (service, transBody) {
    return ServiceRuntimeService.runRequestAction(service, transBody);
  },

  runConfirmAction: function (service, transBody) {
    return ServiceRuntimeService.runConfirmAction(service, transBody);
  },

  runVerifyAction: function (service, transBody) {
    return ServiceRuntimeService.runVerifyAction(service, transBody);
  },

  verifyAuth: function (service, transInput) {
    return ServiceRuntimeService.verifyAuth(service, transInput);
  },

  buildReceipt: function (receipt, service) {
    return ServiceRuntimeService.buildReceipt(receipt, service);
  },

  sortByOrder: function (items) {
    return ServiceRuntimeService.sortByOrder(items);
  },
};
