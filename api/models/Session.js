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
      enum: ['customer', 'officer'],
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
      enum: ['active', 'revoked', 'expired'],
      defaultsTo: 'active',
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
