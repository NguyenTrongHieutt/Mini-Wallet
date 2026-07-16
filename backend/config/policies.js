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

  CustomerWalletController: {
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

  OfficerPocketController: {
    '*': 'officerAuth'
  },

  OfficerProviderController: {
    '*': 'officerAuth'
  },

  OfficerServiceController: {
    '*': 'officerAuth'
  },

  OfficerTrailController: {
    '*': 'officerAuth'
  },

  OfficerTransactionController: {
    '*': 'officerAuth'
  },

  OfficerLedgerController: {
    '*': 'officerAuth'
  },

  ConfigController: {
    '*': 'officerAuth'
  },

  MockBillerController: {
    '*': 'devOnly'
  },

  DevController: {
    '*': true
  }
};
