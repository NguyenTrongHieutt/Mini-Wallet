"use strict";

var fs = require("fs");
var path = require("path");

var testRoot = __dirname;
var testFiles = listFiles(testRoot).filter(function (filePath) {
  return /\.test\.js$/.test(filePath);
});
var tests = [];

testFiles.forEach(function (filePath) {
  var exported = require(filePath);
  if (!Array.isArray(exported)) {
    throw new Error(relative(filePath) + " must export an array of tests");
  }

  exported.forEach(function (test) {
    if (!test || typeof test.name !== "string" || typeof test.run !== "function") {
      throw new Error(relative(filePath) + " contains an invalid test");
    }

    tests.push({
      file: relative(filePath),
      name: test.name,
      run: test.run,
    });
  });
});

runSequentially(tests)
  .then(function () {
    console.log("");
    console.log(tests.length + " backend tests passed.");
  })
  .catch(function (err) {
    console.error("");
    console.error(err && err.stack ? err.stack : err);
    process.exitCode = 1;
  });

function runSequentially(queue) {
  return queue.reduce(function (promise, test) {
    return promise.then(function () {
      return Promise.resolve()
        .then(test.run)
        .then(function () {
          console.log("PASS " + test.file + " - " + test.name);
        })
        .catch(function (err) {
          err.message =
            "FAIL " + test.file + " - " + test.name + "\n" + err.message;
          throw err;
        });
    });
  }, Promise.resolve());
}

function listFiles(directory) {
  return fs.readdirSync(directory).reduce(function (files, entry) {
    var fullPath = path.join(directory, entry);
    var stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      return files.concat(listFiles(fullPath));
    }

    return files.concat(fullPath);
  }, []);
}

function relative(filePath) {
  return path.relative(process.cwd(), filePath).replace(/\\/g, "/");
}
