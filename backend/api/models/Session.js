var DOMAIN = require("../../config/domain").domain;

module.exports = {
  attributes: {
    tokenHash: {
      type: 'string',
      required: true,
      unique: true,
      index: true
    },
    userType: {
      type: 'string',
      enum: [DOMAIN.userType.CUSTOMER, DOMAIN.userType.OFFICER],
      required: true,
      index: true
    },
    userId: {
      type: 'string',
      required: true,
      index: true
    },
    customer: {
      model: 'customer'
    },
    officer: {
      model: 'officer'
    },
    status: {
      type: 'string',
      enum: [
        DOMAIN.status.ACTIVE,
        DOMAIN.status.REVOKED,
        DOMAIN.status.EXPIRED,
      ],
      defaultsTo: DOMAIN.status.ACTIVE,
      required: true,
      index: true
    },
    expiredAt: {
      type: 'datetime',
      required: true,
      index: true
    },
    lastUsedAt: {
      type: 'datetime'
    },
    createdBy: {
      type: 'string'
    },
    updatedBy: {
      type: 'string'
    }
  }
};
