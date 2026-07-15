/**
 * Create only compound unique indexes that Waterline 0.12 cannot express.
 */

module.exports.bootstrap = function bootstrap(cb) {
  var indexJobs = [
    {
      model: Pocket,
      indexes: [
        {
          keys: { ownerType: 1, ownerId: 1, currency: 1 },
          options: { unique: true },
        },
      ],
    },
    {
      model: TransField,
      indexes: [
        { keys: { service: 1, fieldName: 1 }, options: { unique: true } },
      ],
    },
  ];

  runIndexJobs(indexJobs, cb);
};

function runIndexJobs(jobs, done) {
  var jobIndex = 0;

  function nextJob(err) {
    if (err) {
      return done(err);
    }

    if (jobIndex >= jobs.length) {
      return done();
    }

    var job = jobs[jobIndex++];
    job.model.native(function nativeCollection(nativeErr, collection) {
      if (nativeErr) {
        return done(nativeErr);
      }

      runCollectionIndexes(collection, job.indexes, nextJob);
    });
  }

  nextJob();
}

function runCollectionIndexes(collection, indexes, done) {
  var index = 0;

  function nextIndex(err) {
    if (err) {
      return done(err);
    }

    if (index >= indexes.length) {
      return done();
    }

    var spec = indexes[index++];
    collection.ensureIndex(spec.keys, spec.options || {}, nextIndex);
  }

  nextIndex();
}
