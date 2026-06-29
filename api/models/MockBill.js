module.exports = {
  attributes: {
    providerCode: {
      type: 'string',
      required: true,
      index: true
    },
    billCode: {
      type: 'string',
      required: true,
      index: true
    },
    amount: {
      type: 'number',
      required: true
    },
    billInfo: {
      type: 'json'
    },
    status: {
      type: 'string',
      enum: ['unpaid', 'paid'],
      defaultsTo: 'unpaid',
      required: true,
      index: true
    },
    paidTransRefId: {
      type: 'string'
    }
  }
};
