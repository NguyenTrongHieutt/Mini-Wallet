module.exports.policies = {
  '*': false,

  CustomerAuthController: {
    register: true,
    login: true,
    logout: 'customerAuth'
  },

  OfficerAuthController: {
    login: true,
    logout: 'officerAuth'
  },

  CustomerController: {
    '*': 'customerAuth'
  },

  TransactionController: {
    request: 'bearerAuth',
    confirm: 'bearerAuth',
    verify: 'bearerAuth',
    cancel: 'customerAuth',
    trigger: 'officerAuth'
  },

  CustomerTransactionController: {
    '*': 'customerAuth'
  },

  CustomerServiceController: {
    '*': 'customerAuth'
  },

  OfficerController: {
    '*': 'officerAuth'
  },

  OfficerCustomerController: {
    '*': 'officerAuth'
  },

  ConfigController: {
    '*': 'officerAuth'
  },

  MockBillerController: {
    '*': true
  },

  DevController: {
    '*': true
  }
};
