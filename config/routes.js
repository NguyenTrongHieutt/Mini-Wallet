module.exports.routes = {
  "POST /api/v1/customer/auth/register": "CustomerAuthController.register",
  "POST /api/v1/customer/auth/login": "CustomerAuthController.login",
  "POST /api/v1/customer/auth/logout": "CustomerAuthController.logout",
  "POST /api/v1/transactions/request": "TransactionController.request",
  "POST /api/v1/transactions/confirm": "TransactionController.confirm",
  "POST /api/v1/transactions/verify": "TransactionController.verify",
  "POST /api/v1/customer/transactions/list": "CustomerTransactionController.list",
  "POST /api/v1/customer/transactions/detail": "CustomerTransactionController.detail",
};
