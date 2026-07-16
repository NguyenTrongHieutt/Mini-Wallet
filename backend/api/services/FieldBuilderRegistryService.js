"use strict";

var QUERY_NAMES = [
  "Customer.getActiveCustomerByPhone",
  "Pocket.getActivePocketByOwner",
];

module.exports = {
  names: function () {
    return QUERY_NAMES.slice();
  },

  supports: function (queryName) {
    return QUERY_NAMES.indexOf(String(queryName || "")) !== -1;
  },

  execute: function (queryName, params) {
    params = Array.isArray(params) ? params : [];

    if (queryName === "Customer.getActiveCustomerByPhone") {
      return Customer.getActiveCustomerByPhone.apply(Customer, params);
    }

    if (queryName === "Pocket.getActivePocketByOwner") {
      return Pocket.getActivePocketByOwner.apply(Pocket, params);
    }

    throw AppErrorService.create(
      EnvelopeService.CODE.BAD_REQUEST,
      "UNSUPPORTED_FIELD_BUILDER_QUERY",
      { query: queryName },
    );
  },
};
