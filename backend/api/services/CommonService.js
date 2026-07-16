module.exports = {
  cleanString: function (value) {
    if (value === undefined || value === null) {
      return "";
    }

    return String(value).trim();
  },

  cleanUpperString: function (value, defaultValue) {
    const normalizedValue =
      value === undefined || value === null || value === "" ? defaultValue : value;

    return this.cleanString(normalizedValue).toUpperCase();
  },

  isPlainObject: function (value) {
    return value && typeof value === "object" && !Array.isArray(value);
  },
};
