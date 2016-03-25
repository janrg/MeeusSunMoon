(function () {
  function onload(moment) {
    moment.fn.formatCI = function (formatString, keyValues) {
      var customKey = this.creationData().input.slice(0,2);
      if (keyValues[customKey]) {
        return this.format(formatString) + keyValues[customKey];
      } else {
        return this.format(formatString);
      }
    };
    return moment;
  }
  if (typeof define === "function" && define.amd) {
    define("moment-custom-info", ["moment"], onload);
  } else if (typeof module !== "undefined") {
    module.exports = onload(require("moment"));
  } else if (typeof window !== "undefined" && window.moment) {
    onload(window.moment);
  }
}).apply(this);
