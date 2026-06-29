var sails = require('sails');

var currencies = [
  { code: 'VND', name: 'Vietnamese Dong', minorUnit: 0, status: 'active' },
  { code: 'USD', name: 'United States Dollar', minorUnit: 2, status: 'active' },
  { code: 'EUR', name: 'Euro', minorUnit: 2, status: 'active' },
  { code: 'JPY', name: 'Japanese Yen', minorUnit: 0, status: 'active' },
  { code: 'GBP', name: 'Pound Sterling', minorUnit: 2, status: 'active' },
  { code: 'CNY', name: 'Chinese Yuan', minorUnit: 2, status: 'active' },
  { code: 'KRW', name: 'South Korean Won', minorUnit: 0, status: 'active' },
  { code: 'SGD', name: 'Singapore Dollar', minorUnit: 2, status: 'active' },
  { code: 'THB', name: 'Thai Baht', minorUnit: 2, status: 'active' },
];

sails.load({ hooks: { grunt: false }, log: { level: 'warn' } }, function loadApp(err) {
  if (err) {
    console.error('Failed to load Sails:', err);
    process.exit(1);
  }

  seedCurrencies(function seedDone(seedErr, result) {
    if (seedErr) {
      console.error('Failed to seed currencies:', seedErr);
      return sails.lower(function lowerAfterError() {
        process.exit(1);
      });
    }

    console.log(
      'Seeded currencies. Created: ' +
        result.created +
        ', Updated: ' +
        result.updated +
        ', Total: ' +
        currencies.length
    );

    sails.lower(function lowerAfterSuccess() {
      process.exit(0);
    });
  });
});

function seedCurrencies(done) {
  var index = 0;
  var result = { created: 0, updated: 0 };

  function next(err) {
    if (err) {
      return done(err);
    }

    if (index >= currencies.length) {
      return done(null, result);
    }

    var currency = normalizeCurrency(currencies[index++]);

    Currency.findOne({ code: currency.code }).exec(function findOneDone(findErr, existing) {
      if (findErr) {
        return next(findErr);
      }

      if (!existing) {
        return Currency.create(currency).exec(function createDone(createErr) {
          if (!createErr) {
            result.created += 1;
          }

          next(createErr);
        });
      }

      Currency.update({ code: currency.code }, currency).exec(function updateDone(updateErr) {
        if (!updateErr) {
          result.updated += 1;
        }

        next(updateErr);
      });
    });
  }

  next();
}

function normalizeCurrency(currency) {
  return {
    code: currency.code.toUpperCase(),
    name: currency.name,
    minorUnit: currency.minorUnit,
    status: currency.status || 'active',
    createdBy: 'seed',
    updatedBy: 'seed',
  };
}
