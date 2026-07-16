"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");

var backendRoot = path.resolve(__dirname, "..");
var targets = [
  path.join(backendRoot, "api"),
  path.join(backendRoot, "config"),
  path.join(backendRoot, "scripts"),
  path.join(backendRoot, "test"),
  path.join(backendRoot, "app.js"),
  path.join(backendRoot, "Gruntfile.js"),
];
var files = [];

targets.forEach(function (target) {
  if (fs.existsSync(target)) {
    files = files.concat(collectJavaScript(target));
  }
});

files.forEach(function (filePath) {
  var source = fs.readFileSync(filePath, "utf8");
  if (source.indexOf("#!") === 0) {
    source = source.replace(/^#![^\r\n]*/, "");
  }

  try {
    new vm.Script(
      "(function (exports, require, module, __filename, __dirname) {\n" +
        source +
        "\n});",
      { filename: filePath },
    );
  } catch (err) {
    console.error("Syntax check failed: " + relative(filePath));
    throw err;
  }
});

console.log("Syntax check passed for " + files.length + " JavaScript files.");

function collectJavaScript(target) {
  var stat = fs.statSync(target);
  if (!stat.isDirectory()) {
    return /\.js$/.test(target) ? [target] : [];
  }

  return fs.readdirSync(target).reduce(function (result, entry) {
    if (entry === "node_modules" || entry === ".tmp") {
      return result;
    }

    return result.concat(collectJavaScript(path.join(target, entry)));
  }, []);
}

function relative(filePath) {
  return path.relative(backendRoot, filePath).replace(/\\/g, "/");
}
