module.exports = {
  create: function(code, message, data) {
    var err = new Error(message);
    err.code = code;
    err.messageKey = message;
    err.data = data;
    err.isAppError = true;
    return err;
  }
};
