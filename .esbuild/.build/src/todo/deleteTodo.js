"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/postgres-array/index.js
var require_postgres_array = __commonJS({
  "node_modules/postgres-array/index.js"(exports2) {
    "use strict";
    exports2.parse = function(source, transform) {
      return new ArrayParser(source, transform).parse();
    };
    var ArrayParser = class _ArrayParser {
      constructor(source, transform) {
        this.source = source;
        this.transform = transform || identity;
        this.position = 0;
        this.entries = [];
        this.recorded = [];
        this.dimension = 0;
      }
      isEof() {
        return this.position >= this.source.length;
      }
      nextCharacter() {
        var character = this.source[this.position++];
        if (character === "\\") {
          return {
            value: this.source[this.position++],
            escaped: true
          };
        }
        return {
          value: character,
          escaped: false
        };
      }
      record(character) {
        this.recorded.push(character);
      }
      newEntry(includeEmpty) {
        var entry;
        if (this.recorded.length > 0 || includeEmpty) {
          entry = this.recorded.join("");
          if (entry === "NULL" && !includeEmpty) {
            entry = null;
          }
          if (entry !== null)
            entry = this.transform(entry);
          this.entries.push(entry);
          this.recorded = [];
        }
      }
      consumeDimensions() {
        if (this.source[0] === "[") {
          while (!this.isEof()) {
            var char = this.nextCharacter();
            if (char.value === "=")
              break;
          }
        }
      }
      parse(nested) {
        var character, parser, quote;
        this.consumeDimensions();
        while (!this.isEof()) {
          character = this.nextCharacter();
          if (character.value === "{" && !quote) {
            this.dimension++;
            if (this.dimension > 1) {
              parser = new _ArrayParser(this.source.substr(this.position - 1), this.transform);
              this.entries.push(parser.parse(true));
              this.position += parser.position - 2;
            }
          } else if (character.value === "}" && !quote) {
            this.dimension--;
            if (!this.dimension) {
              this.newEntry();
              if (nested)
                return this.entries;
            }
          } else if (character.value === '"' && !character.escaped) {
            if (quote)
              this.newEntry(true);
            quote = !quote;
          } else if (character.value === "," && !quote) {
            this.newEntry();
          } else {
            this.record(character.value);
          }
        }
        if (this.dimension !== 0) {
          throw new Error("array dimension not balanced");
        }
        return this.entries;
      }
    };
    function identity(value) {
      return value;
    }
  }
});

// node_modules/pg-types/lib/arrayParser.js
var require_arrayParser = __commonJS({
  "node_modules/pg-types/lib/arrayParser.js"(exports2, module2) {
    var array = require_postgres_array();
    module2.exports = {
      create: function(source, transform) {
        return {
          parse: function() {
            return array.parse(source, transform);
          }
        };
      }
    };
  }
});

// node_modules/postgres-date/index.js
var require_postgres_date = __commonJS({
  "node_modules/postgres-date/index.js"(exports2, module2) {
    "use strict";
    var DATE_TIME = /(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?.*?( BC)?$/;
    var DATE = /^(\d{1,})-(\d{2})-(\d{2})( BC)?$/;
    var TIME_ZONE = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/;
    var INFINITY = /^-?infinity$/;
    module2.exports = function parseDate(isoDate) {
      if (INFINITY.test(isoDate)) {
        return Number(isoDate.replace("i", "I"));
      }
      var matches = DATE_TIME.exec(isoDate);
      if (!matches) {
        return getDate(isoDate) || null;
      }
      var isBC = !!matches[8];
      var year = parseInt(matches[1], 10);
      if (isBC) {
        year = bcYearToNegativeYear(year);
      }
      var month = parseInt(matches[2], 10) - 1;
      var day = matches[3];
      var hour = parseInt(matches[4], 10);
      var minute = parseInt(matches[5], 10);
      var second = parseInt(matches[6], 10);
      var ms = matches[7];
      ms = ms ? 1e3 * parseFloat(ms) : 0;
      var date;
      var offset = timeZoneOffset(isoDate);
      if (offset != null) {
        date = new Date(Date.UTC(year, month, day, hour, minute, second, ms));
        if (is0To99(year)) {
          date.setUTCFullYear(year);
        }
        if (offset !== 0) {
          date.setTime(date.getTime() - offset);
        }
      } else {
        date = new Date(year, month, day, hour, minute, second, ms);
        if (is0To99(year)) {
          date.setFullYear(year);
        }
      }
      return date;
    };
    function getDate(isoDate) {
      var matches = DATE.exec(isoDate);
      if (!matches) {
        return;
      }
      var year = parseInt(matches[1], 10);
      var isBC = !!matches[4];
      if (isBC) {
        year = bcYearToNegativeYear(year);
      }
      var month = parseInt(matches[2], 10) - 1;
      var day = matches[3];
      var date = new Date(year, month, day);
      if (is0To99(year)) {
        date.setFullYear(year);
      }
      return date;
    }
    function timeZoneOffset(isoDate) {
      if (isoDate.endsWith("+00")) {
        return 0;
      }
      var zone = TIME_ZONE.exec(isoDate.split(" ")[1]);
      if (!zone)
        return;
      var type = zone[1];
      if (type === "Z") {
        return 0;
      }
      var sign = type === "-" ? -1 : 1;
      var offset = parseInt(zone[2], 10) * 3600 + parseInt(zone[3] || 0, 10) * 60 + parseInt(zone[4] || 0, 10);
      return offset * sign * 1e3;
    }
    function bcYearToNegativeYear(year) {
      return -(year - 1);
    }
    function is0To99(num) {
      return num >= 0 && num < 100;
    }
  }
});

// node_modules/xtend/mutable.js
var require_mutable = __commonJS({
  "node_modules/xtend/mutable.js"(exports2, module2) {
    module2.exports = extend;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    function extend(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
          if (hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    }
  }
});

// node_modules/postgres-interval/index.js
var require_postgres_interval = __commonJS({
  "node_modules/postgres-interval/index.js"(exports2, module2) {
    "use strict";
    var extend = require_mutable();
    module2.exports = PostgresInterval;
    function PostgresInterval(raw) {
      if (!(this instanceof PostgresInterval)) {
        return new PostgresInterval(raw);
      }
      extend(this, parse2(raw));
    }
    var properties = ["seconds", "minutes", "hours", "days", "months", "years"];
    PostgresInterval.prototype.toPostgres = function() {
      var filtered = properties.filter(this.hasOwnProperty, this);
      if (this.milliseconds && filtered.indexOf("seconds") < 0) {
        filtered.push("seconds");
      }
      if (filtered.length === 0)
        return "0";
      return filtered.map(function(property) {
        var value = this[property] || 0;
        if (property === "seconds" && this.milliseconds) {
          value = (value + this.milliseconds / 1e3).toFixed(6).replace(/\.?0+$/, "");
        }
        return value + " " + property;
      }, this).join(" ");
    };
    var propertiesISOEquivalent = {
      years: "Y",
      months: "M",
      days: "D",
      hours: "H",
      minutes: "M",
      seconds: "S"
    };
    var dateProperties = ["years", "months", "days"];
    var timeProperties = ["hours", "minutes", "seconds"];
    PostgresInterval.prototype.toISOString = PostgresInterval.prototype.toISO = function() {
      var datePart = dateProperties.map(buildProperty, this).join("");
      var timePart = timeProperties.map(buildProperty, this).join("");
      return "P" + datePart + "T" + timePart;
      function buildProperty(property) {
        var value = this[property] || 0;
        if (property === "seconds" && this.milliseconds) {
          value = (value + this.milliseconds / 1e3).toFixed(6).replace(/0+$/, "");
        }
        return value + propertiesISOEquivalent[property];
      }
    };
    var NUMBER = "([+-]?\\d+)";
    var YEAR = NUMBER + "\\s+years?";
    var MONTH = NUMBER + "\\s+mons?";
    var DAY = NUMBER + "\\s+days?";
    var TIME = "([+-])?([\\d]*):(\\d\\d):(\\d\\d)\\.?(\\d{1,6})?";
    var INTERVAL = new RegExp([YEAR, MONTH, DAY, TIME].map(function(regexString) {
      return "(" + regexString + ")?";
    }).join("\\s*"));
    var positions = {
      years: 2,
      months: 4,
      days: 6,
      hours: 9,
      minutes: 10,
      seconds: 11,
      milliseconds: 12
    };
    var negatives = ["hours", "minutes", "seconds", "milliseconds"];
    function parseMilliseconds(fraction) {
      var microseconds = fraction + "000000".slice(fraction.length);
      return parseInt(microseconds, 10) / 1e3;
    }
    function parse2(interval) {
      if (!interval)
        return {};
      var matches = INTERVAL.exec(interval);
      var isNegative = matches[8] === "-";
      return Object.keys(positions).reduce(function(parsed, property) {
        var position = positions[property];
        var value = matches[position];
        if (!value)
          return parsed;
        value = property === "milliseconds" ? parseMilliseconds(value) : parseInt(value, 10);
        if (!value)
          return parsed;
        if (isNegative && ~negatives.indexOf(property)) {
          value *= -1;
        }
        parsed[property] = value;
        return parsed;
      }, {});
    }
  }
});

// node_modules/postgres-bytea/index.js
var require_postgres_bytea = __commonJS({
  "node_modules/postgres-bytea/index.js"(exports2, module2) {
    "use strict";
    module2.exports = function parseBytea(input) {
      if (/^\\x/.test(input)) {
        return new Buffer(input.substr(2), "hex");
      }
      var output = "";
      var i = 0;
      while (i < input.length) {
        if (input[i] !== "\\") {
          output += input[i];
          ++i;
        } else {
          if (/[0-7]{3}/.test(input.substr(i + 1, 3))) {
            output += String.fromCharCode(parseInt(input.substr(i + 1, 3), 8));
            i += 4;
          } else {
            var backslashes = 1;
            while (i + backslashes < input.length && input[i + backslashes] === "\\") {
              backslashes++;
            }
            for (var k = 0; k < Math.floor(backslashes / 2); ++k) {
              output += "\\";
            }
            i += Math.floor(backslashes / 2) * 2;
          }
        }
      }
      return new Buffer(output, "binary");
    };
  }
});

// node_modules/pg-types/lib/textParsers.js
var require_textParsers = __commonJS({
  "node_modules/pg-types/lib/textParsers.js"(exports2, module2) {
    var array = require_postgres_array();
    var arrayParser = require_arrayParser();
    var parseDate = require_postgres_date();
    var parseInterval = require_postgres_interval();
    var parseByteA = require_postgres_bytea();
    function allowNull(fn) {
      return function nullAllowed(value) {
        if (value === null)
          return value;
        return fn(value);
      };
    }
    function parseBool(value) {
      if (value === null)
        return value;
      return value === "TRUE" || value === "t" || value === "true" || value === "y" || value === "yes" || value === "on" || value === "1";
    }
    function parseBoolArray(value) {
      if (!value)
        return null;
      return array.parse(value, parseBool);
    }
    function parseBaseTenInt(string) {
      return parseInt(string, 10);
    }
    function parseIntegerArray(value) {
      if (!value)
        return null;
      return array.parse(value, allowNull(parseBaseTenInt));
    }
    function parseBigIntegerArray(value) {
      if (!value)
        return null;
      return array.parse(value, allowNull(function(entry) {
        return parseBigInteger(entry).trim();
      }));
    }
    var parsePointArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parsePoint(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseFloatArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseFloat(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseStringArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value);
      return p.parse();
    };
    var parseDateArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseDate(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseIntervalArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseInterval(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseByteAArray = function(value) {
      if (!value) {
        return null;
      }
      return array.parse(value, allowNull(parseByteA));
    };
    var parseInteger = function(value) {
      return parseInt(value, 10);
    };
    var parseBigInteger = function(value) {
      var valStr = String(value);
      if (/^\d+$/.test(valStr)) {
        return valStr;
      }
      return value;
    };
    var parseJsonArray = function(value) {
      if (!value) {
        return null;
      }
      return array.parse(value, allowNull(JSON.parse));
    };
    var parsePoint = function(value) {
      if (value[0] !== "(") {
        return null;
      }
      value = value.substring(1, value.length - 1).split(",");
      return {
        x: parseFloat(value[0]),
        y: parseFloat(value[1])
      };
    };
    var parseCircle = function(value) {
      if (value[0] !== "<" && value[1] !== "(") {
        return null;
      }
      var point = "(";
      var radius = "";
      var pointParsed = false;
      for (var i = 2; i < value.length - 1; i++) {
        if (!pointParsed) {
          point += value[i];
        }
        if (value[i] === ")") {
          pointParsed = true;
          continue;
        } else if (!pointParsed) {
          continue;
        }
        if (value[i] === ",") {
          continue;
        }
        radius += value[i];
      }
      var result = parsePoint(point);
      result.radius = parseFloat(radius);
      return result;
    };
    var init = function(register) {
      register(20, parseBigInteger);
      register(21, parseInteger);
      register(23, parseInteger);
      register(26, parseInteger);
      register(700, parseFloat);
      register(701, parseFloat);
      register(16, parseBool);
      register(1082, parseDate);
      register(1114, parseDate);
      register(1184, parseDate);
      register(600, parsePoint);
      register(651, parseStringArray);
      register(718, parseCircle);
      register(1e3, parseBoolArray);
      register(1001, parseByteAArray);
      register(1005, parseIntegerArray);
      register(1007, parseIntegerArray);
      register(1028, parseIntegerArray);
      register(1016, parseBigIntegerArray);
      register(1017, parsePointArray);
      register(1021, parseFloatArray);
      register(1022, parseFloatArray);
      register(1231, parseFloatArray);
      register(1014, parseStringArray);
      register(1015, parseStringArray);
      register(1008, parseStringArray);
      register(1009, parseStringArray);
      register(1040, parseStringArray);
      register(1041, parseStringArray);
      register(1115, parseDateArray);
      register(1182, parseDateArray);
      register(1185, parseDateArray);
      register(1186, parseInterval);
      register(1187, parseIntervalArray);
      register(17, parseByteA);
      register(114, JSON.parse.bind(JSON));
      register(3802, JSON.parse.bind(JSON));
      register(199, parseJsonArray);
      register(3807, parseJsonArray);
      register(3907, parseStringArray);
      register(2951, parseStringArray);
      register(791, parseStringArray);
      register(1183, parseStringArray);
      register(1270, parseStringArray);
    };
    module2.exports = {
      init
    };
  }
});

// node_modules/pg-int8/index.js
var require_pg_int8 = __commonJS({
  "node_modules/pg-int8/index.js"(exports2, module2) {
    "use strict";
    var BASE = 1e6;
    function readInt8(buffer) {
      var high = buffer.readInt32BE(0);
      var low = buffer.readUInt32BE(4);
      var sign = "";
      if (high < 0) {
        high = ~high + (low === 0);
        low = ~low + 1 >>> 0;
        sign = "-";
      }
      var result = "";
      var carry;
      var t;
      var digits;
      var pad;
      var l;
      var i;
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        t = 4294967296 * carry + low;
        digits = "" + t % BASE;
        return sign + digits + result;
      }
    }
    module2.exports = readInt8;
  }
});

// node_modules/pg-types/lib/binaryParsers.js
var require_binaryParsers = __commonJS({
  "node_modules/pg-types/lib/binaryParsers.js"(exports2, module2) {
    var parseInt64 = require_pg_int8();
    var parseBits = function(data, bits, offset, invert, callback) {
      offset = offset || 0;
      invert = invert || false;
      callback = callback || function(lastValue, newValue, bits2) {
        return lastValue * Math.pow(2, bits2) + newValue;
      };
      var offsetBytes = offset >> 3;
      var inv = function(value) {
        if (invert) {
          return ~value & 255;
        }
        return value;
      };
      var mask = 255;
      var firstBits = 8 - offset % 8;
      if (bits < firstBits) {
        mask = 255 << 8 - bits & 255;
        firstBits = bits;
      }
      if (offset) {
        mask = mask >> offset % 8;
      }
      var result = 0;
      if (offset % 8 + bits >= 8) {
        result = callback(0, inv(data[offsetBytes]) & mask, firstBits);
      }
      var bytes = bits + offset >> 3;
      for (var i = offsetBytes + 1; i < bytes; i++) {
        result = callback(result, inv(data[i]), 8);
      }
      var lastBits = (bits + offset) % 8;
      if (lastBits > 0) {
        result = callback(result, inv(data[bytes]) >> 8 - lastBits, lastBits);
      }
      return result;
    };
    var parseFloatFromBits = function(data, precisionBits, exponentBits) {
      var bias = Math.pow(2, exponentBits - 1) - 1;
      var sign = parseBits(data, 1);
      var exponent = parseBits(data, exponentBits, 1);
      if (exponent === 0) {
        return 0;
      }
      var precisionBitsCounter = 1;
      var parsePrecisionBits = function(lastValue, newValue, bits) {
        if (lastValue === 0) {
          lastValue = 1;
        }
        for (var i = 1; i <= bits; i++) {
          precisionBitsCounter /= 2;
          if ((newValue & 1 << bits - i) > 0) {
            lastValue += precisionBitsCounter;
          }
        }
        return lastValue;
      };
      var mantissa = parseBits(data, precisionBits, exponentBits + 1, false, parsePrecisionBits);
      if (exponent == Math.pow(2, exponentBits + 1) - 1) {
        if (mantissa === 0) {
          return sign === 0 ? Infinity : -Infinity;
        }
        return NaN;
      }
      return (sign === 0 ? 1 : -1) * Math.pow(2, exponent - bias) * mantissa;
    };
    var parseInt16 = function(value) {
      if (parseBits(value, 1) == 1) {
        return -1 * (parseBits(value, 15, 1, true) + 1);
      }
      return parseBits(value, 15, 1);
    };
    var parseInt32 = function(value) {
      if (parseBits(value, 1) == 1) {
        return -1 * (parseBits(value, 31, 1, true) + 1);
      }
      return parseBits(value, 31, 1);
    };
    var parseFloat32 = function(value) {
      return parseFloatFromBits(value, 23, 8);
    };
    var parseFloat64 = function(value) {
      return parseFloatFromBits(value, 52, 11);
    };
    var parseNumeric = function(value) {
      var sign = parseBits(value, 16, 32);
      if (sign == 49152) {
        return NaN;
      }
      var weight = Math.pow(1e4, parseBits(value, 16, 16));
      var result = 0;
      var digits = [];
      var ndigits = parseBits(value, 16);
      for (var i = 0; i < ndigits; i++) {
        result += parseBits(value, 16, 64 + 16 * i) * weight;
        weight /= 1e4;
      }
      var scale = Math.pow(10, parseBits(value, 16, 48));
      return (sign === 0 ? 1 : -1) * Math.round(result * scale) / scale;
    };
    var parseDate = function(isUTC, value) {
      var sign = parseBits(value, 1);
      var rawValue = parseBits(value, 63, 1);
      var result = new Date((sign === 0 ? 1 : -1) * rawValue / 1e3 + 9466848e5);
      if (!isUTC) {
        result.setTime(result.getTime() + result.getTimezoneOffset() * 6e4);
      }
      result.usec = rawValue % 1e3;
      result.getMicroSeconds = function() {
        return this.usec;
      };
      result.setMicroSeconds = function(value2) {
        this.usec = value2;
      };
      result.getUTCMicroSeconds = function() {
        return this.usec;
      };
      return result;
    };
    var parseArray = function(value) {
      var dim = parseBits(value, 32);
      var flags = parseBits(value, 32, 32);
      var elementType = parseBits(value, 32, 64);
      var offset = 96;
      var dims = [];
      for (var i = 0; i < dim; i++) {
        dims[i] = parseBits(value, 32, offset);
        offset += 32;
        offset += 32;
      }
      var parseElement = function(elementType2) {
        var length = parseBits(value, 32, offset);
        offset += 32;
        if (length == 4294967295) {
          return null;
        }
        var result;
        if (elementType2 == 23 || elementType2 == 20) {
          result = parseBits(value, length * 8, offset);
          offset += length * 8;
          return result;
        } else if (elementType2 == 25) {
          result = value.toString(this.encoding, offset >> 3, (offset += length << 3) >> 3);
          return result;
        } else {
          console.log("ERROR: ElementType not implemented: " + elementType2);
        }
      };
      var parse2 = function(dimension, elementType2) {
        var array = [];
        var i2;
        if (dimension.length > 1) {
          var count = dimension.shift();
          for (i2 = 0; i2 < count; i2++) {
            array[i2] = parse2(dimension, elementType2);
          }
          dimension.unshift(count);
        } else {
          for (i2 = 0; i2 < dimension[0]; i2++) {
            array[i2] = parseElement(elementType2);
          }
        }
        return array;
      };
      return parse2(dims, elementType);
    };
    var parseText = function(value) {
      return value.toString("utf8");
    };
    var parseBool = function(value) {
      if (value === null)
        return null;
      return parseBits(value, 8) > 0;
    };
    var init = function(register) {
      register(20, parseInt64);
      register(21, parseInt16);
      register(23, parseInt32);
      register(26, parseInt32);
      register(1700, parseNumeric);
      register(700, parseFloat32);
      register(701, parseFloat64);
      register(16, parseBool);
      register(1114, parseDate.bind(null, false));
      register(1184, parseDate.bind(null, true));
      register(1e3, parseArray);
      register(1007, parseArray);
      register(1016, parseArray);
      register(1008, parseArray);
      register(1009, parseArray);
      register(25, parseText);
    };
    module2.exports = {
      init
    };
  }
});

// node_modules/pg-types/lib/builtins.js
var require_builtins = __commonJS({
  "node_modules/pg-types/lib/builtins.js"(exports2, module2) {
    module2.exports = {
      BOOL: 16,
      BYTEA: 17,
      CHAR: 18,
      INT8: 20,
      INT2: 21,
      INT4: 23,
      REGPROC: 24,
      TEXT: 25,
      OID: 26,
      TID: 27,
      XID: 28,
      CID: 29,
      JSON: 114,
      XML: 142,
      PG_NODE_TREE: 194,
      SMGR: 210,
      PATH: 602,
      POLYGON: 604,
      CIDR: 650,
      FLOAT4: 700,
      FLOAT8: 701,
      ABSTIME: 702,
      RELTIME: 703,
      TINTERVAL: 704,
      CIRCLE: 718,
      MACADDR8: 774,
      MONEY: 790,
      MACADDR: 829,
      INET: 869,
      ACLITEM: 1033,
      BPCHAR: 1042,
      VARCHAR: 1043,
      DATE: 1082,
      TIME: 1083,
      TIMESTAMP: 1114,
      TIMESTAMPTZ: 1184,
      INTERVAL: 1186,
      TIMETZ: 1266,
      BIT: 1560,
      VARBIT: 1562,
      NUMERIC: 1700,
      REFCURSOR: 1790,
      REGPROCEDURE: 2202,
      REGOPER: 2203,
      REGOPERATOR: 2204,
      REGCLASS: 2205,
      REGTYPE: 2206,
      UUID: 2950,
      TXID_SNAPSHOT: 2970,
      PG_LSN: 3220,
      PG_NDISTINCT: 3361,
      PG_DEPENDENCIES: 3402,
      TSVECTOR: 3614,
      TSQUERY: 3615,
      GTSVECTOR: 3642,
      REGCONFIG: 3734,
      REGDICTIONARY: 3769,
      JSONB: 3802,
      REGNAMESPACE: 4089,
      REGROLE: 4096
    };
  }
});

// node_modules/pg-types/index.js
var require_pg_types = __commonJS({
  "node_modules/pg-types/index.js"(exports2) {
    var textParsers = require_textParsers();
    var binaryParsers = require_binaryParsers();
    var arrayParser = require_arrayParser();
    var builtinTypes = require_builtins();
    exports2.getTypeParser = getTypeParser;
    exports2.setTypeParser = setTypeParser;
    exports2.arrayParser = arrayParser;
    exports2.builtins = builtinTypes;
    var typeParsers = {
      text: {},
      binary: {}
    };
    function noParse(val2) {
      return String(val2);
    }
    function getTypeParser(oid, format) {
      format = format || "text";
      if (!typeParsers[format]) {
        return noParse;
      }
      return typeParsers[format][oid] || noParse;
    }
    function setTypeParser(oid, format, parseFn) {
      if (typeof format == "function") {
        parseFn = format;
        format = "text";
      }
      typeParsers[format][oid] = parseFn;
    }
    textParsers.init(function(oid, converter) {
      typeParsers.text[oid] = converter;
    });
    binaryParsers.init(function(oid, converter) {
      typeParsers.binary[oid] = converter;
    });
  }
});

// node_modules/pg/lib/defaults.js
var require_defaults = __commonJS({
  "node_modules/pg/lib/defaults.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      // database host. defaults to localhost
      host: "localhost",
      // database user's name
      user: process.platform === "win32" ? process.env.USERNAME : process.env.USER,
      // name of database to connect
      database: void 0,
      // database user's password
      password: null,
      // a Postgres connection string to be used instead of setting individual connection items
      // NOTE:  Setting this value will cause it to override any other value (such as database or user) defined
      // in the defaults object.
      connectionString: void 0,
      // database port
      port: 5432,
      // number of rows to return at a time from a prepared statement's
      // portal. 0 will return all rows at once
      rows: 0,
      // binary result mode
      binary: false,
      // Connection pool options - see https://github.com/brianc/node-pg-pool
      // number of connections to use in connection pool
      // 0 will disable connection pooling
      max: 10,
      // max milliseconds a client can go unused before it is removed
      // from the pool and destroyed
      idleTimeoutMillis: 3e4,
      client_encoding: "",
      ssl: false,
      application_name: void 0,
      fallback_application_name: void 0,
      options: void 0,
      parseInputDatesAsUTC: false,
      // max milliseconds any query using this connection will execute for before timing out in error.
      // false=unlimited
      statement_timeout: false,
      // Abort any statement that waits longer than the specified duration in milliseconds while attempting to acquire a lock.
      // false=unlimited
      lock_timeout: false,
      // Terminate any session with an open transaction that has been idle for longer than the specified duration in milliseconds
      // false=unlimited
      idle_in_transaction_session_timeout: false,
      // max milliseconds to wait for query to complete (client side)
      query_timeout: false,
      connect_timeout: 0,
      keepalives: 1,
      keepalives_idle: 0
    };
    var pgTypes = require_pg_types();
    var parseBigInteger = pgTypes.getTypeParser(20, "text");
    var parseBigIntegerArray = pgTypes.getTypeParser(1016, "text");
    module2.exports.__defineSetter__("parseInt8", function(val2) {
      pgTypes.setTypeParser(20, "text", val2 ? pgTypes.getTypeParser(23, "text") : parseBigInteger);
      pgTypes.setTypeParser(1016, "text", val2 ? pgTypes.getTypeParser(1007, "text") : parseBigIntegerArray);
    });
  }
});

// node_modules/pg/lib/utils.js
var require_utils = __commonJS({
  "node_modules/pg/lib/utils.js"(exports2, module2) {
    "use strict";
    var defaults = require_defaults();
    function escapeElement(elementRepresentation) {
      var escaped = elementRepresentation.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return '"' + escaped + '"';
    }
    function arrayString(val2) {
      var result = "{";
      for (var i = 0; i < val2.length; i++) {
        if (i > 0) {
          result = result + ",";
        }
        if (val2[i] === null || typeof val2[i] === "undefined") {
          result = result + "NULL";
        } else if (Array.isArray(val2[i])) {
          result = result + arrayString(val2[i]);
        } else if (ArrayBuffer.isView(val2[i])) {
          var item = val2[i];
          if (!(item instanceof Buffer)) {
            var buf = Buffer.from(item.buffer, item.byteOffset, item.byteLength);
            if (buf.length === item.byteLength) {
              item = buf;
            } else {
              item = buf.slice(item.byteOffset, item.byteOffset + item.byteLength);
            }
          }
          result += "\\\\x" + item.toString("hex");
        } else {
          result += escapeElement(prepareValue(val2[i]));
        }
      }
      result = result + "}";
      return result;
    }
    var prepareValue = function(val2, seen) {
      if (val2 == null) {
        return null;
      }
      if (val2 instanceof Buffer) {
        return val2;
      }
      if (ArrayBuffer.isView(val2)) {
        var buf = Buffer.from(val2.buffer, val2.byteOffset, val2.byteLength);
        if (buf.length === val2.byteLength) {
          return buf;
        }
        return buf.slice(val2.byteOffset, val2.byteOffset + val2.byteLength);
      }
      if (val2 instanceof Date) {
        if (defaults.parseInputDatesAsUTC) {
          return dateToStringUTC(val2);
        } else {
          return dateToString(val2);
        }
      }
      if (Array.isArray(val2)) {
        return arrayString(val2);
      }
      if (typeof val2 === "object") {
        return prepareObject(val2, seen);
      }
      return val2.toString();
    };
    function prepareObject(val2, seen) {
      if (val2 && typeof val2.toPostgres === "function") {
        seen = seen || [];
        if (seen.indexOf(val2) !== -1) {
          throw new Error('circular reference detected while preparing "' + val2 + '" for query');
        }
        seen.push(val2);
        return prepareValue(val2.toPostgres(prepareValue), seen);
      }
      return JSON.stringify(val2);
    }
    function pad(number, digits) {
      number = "" + number;
      while (number.length < digits) {
        number = "0" + number;
      }
      return number;
    }
    function dateToString(date) {
      var offset = -date.getTimezoneOffset();
      var year = date.getFullYear();
      var isBCYear = year < 1;
      if (isBCYear)
        year = Math.abs(year) + 1;
      var ret = pad(year, 4) + "-" + pad(date.getMonth() + 1, 2) + "-" + pad(date.getDate(), 2) + "T" + pad(date.getHours(), 2) + ":" + pad(date.getMinutes(), 2) + ":" + pad(date.getSeconds(), 2) + "." + pad(date.getMilliseconds(), 3);
      if (offset < 0) {
        ret += "-";
        offset *= -1;
      } else {
        ret += "+";
      }
      ret += pad(Math.floor(offset / 60), 2) + ":" + pad(offset % 60, 2);
      if (isBCYear)
        ret += " BC";
      return ret;
    }
    function dateToStringUTC(date) {
      var year = date.getUTCFullYear();
      var isBCYear = year < 1;
      if (isBCYear)
        year = Math.abs(year) + 1;
      var ret = pad(year, 4) + "-" + pad(date.getUTCMonth() + 1, 2) + "-" + pad(date.getUTCDate(), 2) + "T" + pad(date.getUTCHours(), 2) + ":" + pad(date.getUTCMinutes(), 2) + ":" + pad(date.getUTCSeconds(), 2) + "." + pad(date.getUTCMilliseconds(), 3);
      ret += "+00:00";
      if (isBCYear)
        ret += " BC";
      return ret;
    }
    function normalizeQueryConfig(config, values, callback) {
      config = typeof config === "string" ? { text: config } : config;
      if (values) {
        if (typeof values === "function") {
          config.callback = values;
        } else {
          config.values = values;
        }
      }
      if (callback) {
        config.callback = callback;
      }
      return config;
    }
    var escapeIdentifier = function(str) {
      return '"' + str.replace(/"/g, '""') + '"';
    };
    var escapeLiteral = function(str) {
      var hasBackslash = false;
      var escaped = "'";
      for (var i = 0; i < str.length; i++) {
        var c = str[i];
        if (c === "'") {
          escaped += c + c;
        } else if (c === "\\") {
          escaped += c + c;
          hasBackslash = true;
        } else {
          escaped += c;
        }
      }
      escaped += "'";
      if (hasBackslash === true) {
        escaped = " E" + escaped;
      }
      return escaped;
    };
    module2.exports = {
      prepareValue: function prepareValueWrapper(value) {
        return prepareValue(value);
      },
      normalizeQueryConfig,
      escapeIdentifier,
      escapeLiteral
    };
  }
});

// node_modules/pg/lib/crypto/utils-legacy.js
var require_utils_legacy = __commonJS({
  "node_modules/pg/lib/crypto/utils-legacy.js"(exports2, module2) {
    "use strict";
    var nodeCrypto = require("crypto");
    function md52(string) {
      return nodeCrypto.createHash("md5").update(string, "utf-8").digest("hex");
    }
    function postgresMd5PasswordHash(user, password, salt) {
      var inner = md52(password + user);
      var outer = md52(Buffer.concat([Buffer.from(inner), salt]));
      return "md5" + outer;
    }
    function sha256(text) {
      return nodeCrypto.createHash("sha256").update(text).digest();
    }
    function hmacSha256(key, msg) {
      return nodeCrypto.createHmac("sha256", key).update(msg).digest();
    }
    async function deriveKey(password, salt, iterations) {
      return nodeCrypto.pbkdf2Sync(password, salt, iterations, 32, "sha256");
    }
    module2.exports = {
      postgresMd5PasswordHash,
      randomBytes: nodeCrypto.randomBytes,
      deriveKey,
      sha256,
      hmacSha256,
      md5: md52
    };
  }
});

// node_modules/pg/lib/crypto/utils-webcrypto.js
var require_utils_webcrypto = __commonJS({
  "node_modules/pg/lib/crypto/utils-webcrypto.js"(exports2, module2) {
    var nodeCrypto = require("crypto");
    module2.exports = {
      postgresMd5PasswordHash,
      randomBytes,
      deriveKey,
      sha256,
      hmacSha256,
      md5: md52
    };
    var webCrypto = nodeCrypto.webcrypto || globalThis.crypto;
    var subtleCrypto = webCrypto.subtle;
    var textEncoder = new TextEncoder();
    function randomBytes(length) {
      return webCrypto.getRandomValues(Buffer.alloc(length));
    }
    async function md52(string) {
      try {
        return nodeCrypto.createHash("md5").update(string, "utf-8").digest("hex");
      } catch (e) {
        const data = typeof string === "string" ? textEncoder.encode(string) : string;
        const hash = await subtleCrypto.digest("MD5", data);
        return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
      }
    }
    async function postgresMd5PasswordHash(user, password, salt) {
      var inner = await md52(password + user);
      var outer = await md52(Buffer.concat([Buffer.from(inner), salt]));
      return "md5" + outer;
    }
    async function sha256(text) {
      return await subtleCrypto.digest("SHA-256", text);
    }
    async function hmacSha256(keyBuffer, msg) {
      const key = await subtleCrypto.importKey("raw", keyBuffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      return await subtleCrypto.sign("HMAC", key, textEncoder.encode(msg));
    }
    async function deriveKey(password, salt, iterations) {
      const key = await subtleCrypto.importKey("raw", textEncoder.encode(password), "PBKDF2", false, ["deriveBits"]);
      const params = { name: "PBKDF2", hash: "SHA-256", salt, iterations };
      return await subtleCrypto.deriveBits(params, key, 32 * 8, ["deriveBits"]);
    }
  }
});

// node_modules/pg/lib/crypto/utils.js
var require_utils2 = __commonJS({
  "node_modules/pg/lib/crypto/utils.js"(exports2, module2) {
    "use strict";
    var useLegacyCrypto = parseInt(process.versions && process.versions.node && process.versions.node.split(".")[0]) < 15;
    if (useLegacyCrypto) {
      module2.exports = require_utils_legacy();
    } else {
      module2.exports = require_utils_webcrypto();
    }
  }
});

// node_modules/pg/lib/crypto/sasl.js
var require_sasl = __commonJS({
  "node_modules/pg/lib/crypto/sasl.js"(exports2, module2) {
    "use strict";
    var crypto5 = require_utils2();
    function startSession(mechanisms) {
      if (mechanisms.indexOf("SCRAM-SHA-256") === -1) {
        throw new Error("SASL: Only mechanism SCRAM-SHA-256 is currently supported");
      }
      const clientNonce = crypto5.randomBytes(18).toString("base64");
      return {
        mechanism: "SCRAM-SHA-256",
        clientNonce,
        response: "n,,n=*,r=" + clientNonce,
        message: "SASLInitialResponse"
      };
    }
    async function continueSession(session, password, serverData) {
      if (session.message !== "SASLInitialResponse") {
        throw new Error("SASL: Last message was not SASLInitialResponse");
      }
      if (typeof password !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string");
      }
      if (password === "") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a non-empty string");
      }
      if (typeof serverData !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: serverData must be a string");
      }
      const sv = parseServerFirstMessage(serverData);
      if (!sv.nonce.startsWith(session.clientNonce)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce");
      } else if (sv.nonce.length === session.clientNonce.length) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
      }
      var clientFirstMessageBare = "n=*,r=" + session.clientNonce;
      var serverFirstMessage = "r=" + sv.nonce + ",s=" + sv.salt + ",i=" + sv.iteration;
      var clientFinalMessageWithoutProof = "c=biws,r=" + sv.nonce;
      var authMessage = clientFirstMessageBare + "," + serverFirstMessage + "," + clientFinalMessageWithoutProof;
      var saltBytes = Buffer.from(sv.salt, "base64");
      var saltedPassword = await crypto5.deriveKey(password, saltBytes, sv.iteration);
      var clientKey = await crypto5.hmacSha256(saltedPassword, "Client Key");
      var storedKey = await crypto5.sha256(clientKey);
      var clientSignature = await crypto5.hmacSha256(storedKey, authMessage);
      var clientProof = xorBuffers(Buffer.from(clientKey), Buffer.from(clientSignature)).toString("base64");
      var serverKey = await crypto5.hmacSha256(saltedPassword, "Server Key");
      var serverSignatureBytes = await crypto5.hmacSha256(serverKey, authMessage);
      session.message = "SASLResponse";
      session.serverSignature = Buffer.from(serverSignatureBytes).toString("base64");
      session.response = clientFinalMessageWithoutProof + ",p=" + clientProof;
    }
    function finalizeSession(session, serverData) {
      if (session.message !== "SASLResponse") {
        throw new Error("SASL: Last message was not SASLResponse");
      }
      if (typeof serverData !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: serverData must be a string");
      }
      const { serverSignature } = parseServerFinalMessage(serverData);
      if (serverSignature !== session.serverSignature) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature does not match");
      }
    }
    function isPrintableChars(text) {
      if (typeof text !== "string") {
        throw new TypeError("SASL: text must be a string");
      }
      return text.split("").map((_, i) => text.charCodeAt(i)).every((c) => c >= 33 && c <= 43 || c >= 45 && c <= 126);
    }
    function isBase64(text) {
      return /^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(text);
    }
    function parseAttributePairs(text) {
      if (typeof text !== "string") {
        throw new TypeError("SASL: attribute pairs text must be a string");
      }
      return new Map(
        text.split(",").map((attrValue) => {
          if (!/^.=/.test(attrValue)) {
            throw new Error("SASL: Invalid attribute pair entry");
          }
          const name = attrValue[0];
          const value = attrValue.substring(2);
          return [name, value];
        })
      );
    }
    function parseServerFirstMessage(data) {
      const attrPairs = parseAttributePairs(data);
      const nonce = attrPairs.get("r");
      if (!nonce) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing");
      } else if (!isPrintableChars(nonce)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce must only contain printable characters");
      }
      const salt = attrPairs.get("s");
      if (!salt) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing");
      } else if (!isBase64(salt)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt must be base64");
      }
      const iterationText = attrPairs.get("i");
      if (!iterationText) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration missing");
      } else if (!/^[1-9][0-9]*$/.test(iterationText)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: invalid iteration count");
      }
      const iteration = parseInt(iterationText, 10);
      return {
        nonce,
        salt,
        iteration
      };
    }
    function parseServerFinalMessage(serverData) {
      const attrPairs = parseAttributePairs(serverData);
      const serverSignature = attrPairs.get("v");
      if (!serverSignature) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing");
      } else if (!isBase64(serverSignature)) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature must be base64");
      }
      return {
        serverSignature
      };
    }
    function xorBuffers(a, b) {
      if (!Buffer.isBuffer(a)) {
        throw new TypeError("first argument must be a Buffer");
      }
      if (!Buffer.isBuffer(b)) {
        throw new TypeError("second argument must be a Buffer");
      }
      if (a.length !== b.length) {
        throw new Error("Buffer lengths must match");
      }
      if (a.length === 0) {
        throw new Error("Buffers cannot be empty");
      }
      return Buffer.from(a.map((_, i) => a[i] ^ b[i]));
    }
    module2.exports = {
      startSession,
      continueSession,
      finalizeSession
    };
  }
});

// node_modules/pg/lib/type-overrides.js
var require_type_overrides = __commonJS({
  "node_modules/pg/lib/type-overrides.js"(exports2, module2) {
    "use strict";
    var types = require_pg_types();
    function TypeOverrides(userTypes) {
      this._types = userTypes || types;
      this.text = {};
      this.binary = {};
    }
    TypeOverrides.prototype.getOverrides = function(format) {
      switch (format) {
        case "text":
          return this.text;
        case "binary":
          return this.binary;
        default:
          return {};
      }
    };
    TypeOverrides.prototype.setTypeParser = function(oid, format, parseFn) {
      if (typeof format === "function") {
        parseFn = format;
        format = "text";
      }
      this.getOverrides(format)[oid] = parseFn;
    };
    TypeOverrides.prototype.getTypeParser = function(oid, format) {
      format = format || "text";
      return this.getOverrides(format)[oid] || this._types.getTypeParser(oid, format);
    };
    module2.exports = TypeOverrides;
  }
});

// node_modules/pg-connection-string/index.js
var require_pg_connection_string = __commonJS({
  "node_modules/pg-connection-string/index.js"(exports2, module2) {
    "use strict";
    function parse2(str) {
      if (str.charAt(0) === "/") {
        const config2 = str.split(" ");
        return { host: config2[0], database: config2[1] };
      }
      const config = {};
      let result;
      let dummyHost = false;
      if (/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(str)) {
        str = encodeURI(str).replace(/\%25(\d\d)/g, "%$1");
      }
      try {
        result = new URL(str, "postgres://base");
      } catch (e) {
        result = new URL(str.replace("@/", "@___DUMMY___/"), "postgres://base");
        dummyHost = true;
      }
      for (const entry of result.searchParams.entries()) {
        config[entry[0]] = entry[1];
      }
      config.user = config.user || decodeURIComponent(result.username);
      config.password = config.password || decodeURIComponent(result.password);
      if (result.protocol == "socket:") {
        config.host = decodeURI(result.pathname);
        config.database = result.searchParams.get("db");
        config.client_encoding = result.searchParams.get("encoding");
        return config;
      }
      const hostname = dummyHost ? "" : result.hostname;
      if (!config.host) {
        config.host = decodeURIComponent(hostname);
      } else if (hostname && /^%2f/i.test(hostname)) {
        result.pathname = hostname + result.pathname;
      }
      if (!config.port) {
        config.port = result.port;
      }
      const pathname = result.pathname.slice(1) || null;
      config.database = pathname ? decodeURI(pathname) : null;
      if (config.ssl === "true" || config.ssl === "1") {
        config.ssl = true;
      }
      if (config.ssl === "0") {
        config.ssl = false;
      }
      if (config.sslcert || config.sslkey || config.sslrootcert || config.sslmode) {
        config.ssl = {};
      }
      const fs = config.sslcert || config.sslkey || config.sslrootcert ? require("fs") : null;
      if (config.sslcert) {
        config.ssl.cert = fs.readFileSync(config.sslcert).toString();
      }
      if (config.sslkey) {
        config.ssl.key = fs.readFileSync(config.sslkey).toString();
      }
      if (config.sslrootcert) {
        config.ssl.ca = fs.readFileSync(config.sslrootcert).toString();
      }
      switch (config.sslmode) {
        case "disable": {
          config.ssl = false;
          break;
        }
        case "prefer":
        case "require":
        case "verify-ca":
        case "verify-full": {
          break;
        }
        case "no-verify": {
          config.ssl.rejectUnauthorized = false;
          break;
        }
      }
      return config;
    }
    module2.exports = parse2;
    parse2.parse = parse2;
  }
});

// node_modules/pg/lib/connection-parameters.js
var require_connection_parameters = __commonJS({
  "node_modules/pg/lib/connection-parameters.js"(exports2, module2) {
    "use strict";
    var dns = require("dns");
    var defaults = require_defaults();
    var parse2 = require_pg_connection_string().parse;
    var val2 = function(key, config, envVar) {
      if (envVar === void 0) {
        envVar = process.env["PG" + key.toUpperCase()];
      } else if (envVar === false) {
      } else {
        envVar = process.env[envVar];
      }
      return config[key] || envVar || defaults[key];
    };
    var readSSLConfigFromEnvironment = function() {
      switch (process.env.PGSSLMODE) {
        case "disable":
          return false;
        case "prefer":
        case "require":
        case "verify-ca":
        case "verify-full":
          return true;
        case "no-verify":
          return { rejectUnauthorized: false };
      }
      return defaults.ssl;
    };
    var quoteParamValue = function(value) {
      return "'" + ("" + value).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
    };
    var add = function(params, config, paramName) {
      var value = config[paramName];
      if (value !== void 0 && value !== null) {
        params.push(paramName + "=" + quoteParamValue(value));
      }
    };
    var ConnectionParameters = class {
      constructor(config) {
        config = typeof config === "string" ? parse2(config) : config || {};
        if (config.connectionString) {
          config = Object.assign({}, config, parse2(config.connectionString));
        }
        this.user = val2("user", config);
        this.database = val2("database", config);
        if (this.database === void 0) {
          this.database = this.user;
        }
        this.port = parseInt(val2("port", config), 10);
        this.host = val2("host", config);
        Object.defineProperty(this, "password", {
          configurable: true,
          enumerable: false,
          writable: true,
          value: val2("password", config)
        });
        this.binary = val2("binary", config);
        this.options = val2("options", config);
        this.ssl = typeof config.ssl === "undefined" ? readSSLConfigFromEnvironment() : config.ssl;
        if (typeof this.ssl === "string") {
          if (this.ssl === "true") {
            this.ssl = true;
          }
        }
        if (this.ssl === "no-verify") {
          this.ssl = { rejectUnauthorized: false };
        }
        if (this.ssl && this.ssl.key) {
          Object.defineProperty(this.ssl, "key", {
            enumerable: false
          });
        }
        this.client_encoding = val2("client_encoding", config);
        this.replication = val2("replication", config);
        this.isDomainSocket = !(this.host || "").indexOf("/");
        this.application_name = val2("application_name", config, "PGAPPNAME");
        this.fallback_application_name = val2("fallback_application_name", config, false);
        this.statement_timeout = val2("statement_timeout", config, false);
        this.lock_timeout = val2("lock_timeout", config, false);
        this.idle_in_transaction_session_timeout = val2("idle_in_transaction_session_timeout", config, false);
        this.query_timeout = val2("query_timeout", config, false);
        if (config.connectionTimeoutMillis === void 0) {
          this.connect_timeout = process.env.PGCONNECT_TIMEOUT || 0;
        } else {
          this.connect_timeout = Math.floor(config.connectionTimeoutMillis / 1e3);
        }
        if (config.keepAlive === false) {
          this.keepalives = 0;
        } else if (config.keepAlive === true) {
          this.keepalives = 1;
        }
        if (typeof config.keepAliveInitialDelayMillis === "number") {
          this.keepalives_idle = Math.floor(config.keepAliveInitialDelayMillis / 1e3);
        }
      }
      getLibpqConnectionString(cb) {
        var params = [];
        add(params, this, "user");
        add(params, this, "password");
        add(params, this, "port");
        add(params, this, "application_name");
        add(params, this, "fallback_application_name");
        add(params, this, "connect_timeout");
        add(params, this, "options");
        var ssl = typeof this.ssl === "object" ? this.ssl : this.ssl ? { sslmode: this.ssl } : {};
        add(params, ssl, "sslmode");
        add(params, ssl, "sslca");
        add(params, ssl, "sslkey");
        add(params, ssl, "sslcert");
        add(params, ssl, "sslrootcert");
        if (this.database) {
          params.push("dbname=" + quoteParamValue(this.database));
        }
        if (this.replication) {
          params.push("replication=" + quoteParamValue(this.replication));
        }
        if (this.host) {
          params.push("host=" + quoteParamValue(this.host));
        }
        if (this.isDomainSocket) {
          return cb(null, params.join(" "));
        }
        if (this.client_encoding) {
          params.push("client_encoding=" + quoteParamValue(this.client_encoding));
        }
        dns.lookup(this.host, function(err, address) {
          if (err)
            return cb(err, null);
          params.push("hostaddr=" + quoteParamValue(address));
          return cb(null, params.join(" "));
        });
      }
    };
    module2.exports = ConnectionParameters;
  }
});

// node_modules/pg/lib/result.js
var require_result = __commonJS({
  "node_modules/pg/lib/result.js"(exports2, module2) {
    "use strict";
    var types = require_pg_types();
    var matchRegexp = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/;
    var Result = class {
      constructor(rowMode, types2) {
        this.command = null;
        this.rowCount = null;
        this.oid = null;
        this.rows = [];
        this.fields = [];
        this._parsers = void 0;
        this._types = types2;
        this.RowCtor = null;
        this.rowAsArray = rowMode === "array";
        if (this.rowAsArray) {
          this.parseRow = this._parseRowAsArray;
        }
        this._prebuiltEmptyResultObject = null;
      }
      // adds a command complete message
      addCommandComplete(msg) {
        var match;
        if (msg.text) {
          match = matchRegexp.exec(msg.text);
        } else {
          match = matchRegexp.exec(msg.command);
        }
        if (match) {
          this.command = match[1];
          if (match[3]) {
            this.oid = parseInt(match[2], 10);
            this.rowCount = parseInt(match[3], 10);
          } else if (match[2]) {
            this.rowCount = parseInt(match[2], 10);
          }
        }
      }
      _parseRowAsArray(rowData) {
        var row = new Array(rowData.length);
        for (var i = 0, len = rowData.length; i < len; i++) {
          var rawValue = rowData[i];
          if (rawValue !== null) {
            row[i] = this._parsers[i](rawValue);
          } else {
            row[i] = null;
          }
        }
        return row;
      }
      parseRow(rowData) {
        var row = { ...this._prebuiltEmptyResultObject };
        for (var i = 0, len = rowData.length; i < len; i++) {
          var rawValue = rowData[i];
          var field = this.fields[i].name;
          if (rawValue !== null) {
            row[field] = this._parsers[i](rawValue);
          } else {
            row[field] = null;
          }
        }
        return row;
      }
      addRow(row) {
        this.rows.push(row);
      }
      addFields(fieldDescriptions) {
        this.fields = fieldDescriptions;
        if (this.fields.length) {
          this._parsers = new Array(fieldDescriptions.length);
        }
        var row = {};
        for (var i = 0; i < fieldDescriptions.length; i++) {
          var desc = fieldDescriptions[i];
          row[desc.name] = null;
          if (this._types) {
            this._parsers[i] = this._types.getTypeParser(desc.dataTypeID, desc.format || "text");
          } else {
            this._parsers[i] = types.getTypeParser(desc.dataTypeID, desc.format || "text");
          }
        }
        this._prebuiltEmptyResultObject = { ...row };
      }
    };
    module2.exports = Result;
  }
});

// node_modules/pg/lib/query.js
var require_query = __commonJS({
  "node_modules/pg/lib/query.js"(exports2, module2) {
    "use strict";
    var { EventEmitter } = require("events");
    var Result = require_result();
    var utils = require_utils();
    var Query = class extends EventEmitter {
      constructor(config, values, callback) {
        super();
        config = utils.normalizeQueryConfig(config, values, callback);
        this.text = config.text;
        this.values = config.values;
        this.rows = config.rows;
        this.types = config.types;
        this.name = config.name;
        this.queryMode = config.queryMode;
        this.binary = config.binary;
        this.portal = config.portal || "";
        this.callback = config.callback;
        this._rowMode = config.rowMode;
        if (process.domain && config.callback) {
          this.callback = process.domain.bind(config.callback);
        }
        this._result = new Result(this._rowMode, this.types);
        this._results = this._result;
        this._canceledDueToError = false;
      }
      requiresPreparation() {
        if (this.queryMode === "extended") {
          return true;
        }
        if (this.name) {
          return true;
        }
        if (this.rows) {
          return true;
        }
        if (!this.text) {
          return false;
        }
        if (!this.values) {
          return false;
        }
        return this.values.length > 0;
      }
      _checkForMultirow() {
        if (this._result.command) {
          if (!Array.isArray(this._results)) {
            this._results = [this._result];
          }
          this._result = new Result(this._rowMode, this.types);
          this._results.push(this._result);
        }
      }
      // associates row metadata from the supplied
      // message with this query object
      // metadata used when parsing row results
      handleRowDescription(msg) {
        this._checkForMultirow();
        this._result.addFields(msg.fields);
        this._accumulateRows = this.callback || !this.listeners("row").length;
      }
      handleDataRow(msg) {
        let row;
        if (this._canceledDueToError) {
          return;
        }
        try {
          row = this._result.parseRow(msg.fields);
        } catch (err) {
          this._canceledDueToError = err;
          return;
        }
        this.emit("row", row, this._result);
        if (this._accumulateRows) {
          this._result.addRow(row);
        }
      }
      handleCommandComplete(msg, connection) {
        this._checkForMultirow();
        this._result.addCommandComplete(msg);
        if (this.rows) {
          connection.sync();
        }
      }
      // if a named prepared statement is created with empty query text
      // the backend will send an emptyQuery message but *not* a command complete message
      // since we pipeline sync immediately after execute we don't need to do anything here
      // unless we have rows specified, in which case we did not pipeline the intial sync call
      handleEmptyQuery(connection) {
        if (this.rows) {
          connection.sync();
        }
      }
      handleError(err, connection) {
        if (this._canceledDueToError) {
          err = this._canceledDueToError;
          this._canceledDueToError = false;
        }
        if (this.callback) {
          return this.callback(err);
        }
        this.emit("error", err);
      }
      handleReadyForQuery(con) {
        if (this._canceledDueToError) {
          return this.handleError(this._canceledDueToError, con);
        }
        if (this.callback) {
          try {
            this.callback(null, this._results);
          } catch (err) {
            process.nextTick(() => {
              throw err;
            });
          }
        }
        this.emit("end", this._results);
      }
      submit(connection) {
        if (typeof this.text !== "string" && typeof this.name !== "string") {
          return new Error("A query must have either text or a name. Supplying neither is unsupported.");
        }
        const previous = connection.parsedStatements[this.name];
        if (this.text && previous && this.text !== previous) {
          return new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
        }
        if (this.values && !Array.isArray(this.values)) {
          return new Error("Query values must be an array");
        }
        if (this.requiresPreparation()) {
          this.prepare(connection);
        } else {
          connection.query(this.text);
        }
        return null;
      }
      hasBeenParsed(connection) {
        return this.name && connection.parsedStatements[this.name];
      }
      handlePortalSuspended(connection) {
        this._getRows(connection, this.rows);
      }
      _getRows(connection, rows) {
        connection.execute({
          portal: this.portal,
          rows
        });
        if (!rows) {
          connection.sync();
        } else {
          connection.flush();
        }
      }
      // http://developer.postgresql.org/pgdocs/postgres/protocol-flow.html#PROTOCOL-FLOW-EXT-QUERY
      prepare(connection) {
        if (!this.hasBeenParsed(connection)) {
          connection.parse({
            text: this.text,
            name: this.name,
            types: this.types
          });
        }
        try {
          connection.bind({
            portal: this.portal,
            statement: this.name,
            values: this.values,
            binary: this.binary,
            valueMapper: utils.prepareValue
          });
        } catch (err) {
          this.handleError(err, connection);
          return;
        }
        connection.describe({
          type: "P",
          name: this.portal || ""
        });
        this._getRows(connection, this.rows);
      }
      handleCopyInResponse(connection) {
        connection.sendCopyFail("No source stream defined");
      }
      // eslint-disable-next-line no-unused-vars
      handleCopyData(msg, connection) {
      }
    };
    module2.exports = Query;
  }
});

// node_modules/pg-protocol/dist/messages.js
var require_messages = __commonJS({
  "node_modules/pg-protocol/dist/messages.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.NoticeMessage = exports2.DataRowMessage = exports2.CommandCompleteMessage = exports2.ReadyForQueryMessage = exports2.NotificationResponseMessage = exports2.BackendKeyDataMessage = exports2.AuthenticationMD5Password = exports2.ParameterStatusMessage = exports2.ParameterDescriptionMessage = exports2.RowDescriptionMessage = exports2.Field = exports2.CopyResponse = exports2.CopyDataMessage = exports2.DatabaseError = exports2.copyDone = exports2.emptyQuery = exports2.replicationStart = exports2.portalSuspended = exports2.noData = exports2.closeComplete = exports2.bindComplete = exports2.parseComplete = void 0;
    exports2.parseComplete = {
      name: "parseComplete",
      length: 5
    };
    exports2.bindComplete = {
      name: "bindComplete",
      length: 5
    };
    exports2.closeComplete = {
      name: "closeComplete",
      length: 5
    };
    exports2.noData = {
      name: "noData",
      length: 5
    };
    exports2.portalSuspended = {
      name: "portalSuspended",
      length: 5
    };
    exports2.replicationStart = {
      name: "replicationStart",
      length: 4
    };
    exports2.emptyQuery = {
      name: "emptyQuery",
      length: 4
    };
    exports2.copyDone = {
      name: "copyDone",
      length: 4
    };
    var DatabaseError = class extends Error {
      constructor(message, length, name) {
        super(message);
        this.length = length;
        this.name = name;
      }
    };
    exports2.DatabaseError = DatabaseError;
    var CopyDataMessage = class {
      constructor(length, chunk) {
        this.length = length;
        this.chunk = chunk;
        this.name = "copyData";
      }
    };
    exports2.CopyDataMessage = CopyDataMessage;
    var CopyResponse = class {
      constructor(length, name, binary, columnCount) {
        this.length = length;
        this.name = name;
        this.binary = binary;
        this.columnTypes = new Array(columnCount);
      }
    };
    exports2.CopyResponse = CopyResponse;
    var Field = class {
      constructor(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, format) {
        this.name = name;
        this.tableID = tableID;
        this.columnID = columnID;
        this.dataTypeID = dataTypeID;
        this.dataTypeSize = dataTypeSize;
        this.dataTypeModifier = dataTypeModifier;
        this.format = format;
      }
    };
    exports2.Field = Field;
    var RowDescriptionMessage = class {
      constructor(length, fieldCount) {
        this.length = length;
        this.fieldCount = fieldCount;
        this.name = "rowDescription";
        this.fields = new Array(this.fieldCount);
      }
    };
    exports2.RowDescriptionMessage = RowDescriptionMessage;
    var ParameterDescriptionMessage = class {
      constructor(length, parameterCount) {
        this.length = length;
        this.parameterCount = parameterCount;
        this.name = "parameterDescription";
        this.dataTypeIDs = new Array(this.parameterCount);
      }
    };
    exports2.ParameterDescriptionMessage = ParameterDescriptionMessage;
    var ParameterStatusMessage = class {
      constructor(length, parameterName, parameterValue) {
        this.length = length;
        this.parameterName = parameterName;
        this.parameterValue = parameterValue;
        this.name = "parameterStatus";
      }
    };
    exports2.ParameterStatusMessage = ParameterStatusMessage;
    var AuthenticationMD5Password = class {
      constructor(length, salt) {
        this.length = length;
        this.salt = salt;
        this.name = "authenticationMD5Password";
      }
    };
    exports2.AuthenticationMD5Password = AuthenticationMD5Password;
    var BackendKeyDataMessage = class {
      constructor(length, processID, secretKey) {
        this.length = length;
        this.processID = processID;
        this.secretKey = secretKey;
        this.name = "backendKeyData";
      }
    };
    exports2.BackendKeyDataMessage = BackendKeyDataMessage;
    var NotificationResponseMessage = class {
      constructor(length, processId, channel, payload) {
        this.length = length;
        this.processId = processId;
        this.channel = channel;
        this.payload = payload;
        this.name = "notification";
      }
    };
    exports2.NotificationResponseMessage = NotificationResponseMessage;
    var ReadyForQueryMessage = class {
      constructor(length, status) {
        this.length = length;
        this.status = status;
        this.name = "readyForQuery";
      }
    };
    exports2.ReadyForQueryMessage = ReadyForQueryMessage;
    var CommandCompleteMessage = class {
      constructor(length, text) {
        this.length = length;
        this.text = text;
        this.name = "commandComplete";
      }
    };
    exports2.CommandCompleteMessage = CommandCompleteMessage;
    var DataRowMessage = class {
      constructor(length, fields) {
        this.length = length;
        this.fields = fields;
        this.name = "dataRow";
        this.fieldCount = fields.length;
      }
    };
    exports2.DataRowMessage = DataRowMessage;
    var NoticeMessage = class {
      constructor(length, message) {
        this.length = length;
        this.message = message;
        this.name = "notice";
      }
    };
    exports2.NoticeMessage = NoticeMessage;
  }
});

// node_modules/pg-protocol/dist/buffer-writer.js
var require_buffer_writer = __commonJS({
  "node_modules/pg-protocol/dist/buffer-writer.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Writer = void 0;
    var Writer = class {
      constructor(size = 256) {
        this.size = size;
        this.offset = 5;
        this.headerPosition = 0;
        this.buffer = Buffer.allocUnsafe(size);
      }
      ensure(size) {
        var remaining = this.buffer.length - this.offset;
        if (remaining < size) {
          var oldBuffer = this.buffer;
          var newSize = oldBuffer.length + (oldBuffer.length >> 1) + size;
          this.buffer = Buffer.allocUnsafe(newSize);
          oldBuffer.copy(this.buffer);
        }
      }
      addInt32(num) {
        this.ensure(4);
        this.buffer[this.offset++] = num >>> 24 & 255;
        this.buffer[this.offset++] = num >>> 16 & 255;
        this.buffer[this.offset++] = num >>> 8 & 255;
        this.buffer[this.offset++] = num >>> 0 & 255;
        return this;
      }
      addInt16(num) {
        this.ensure(2);
        this.buffer[this.offset++] = num >>> 8 & 255;
        this.buffer[this.offset++] = num >>> 0 & 255;
        return this;
      }
      addCString(string) {
        if (!string) {
          this.ensure(1);
        } else {
          var len = Buffer.byteLength(string);
          this.ensure(len + 1);
          this.buffer.write(string, this.offset, "utf-8");
          this.offset += len;
        }
        this.buffer[this.offset++] = 0;
        return this;
      }
      addString(string = "") {
        var len = Buffer.byteLength(string);
        this.ensure(len);
        this.buffer.write(string, this.offset);
        this.offset += len;
        return this;
      }
      add(otherBuffer) {
        this.ensure(otherBuffer.length);
        otherBuffer.copy(this.buffer, this.offset);
        this.offset += otherBuffer.length;
        return this;
      }
      join(code) {
        if (code) {
          this.buffer[this.headerPosition] = code;
          const length = this.offset - (this.headerPosition + 1);
          this.buffer.writeInt32BE(length, this.headerPosition + 1);
        }
        return this.buffer.slice(code ? 0 : 5, this.offset);
      }
      flush(code) {
        var result = this.join(code);
        this.offset = 5;
        this.headerPosition = 0;
        this.buffer = Buffer.allocUnsafe(this.size);
        return result;
      }
    };
    exports2.Writer = Writer;
  }
});

// node_modules/pg-protocol/dist/serializer.js
var require_serializer = __commonJS({
  "node_modules/pg-protocol/dist/serializer.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.serialize = void 0;
    var buffer_writer_1 = require_buffer_writer();
    var writer = new buffer_writer_1.Writer();
    var startup = (opts) => {
      writer.addInt16(3).addInt16(0);
      for (const key of Object.keys(opts)) {
        writer.addCString(key).addCString(opts[key]);
      }
      writer.addCString("client_encoding").addCString("UTF8");
      var bodyBuffer = writer.addCString("").flush();
      var length = bodyBuffer.length + 4;
      return new buffer_writer_1.Writer().addInt32(length).add(bodyBuffer).flush();
    };
    var requestSsl = () => {
      const response = Buffer.allocUnsafe(8);
      response.writeInt32BE(8, 0);
      response.writeInt32BE(80877103, 4);
      return response;
    };
    var password = (password2) => {
      return writer.addCString(password2).flush(
        112
        /* code.startup */
      );
    };
    var sendSASLInitialResponseMessage = function(mechanism, initialResponse) {
      writer.addCString(mechanism).addInt32(Buffer.byteLength(initialResponse)).addString(initialResponse);
      return writer.flush(
        112
        /* code.startup */
      );
    };
    var sendSCRAMClientFinalMessage = function(additionalData) {
      return writer.addString(additionalData).flush(
        112
        /* code.startup */
      );
    };
    var query2 = (text) => {
      return writer.addCString(text).flush(
        81
        /* code.query */
      );
    };
    var emptyArray = [];
    var parse2 = (query3) => {
      const name = query3.name || "";
      if (name.length > 63) {
        console.error("Warning! Postgres only supports 63 characters for query names.");
        console.error("You supplied %s (%s)", name, name.length);
        console.error("This can cause conflicts and silent errors executing queries");
      }
      const types = query3.types || emptyArray;
      var len = types.length;
      var buffer = writer.addCString(name).addCString(query3.text).addInt16(len);
      for (var i = 0; i < len; i++) {
        buffer.addInt32(types[i]);
      }
      return writer.flush(
        80
        /* code.parse */
      );
    };
    var paramWriter = new buffer_writer_1.Writer();
    var writeValues = function(values, valueMapper) {
      for (let i = 0; i < values.length; i++) {
        const mappedVal = valueMapper ? valueMapper(values[i], i) : values[i];
        if (mappedVal == null) {
          writer.addInt16(
            0
            /* ParamType.STRING */
          );
          paramWriter.addInt32(-1);
        } else if (mappedVal instanceof Buffer) {
          writer.addInt16(
            1
            /* ParamType.BINARY */
          );
          paramWriter.addInt32(mappedVal.length);
          paramWriter.add(mappedVal);
        } else {
          writer.addInt16(
            0
            /* ParamType.STRING */
          );
          paramWriter.addInt32(Buffer.byteLength(mappedVal));
          paramWriter.addString(mappedVal);
        }
      }
    };
    var bind = (config = {}) => {
      const portal = config.portal || "";
      const statement = config.statement || "";
      const binary = config.binary || false;
      const values = config.values || emptyArray;
      const len = values.length;
      writer.addCString(portal).addCString(statement);
      writer.addInt16(len);
      writeValues(values, config.valueMapper);
      writer.addInt16(len);
      writer.add(paramWriter.flush());
      writer.addInt16(
        binary ? 1 : 0
        /* ParamType.STRING */
      );
      return writer.flush(
        66
        /* code.bind */
      );
    };
    var emptyExecute = Buffer.from([69, 0, 0, 0, 9, 0, 0, 0, 0, 0]);
    var execute = (config) => {
      if (!config || !config.portal && !config.rows) {
        return emptyExecute;
      }
      const portal = config.portal || "";
      const rows = config.rows || 0;
      const portalLength = Buffer.byteLength(portal);
      const len = 4 + portalLength + 1 + 4;
      const buff = Buffer.allocUnsafe(1 + len);
      buff[0] = 69;
      buff.writeInt32BE(len, 1);
      buff.write(portal, 5, "utf-8");
      buff[portalLength + 5] = 0;
      buff.writeUInt32BE(rows, buff.length - 4);
      return buff;
    };
    var cancel = (processID, secretKey) => {
      const buffer = Buffer.allocUnsafe(16);
      buffer.writeInt32BE(16, 0);
      buffer.writeInt16BE(1234, 4);
      buffer.writeInt16BE(5678, 6);
      buffer.writeInt32BE(processID, 8);
      buffer.writeInt32BE(secretKey, 12);
      return buffer;
    };
    var cstringMessage = (code, string) => {
      const stringLen = Buffer.byteLength(string);
      const len = 4 + stringLen + 1;
      const buffer = Buffer.allocUnsafe(1 + len);
      buffer[0] = code;
      buffer.writeInt32BE(len, 1);
      buffer.write(string, 5, "utf-8");
      buffer[len] = 0;
      return buffer;
    };
    var emptyDescribePortal = writer.addCString("P").flush(
      68
      /* code.describe */
    );
    var emptyDescribeStatement = writer.addCString("S").flush(
      68
      /* code.describe */
    );
    var describe = (msg) => {
      return msg.name ? cstringMessage(68, `${msg.type}${msg.name || ""}`) : msg.type === "P" ? emptyDescribePortal : emptyDescribeStatement;
    };
    var close = (msg) => {
      const text = `${msg.type}${msg.name || ""}`;
      return cstringMessage(67, text);
    };
    var copyData = (chunk) => {
      return writer.add(chunk).flush(
        100
        /* code.copyFromChunk */
      );
    };
    var copyFail = (message) => {
      return cstringMessage(102, message);
    };
    var codeOnlyBuffer = (code) => Buffer.from([code, 0, 0, 0, 4]);
    var flushBuffer = codeOnlyBuffer(
      72
      /* code.flush */
    );
    var syncBuffer = codeOnlyBuffer(
      83
      /* code.sync */
    );
    var endBuffer = codeOnlyBuffer(
      88
      /* code.end */
    );
    var copyDoneBuffer = codeOnlyBuffer(
      99
      /* code.copyDone */
    );
    var serialize = {
      startup,
      password,
      requestSsl,
      sendSASLInitialResponseMessage,
      sendSCRAMClientFinalMessage,
      query: query2,
      parse: parse2,
      bind,
      execute,
      describe,
      close,
      flush: () => flushBuffer,
      sync: () => syncBuffer,
      end: () => endBuffer,
      copyData,
      copyDone: () => copyDoneBuffer,
      copyFail,
      cancel
    };
    exports2.serialize = serialize;
  }
});

// node_modules/pg-protocol/dist/buffer-reader.js
var require_buffer_reader = __commonJS({
  "node_modules/pg-protocol/dist/buffer-reader.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.BufferReader = void 0;
    var emptyBuffer = Buffer.allocUnsafe(0);
    var BufferReader = class {
      constructor(offset = 0) {
        this.offset = offset;
        this.buffer = emptyBuffer;
        this.encoding = "utf-8";
      }
      setBuffer(offset, buffer) {
        this.offset = offset;
        this.buffer = buffer;
      }
      int16() {
        const result = this.buffer.readInt16BE(this.offset);
        this.offset += 2;
        return result;
      }
      byte() {
        const result = this.buffer[this.offset];
        this.offset++;
        return result;
      }
      int32() {
        const result = this.buffer.readInt32BE(this.offset);
        this.offset += 4;
        return result;
      }
      string(length) {
        const result = this.buffer.toString(this.encoding, this.offset, this.offset + length);
        this.offset += length;
        return result;
      }
      cstring() {
        const start = this.offset;
        let end = start;
        while (this.buffer[end++] !== 0) {
        }
        this.offset = end;
        return this.buffer.toString(this.encoding, start, end - 1);
      }
      bytes(length) {
        const result = this.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        return result;
      }
    };
    exports2.BufferReader = BufferReader;
  }
});

// node_modules/pg-protocol/dist/parser.js
var require_parser = __commonJS({
  "node_modules/pg-protocol/dist/parser.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Parser = void 0;
    var messages_1 = require_messages();
    var buffer_reader_1 = require_buffer_reader();
    var CODE_LENGTH = 1;
    var LEN_LENGTH = 4;
    var HEADER_LENGTH = CODE_LENGTH + LEN_LENGTH;
    var emptyBuffer = Buffer.allocUnsafe(0);
    var Parser = class {
      constructor(opts) {
        this.buffer = emptyBuffer;
        this.bufferLength = 0;
        this.bufferOffset = 0;
        this.reader = new buffer_reader_1.BufferReader();
        if ((opts === null || opts === void 0 ? void 0 : opts.mode) === "binary") {
          throw new Error("Binary mode not supported yet");
        }
        this.mode = (opts === null || opts === void 0 ? void 0 : opts.mode) || "text";
      }
      parse(buffer, callback) {
        this.mergeBuffer(buffer);
        const bufferFullLength = this.bufferOffset + this.bufferLength;
        let offset = this.bufferOffset;
        while (offset + HEADER_LENGTH <= bufferFullLength) {
          const code = this.buffer[offset];
          const length = this.buffer.readUInt32BE(offset + CODE_LENGTH);
          const fullMessageLength = CODE_LENGTH + length;
          if (fullMessageLength + offset <= bufferFullLength) {
            const message = this.handlePacket(offset + HEADER_LENGTH, code, length, this.buffer);
            callback(message);
            offset += fullMessageLength;
          } else {
            break;
          }
        }
        if (offset === bufferFullLength) {
          this.buffer = emptyBuffer;
          this.bufferLength = 0;
          this.bufferOffset = 0;
        } else {
          this.bufferLength = bufferFullLength - offset;
          this.bufferOffset = offset;
        }
      }
      mergeBuffer(buffer) {
        if (this.bufferLength > 0) {
          const newLength = this.bufferLength + buffer.byteLength;
          const newFullLength = newLength + this.bufferOffset;
          if (newFullLength > this.buffer.byteLength) {
            let newBuffer;
            if (newLength <= this.buffer.byteLength && this.bufferOffset >= this.bufferLength) {
              newBuffer = this.buffer;
            } else {
              let newBufferLength = this.buffer.byteLength * 2;
              while (newLength >= newBufferLength) {
                newBufferLength *= 2;
              }
              newBuffer = Buffer.allocUnsafe(newBufferLength);
            }
            this.buffer.copy(newBuffer, 0, this.bufferOffset, this.bufferOffset + this.bufferLength);
            this.buffer = newBuffer;
            this.bufferOffset = 0;
          }
          buffer.copy(this.buffer, this.bufferOffset + this.bufferLength);
          this.bufferLength = newLength;
        } else {
          this.buffer = buffer;
          this.bufferOffset = 0;
          this.bufferLength = buffer.byteLength;
        }
      }
      handlePacket(offset, code, length, bytes) {
        switch (code) {
          case 50:
            return messages_1.bindComplete;
          case 49:
            return messages_1.parseComplete;
          case 51:
            return messages_1.closeComplete;
          case 110:
            return messages_1.noData;
          case 115:
            return messages_1.portalSuspended;
          case 99:
            return messages_1.copyDone;
          case 87:
            return messages_1.replicationStart;
          case 73:
            return messages_1.emptyQuery;
          case 68:
            return this.parseDataRowMessage(offset, length, bytes);
          case 67:
            return this.parseCommandCompleteMessage(offset, length, bytes);
          case 90:
            return this.parseReadyForQueryMessage(offset, length, bytes);
          case 65:
            return this.parseNotificationMessage(offset, length, bytes);
          case 82:
            return this.parseAuthenticationResponse(offset, length, bytes);
          case 83:
            return this.parseParameterStatusMessage(offset, length, bytes);
          case 75:
            return this.parseBackendKeyData(offset, length, bytes);
          case 69:
            return this.parseErrorMessage(offset, length, bytes, "error");
          case 78:
            return this.parseErrorMessage(offset, length, bytes, "notice");
          case 84:
            return this.parseRowDescriptionMessage(offset, length, bytes);
          case 116:
            return this.parseParameterDescriptionMessage(offset, length, bytes);
          case 71:
            return this.parseCopyInMessage(offset, length, bytes);
          case 72:
            return this.parseCopyOutMessage(offset, length, bytes);
          case 100:
            return this.parseCopyData(offset, length, bytes);
          default:
            return new messages_1.DatabaseError("received invalid response: " + code.toString(16), length, "error");
        }
      }
      parseReadyForQueryMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const status = this.reader.string(1);
        return new messages_1.ReadyForQueryMessage(length, status);
      }
      parseCommandCompleteMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const text = this.reader.cstring();
        return new messages_1.CommandCompleteMessage(length, text);
      }
      parseCopyData(offset, length, bytes) {
        const chunk = bytes.slice(offset, offset + (length - 4));
        return new messages_1.CopyDataMessage(length, chunk);
      }
      parseCopyInMessage(offset, length, bytes) {
        return this.parseCopyMessage(offset, length, bytes, "copyInResponse");
      }
      parseCopyOutMessage(offset, length, bytes) {
        return this.parseCopyMessage(offset, length, bytes, "copyOutResponse");
      }
      parseCopyMessage(offset, length, bytes, messageName) {
        this.reader.setBuffer(offset, bytes);
        const isBinary = this.reader.byte() !== 0;
        const columnCount = this.reader.int16();
        const message = new messages_1.CopyResponse(length, messageName, isBinary, columnCount);
        for (let i = 0; i < columnCount; i++) {
          message.columnTypes[i] = this.reader.int16();
        }
        return message;
      }
      parseNotificationMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const processId = this.reader.int32();
        const channel = this.reader.cstring();
        const payload = this.reader.cstring();
        return new messages_1.NotificationResponseMessage(length, processId, channel, payload);
      }
      parseRowDescriptionMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const fieldCount = this.reader.int16();
        const message = new messages_1.RowDescriptionMessage(length, fieldCount);
        for (let i = 0; i < fieldCount; i++) {
          message.fields[i] = this.parseField();
        }
        return message;
      }
      parseField() {
        const name = this.reader.cstring();
        const tableID = this.reader.int32();
        const columnID = this.reader.int16();
        const dataTypeID = this.reader.int32();
        const dataTypeSize = this.reader.int16();
        const dataTypeModifier = this.reader.int32();
        const mode = this.reader.int16() === 0 ? "text" : "binary";
        return new messages_1.Field(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, mode);
      }
      parseParameterDescriptionMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const parameterCount = this.reader.int16();
        const message = new messages_1.ParameterDescriptionMessage(length, parameterCount);
        for (let i = 0; i < parameterCount; i++) {
          message.dataTypeIDs[i] = this.reader.int32();
        }
        return message;
      }
      parseDataRowMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const fieldCount = this.reader.int16();
        const fields = new Array(fieldCount);
        for (let i = 0; i < fieldCount; i++) {
          const len = this.reader.int32();
          fields[i] = len === -1 ? null : this.reader.string(len);
        }
        return new messages_1.DataRowMessage(length, fields);
      }
      parseParameterStatusMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const name = this.reader.cstring();
        const value = this.reader.cstring();
        return new messages_1.ParameterStatusMessage(length, name, value);
      }
      parseBackendKeyData(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const processID = this.reader.int32();
        const secretKey = this.reader.int32();
        return new messages_1.BackendKeyDataMessage(length, processID, secretKey);
      }
      parseAuthenticationResponse(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const code = this.reader.int32();
        const message = {
          name: "authenticationOk",
          length
        };
        switch (code) {
          case 0:
            break;
          case 3:
            if (message.length === 8) {
              message.name = "authenticationCleartextPassword";
            }
            break;
          case 5:
            if (message.length === 12) {
              message.name = "authenticationMD5Password";
              const salt = this.reader.bytes(4);
              return new messages_1.AuthenticationMD5Password(length, salt);
            }
            break;
          case 10:
            message.name = "authenticationSASL";
            message.mechanisms = [];
            let mechanism;
            do {
              mechanism = this.reader.cstring();
              if (mechanism) {
                message.mechanisms.push(mechanism);
              }
            } while (mechanism);
            break;
          case 11:
            message.name = "authenticationSASLContinue";
            message.data = this.reader.string(length - 8);
            break;
          case 12:
            message.name = "authenticationSASLFinal";
            message.data = this.reader.string(length - 8);
            break;
          default:
            throw new Error("Unknown authenticationOk message type " + code);
        }
        return message;
      }
      parseErrorMessage(offset, length, bytes, name) {
        this.reader.setBuffer(offset, bytes);
        const fields = {};
        let fieldType = this.reader.string(1);
        while (fieldType !== "\0") {
          fields[fieldType] = this.reader.cstring();
          fieldType = this.reader.string(1);
        }
        const messageValue = fields.M;
        const message = name === "notice" ? new messages_1.NoticeMessage(length, messageValue) : new messages_1.DatabaseError(messageValue, length, name);
        message.severity = fields.S;
        message.code = fields.C;
        message.detail = fields.D;
        message.hint = fields.H;
        message.position = fields.P;
        message.internalPosition = fields.p;
        message.internalQuery = fields.q;
        message.where = fields.W;
        message.schema = fields.s;
        message.table = fields.t;
        message.column = fields.c;
        message.dataType = fields.d;
        message.constraint = fields.n;
        message.file = fields.F;
        message.line = fields.L;
        message.routine = fields.R;
        return message;
      }
    };
    exports2.Parser = Parser;
  }
});

// node_modules/pg-protocol/dist/index.js
var require_dist = __commonJS({
  "node_modules/pg-protocol/dist/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.DatabaseError = exports2.serialize = exports2.parse = void 0;
    var messages_1 = require_messages();
    Object.defineProperty(exports2, "DatabaseError", { enumerable: true, get: function() {
      return messages_1.DatabaseError;
    } });
    var serializer_1 = require_serializer();
    Object.defineProperty(exports2, "serialize", { enumerable: true, get: function() {
      return serializer_1.serialize;
    } });
    var parser_1 = require_parser();
    function parse2(stream, callback) {
      const parser = new parser_1.Parser();
      stream.on("data", (buffer) => parser.parse(buffer, callback));
      return new Promise((resolve) => stream.on("end", () => resolve()));
    }
    exports2.parse = parse2;
  }
});

// node_modules/pg-cloudflare/dist/empty.js
var empty_exports = {};
__export(empty_exports, {
  default: () => empty_default
});
var empty_default;
var init_empty = __esm({
  "node_modules/pg-cloudflare/dist/empty.js"() {
    empty_default = {};
  }
});

// node_modules/pg/lib/stream.js
var require_stream = __commonJS({
  "node_modules/pg/lib/stream.js"(exports2, module2) {
    module2.exports.getStream = function getStream(ssl) {
      const net = require("net");
      if (typeof net.Socket === "function") {
        return new net.Socket();
      } else {
        const { CloudflareSocket } = (init_empty(), __toCommonJS(empty_exports));
        return new CloudflareSocket(ssl);
      }
    };
    module2.exports.getSecureStream = function getSecureStream(options) {
      var tls = require("tls");
      if (tls.connect) {
        return tls.connect(options);
      } else {
        options.socket.startTls(options);
        return options.socket;
      }
    };
  }
});

// node_modules/pg/lib/connection.js
var require_connection = __commonJS({
  "node_modules/pg/lib/connection.js"(exports2, module2) {
    "use strict";
    var net = require("net");
    var EventEmitter = require("events").EventEmitter;
    var { parse: parse2, serialize } = require_dist();
    var { getStream, getSecureStream } = require_stream();
    var flushBuffer = serialize.flush();
    var syncBuffer = serialize.sync();
    var endBuffer = serialize.end();
    var Connection = class extends EventEmitter {
      constructor(config) {
        super();
        config = config || {};
        this.stream = config.stream || getStream(config.ssl);
        if (typeof this.stream === "function") {
          this.stream = this.stream(config);
        }
        this._keepAlive = config.keepAlive;
        this._keepAliveInitialDelayMillis = config.keepAliveInitialDelayMillis;
        this.lastBuffer = false;
        this.parsedStatements = {};
        this.ssl = config.ssl || false;
        this._ending = false;
        this._emitMessage = false;
        var self = this;
        this.on("newListener", function(eventName) {
          if (eventName === "message") {
            self._emitMessage = true;
          }
        });
      }
      connect(port, host) {
        var self = this;
        this._connecting = true;
        this.stream.setNoDelay(true);
        this.stream.connect(port, host);
        this.stream.once("connect", function() {
          if (self._keepAlive) {
            self.stream.setKeepAlive(true, self._keepAliveInitialDelayMillis);
          }
          self.emit("connect");
        });
        const reportStreamError = function(error) {
          if (self._ending && (error.code === "ECONNRESET" || error.code === "EPIPE")) {
            return;
          }
          self.emit("error", error);
        };
        this.stream.on("error", reportStreamError);
        this.stream.on("close", function() {
          self.emit("end");
        });
        if (!this.ssl) {
          return this.attachListeners(this.stream);
        }
        this.stream.once("data", function(buffer) {
          var responseCode = buffer.toString("utf8");
          switch (responseCode) {
            case "S":
              break;
            case "N":
              self.stream.end();
              return self.emit("error", new Error("The server does not support SSL connections"));
            default:
              self.stream.end();
              return self.emit("error", new Error("There was an error establishing an SSL connection"));
          }
          const options = {
            socket: self.stream
          };
          if (self.ssl !== true) {
            Object.assign(options, self.ssl);
            if ("key" in self.ssl) {
              options.key = self.ssl.key;
            }
          }
          var net2 = require("net");
          if (net2.isIP && net2.isIP(host) === 0) {
            options.servername = host;
          }
          try {
            self.stream = getSecureStream(options);
          } catch (err) {
            return self.emit("error", err);
          }
          self.attachListeners(self.stream);
          self.stream.on("error", reportStreamError);
          self.emit("sslconnect");
        });
      }
      attachListeners(stream) {
        parse2(stream, (msg) => {
          var eventName = msg.name === "error" ? "errorMessage" : msg.name;
          if (this._emitMessage) {
            this.emit("message", msg);
          }
          this.emit(eventName, msg);
        });
      }
      requestSsl() {
        this.stream.write(serialize.requestSsl());
      }
      startup(config) {
        this.stream.write(serialize.startup(config));
      }
      cancel(processID, secretKey) {
        this._send(serialize.cancel(processID, secretKey));
      }
      password(password) {
        this._send(serialize.password(password));
      }
      sendSASLInitialResponseMessage(mechanism, initialResponse) {
        this._send(serialize.sendSASLInitialResponseMessage(mechanism, initialResponse));
      }
      sendSCRAMClientFinalMessage(additionalData) {
        this._send(serialize.sendSCRAMClientFinalMessage(additionalData));
      }
      _send(buffer) {
        if (!this.stream.writable) {
          return false;
        }
        return this.stream.write(buffer);
      }
      query(text) {
        this._send(serialize.query(text));
      }
      // send parse message
      parse(query2) {
        this._send(serialize.parse(query2));
      }
      // send bind message
      bind(config) {
        this._send(serialize.bind(config));
      }
      // send execute message
      execute(config) {
        this._send(serialize.execute(config));
      }
      flush() {
        if (this.stream.writable) {
          this.stream.write(flushBuffer);
        }
      }
      sync() {
        this._ending = true;
        this._send(syncBuffer);
      }
      ref() {
        this.stream.ref();
      }
      unref() {
        this.stream.unref();
      }
      end() {
        this._ending = true;
        if (!this._connecting || !this.stream.writable) {
          this.stream.end();
          return;
        }
        return this.stream.write(endBuffer, () => {
          this.stream.end();
        });
      }
      close(msg) {
        this._send(serialize.close(msg));
      }
      describe(msg) {
        this._send(serialize.describe(msg));
      }
      sendCopyFromChunk(chunk) {
        this._send(serialize.copyData(chunk));
      }
      endCopyFrom() {
        this._send(serialize.copyDone());
      }
      sendCopyFail(msg) {
        this._send(serialize.copyFail(msg));
      }
    };
    module2.exports = Connection;
  }
});

// node_modules/split2/index.js
var require_split2 = __commonJS({
  "node_modules/split2/index.js"(exports2, module2) {
    "use strict";
    var { Transform } = require("stream");
    var { StringDecoder } = require("string_decoder");
    var kLast = Symbol("last");
    var kDecoder = Symbol("decoder");
    function transform(chunk, enc, cb) {
      let list;
      if (this.overflow) {
        const buf = this[kDecoder].write(chunk);
        list = buf.split(this.matcher);
        if (list.length === 1)
          return cb();
        list.shift();
        this.overflow = false;
      } else {
        this[kLast] += this[kDecoder].write(chunk);
        list = this[kLast].split(this.matcher);
      }
      this[kLast] = list.pop();
      for (let i = 0; i < list.length; i++) {
        try {
          push(this, this.mapper(list[i]));
        } catch (error) {
          return cb(error);
        }
      }
      this.overflow = this[kLast].length > this.maxLength;
      if (this.overflow && !this.skipOverflow) {
        cb(new Error("maximum buffer reached"));
        return;
      }
      cb();
    }
    function flush(cb) {
      this[kLast] += this[kDecoder].end();
      if (this[kLast]) {
        try {
          push(this, this.mapper(this[kLast]));
        } catch (error) {
          return cb(error);
        }
      }
      cb();
    }
    function push(self, val2) {
      if (val2 !== void 0) {
        self.push(val2);
      }
    }
    function noop(incoming) {
      return incoming;
    }
    function split(matcher, mapper, options) {
      matcher = matcher || /\r?\n/;
      mapper = mapper || noop;
      options = options || {};
      switch (arguments.length) {
        case 1:
          if (typeof matcher === "function") {
            mapper = matcher;
            matcher = /\r?\n/;
          } else if (typeof matcher === "object" && !(matcher instanceof RegExp) && !matcher[Symbol.split]) {
            options = matcher;
            matcher = /\r?\n/;
          }
          break;
        case 2:
          if (typeof matcher === "function") {
            options = mapper;
            mapper = matcher;
            matcher = /\r?\n/;
          } else if (typeof mapper === "object") {
            options = mapper;
            mapper = noop;
          }
      }
      options = Object.assign({}, options);
      options.autoDestroy = true;
      options.transform = transform;
      options.flush = flush;
      options.readableObjectMode = true;
      const stream = new Transform(options);
      stream[kLast] = "";
      stream[kDecoder] = new StringDecoder("utf8");
      stream.matcher = matcher;
      stream.mapper = mapper;
      stream.maxLength = options.maxLength;
      stream.skipOverflow = options.skipOverflow || false;
      stream.overflow = false;
      stream._destroy = function(err, cb) {
        this._writableState.errorEmitted = false;
        cb(err);
      };
      return stream;
    }
    module2.exports = split;
  }
});

// node_modules/pgpass/lib/helper.js
var require_helper = __commonJS({
  "node_modules/pgpass/lib/helper.js"(exports2, module2) {
    "use strict";
    var path = require("path");
    var Stream = require("stream").Stream;
    var split = require_split2();
    var util = require("util");
    var defaultPort = 5432;
    var isWin = process.platform === "win32";
    var warnStream = process.stderr;
    var S_IRWXG = 56;
    var S_IRWXO = 7;
    var S_IFMT = 61440;
    var S_IFREG = 32768;
    function isRegFile(mode) {
      return (mode & S_IFMT) == S_IFREG;
    }
    var fieldNames = ["host", "port", "database", "user", "password"];
    var nrOfFields = fieldNames.length;
    var passKey = fieldNames[nrOfFields - 1];
    function warn() {
      var isWritable = warnStream instanceof Stream && true === warnStream.writable;
      if (isWritable) {
        var args = Array.prototype.slice.call(arguments).concat("\n");
        warnStream.write(util.format.apply(util, args));
      }
    }
    Object.defineProperty(module2.exports, "isWin", {
      get: function() {
        return isWin;
      },
      set: function(val2) {
        isWin = val2;
      }
    });
    module2.exports.warnTo = function(stream) {
      var old = warnStream;
      warnStream = stream;
      return old;
    };
    module2.exports.getFileName = function(rawEnv) {
      var env = rawEnv || process.env;
      var file = env.PGPASSFILE || (isWin ? path.join(env.APPDATA || "./", "postgresql", "pgpass.conf") : path.join(env.HOME || "./", ".pgpass"));
      return file;
    };
    module2.exports.usePgPass = function(stats, fname) {
      if (Object.prototype.hasOwnProperty.call(process.env, "PGPASSWORD")) {
        return false;
      }
      if (isWin) {
        return true;
      }
      fname = fname || "<unkn>";
      if (!isRegFile(stats.mode)) {
        warn('WARNING: password file "%s" is not a plain file', fname);
        return false;
      }
      if (stats.mode & (S_IRWXG | S_IRWXO)) {
        warn('WARNING: password file "%s" has group or world access; permissions should be u=rw (0600) or less', fname);
        return false;
      }
      return true;
    };
    var matcher = module2.exports.match = function(connInfo, entry) {
      return fieldNames.slice(0, -1).reduce(function(prev, field, idx) {
        if (idx == 1) {
          if (Number(connInfo[field] || defaultPort) === Number(entry[field])) {
            return prev && true;
          }
        }
        return prev && (entry[field] === "*" || entry[field] === connInfo[field]);
      }, true);
    };
    module2.exports.getPassword = function(connInfo, stream, cb) {
      var pass;
      var lineStream = stream.pipe(split());
      function onLine(line) {
        var entry = parseLine(line);
        if (entry && isValidEntry(entry) && matcher(connInfo, entry)) {
          pass = entry[passKey];
          lineStream.end();
        }
      }
      var onEnd = function() {
        stream.destroy();
        cb(pass);
      };
      var onErr = function(err) {
        stream.destroy();
        warn("WARNING: error on reading file: %s", err);
        cb(void 0);
      };
      stream.on("error", onErr);
      lineStream.on("data", onLine).on("end", onEnd).on("error", onErr);
    };
    var parseLine = module2.exports.parseLine = function(line) {
      if (line.length < 11 || line.match(/^\s+#/)) {
        return null;
      }
      var curChar = "";
      var prevChar = "";
      var fieldIdx = 0;
      var startIdx = 0;
      var endIdx = 0;
      var obj = {};
      var isLastField = false;
      var addToObj = function(idx, i0, i1) {
        var field = line.substring(i0, i1);
        if (!Object.hasOwnProperty.call(process.env, "PGPASS_NO_DEESCAPE")) {
          field = field.replace(/\\([:\\])/g, "$1");
        }
        obj[fieldNames[idx]] = field;
      };
      for (var i = 0; i < line.length - 1; i += 1) {
        curChar = line.charAt(i + 1);
        prevChar = line.charAt(i);
        isLastField = fieldIdx == nrOfFields - 1;
        if (isLastField) {
          addToObj(fieldIdx, startIdx);
          break;
        }
        if (i >= 0 && curChar == ":" && prevChar !== "\\") {
          addToObj(fieldIdx, startIdx, i + 1);
          startIdx = i + 2;
          fieldIdx += 1;
        }
      }
      obj = Object.keys(obj).length === nrOfFields ? obj : null;
      return obj;
    };
    var isValidEntry = module2.exports.isValidEntry = function(entry) {
      var rules = {
        // host
        0: function(x) {
          return x.length > 0;
        },
        // port
        1: function(x) {
          if (x === "*") {
            return true;
          }
          x = Number(x);
          return isFinite(x) && x > 0 && x < 9007199254740992 && Math.floor(x) === x;
        },
        // database
        2: function(x) {
          return x.length > 0;
        },
        // username
        3: function(x) {
          return x.length > 0;
        },
        // password
        4: function(x) {
          return x.length > 0;
        }
      };
      for (var idx = 0; idx < fieldNames.length; idx += 1) {
        var rule = rules[idx];
        var value = entry[fieldNames[idx]] || "";
        var res = rule(value);
        if (!res) {
          return false;
        }
      }
      return true;
    };
  }
});

// node_modules/pgpass/lib/index.js
var require_lib = __commonJS({
  "node_modules/pgpass/lib/index.js"(exports2, module2) {
    "use strict";
    var path = require("path");
    var fs = require("fs");
    var helper = require_helper();
    module2.exports = function(connInfo, cb) {
      var file = helper.getFileName();
      fs.stat(file, function(err, stat) {
        if (err || !helper.usePgPass(stat, file)) {
          return cb(void 0);
        }
        var st = fs.createReadStream(file);
        helper.getPassword(connInfo, st, cb);
      });
    };
    module2.exports.warnTo = helper.warnTo;
  }
});

// node_modules/pg/lib/client.js
var require_client = __commonJS({
  "node_modules/pg/lib/client.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events").EventEmitter;
    var utils = require_utils();
    var sasl = require_sasl();
    var TypeOverrides = require_type_overrides();
    var ConnectionParameters = require_connection_parameters();
    var Query = require_query();
    var defaults = require_defaults();
    var Connection = require_connection();
    var crypto5 = require_utils2();
    var Client2 = class extends EventEmitter {
      constructor(config) {
        super();
        this.connectionParameters = new ConnectionParameters(config);
        this.user = this.connectionParameters.user;
        this.database = this.connectionParameters.database;
        this.port = this.connectionParameters.port;
        this.host = this.connectionParameters.host;
        Object.defineProperty(this, "password", {
          configurable: true,
          enumerable: false,
          writable: true,
          value: this.connectionParameters.password
        });
        this.replication = this.connectionParameters.replication;
        var c = config || {};
        this._Promise = c.Promise || global.Promise;
        this._types = new TypeOverrides(c.types);
        this._ending = false;
        this._ended = false;
        this._connecting = false;
        this._connected = false;
        this._connectionError = false;
        this._queryable = true;
        this.connection = c.connection || new Connection({
          stream: c.stream,
          ssl: this.connectionParameters.ssl,
          keepAlive: c.keepAlive || false,
          keepAliveInitialDelayMillis: c.keepAliveInitialDelayMillis || 0,
          encoding: this.connectionParameters.client_encoding || "utf8"
        });
        this.queryQueue = [];
        this.binary = c.binary || defaults.binary;
        this.processID = null;
        this.secretKey = null;
        this.ssl = this.connectionParameters.ssl || false;
        if (this.ssl && this.ssl.key) {
          Object.defineProperty(this.ssl, "key", {
            enumerable: false
          });
        }
        this._connectionTimeoutMillis = c.connectionTimeoutMillis || 0;
      }
      _errorAllQueries(err) {
        const enqueueError = (query2) => {
          process.nextTick(() => {
            query2.handleError(err, this.connection);
          });
        };
        if (this.activeQuery) {
          enqueueError(this.activeQuery);
          this.activeQuery = null;
        }
        this.queryQueue.forEach(enqueueError);
        this.queryQueue.length = 0;
      }
      _connect(callback) {
        var self = this;
        var con = this.connection;
        this._connectionCallback = callback;
        if (this._connecting || this._connected) {
          const err = new Error("Client has already been connected. You cannot reuse a client.");
          process.nextTick(() => {
            callback(err);
          });
          return;
        }
        this._connecting = true;
        this.connectionTimeoutHandle;
        if (this._connectionTimeoutMillis > 0) {
          this.connectionTimeoutHandle = setTimeout(() => {
            con._ending = true;
            con.stream.destroy(new Error("timeout expired"));
          }, this._connectionTimeoutMillis);
        }
        if (this.host && this.host.indexOf("/") === 0) {
          con.connect(this.host + "/.s.PGSQL." + this.port);
        } else {
          con.connect(this.port, this.host);
        }
        con.on("connect", function() {
          if (self.ssl) {
            con.requestSsl();
          } else {
            con.startup(self.getStartupConf());
          }
        });
        con.on("sslconnect", function() {
          con.startup(self.getStartupConf());
        });
        this._attachListeners(con);
        con.once("end", () => {
          const error = this._ending ? new Error("Connection terminated") : new Error("Connection terminated unexpectedly");
          clearTimeout(this.connectionTimeoutHandle);
          this._errorAllQueries(error);
          this._ended = true;
          if (!this._ending) {
            if (this._connecting && !this._connectionError) {
              if (this._connectionCallback) {
                this._connectionCallback(error);
              } else {
                this._handleErrorEvent(error);
              }
            } else if (!this._connectionError) {
              this._handleErrorEvent(error);
            }
          }
          process.nextTick(() => {
            this.emit("end");
          });
        });
      }
      connect(callback) {
        if (callback) {
          this._connect(callback);
          return;
        }
        return new this._Promise((resolve, reject) => {
          this._connect((error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
      }
      _attachListeners(con) {
        con.on("authenticationCleartextPassword", this._handleAuthCleartextPassword.bind(this));
        con.on("authenticationMD5Password", this._handleAuthMD5Password.bind(this));
        con.on("authenticationSASL", this._handleAuthSASL.bind(this));
        con.on("authenticationSASLContinue", this._handleAuthSASLContinue.bind(this));
        con.on("authenticationSASLFinal", this._handleAuthSASLFinal.bind(this));
        con.on("backendKeyData", this._handleBackendKeyData.bind(this));
        con.on("error", this._handleErrorEvent.bind(this));
        con.on("errorMessage", this._handleErrorMessage.bind(this));
        con.on("readyForQuery", this._handleReadyForQuery.bind(this));
        con.on("notice", this._handleNotice.bind(this));
        con.on("rowDescription", this._handleRowDescription.bind(this));
        con.on("dataRow", this._handleDataRow.bind(this));
        con.on("portalSuspended", this._handlePortalSuspended.bind(this));
        con.on("emptyQuery", this._handleEmptyQuery.bind(this));
        con.on("commandComplete", this._handleCommandComplete.bind(this));
        con.on("parseComplete", this._handleParseComplete.bind(this));
        con.on("copyInResponse", this._handleCopyInResponse.bind(this));
        con.on("copyData", this._handleCopyData.bind(this));
        con.on("notification", this._handleNotification.bind(this));
      }
      // TODO(bmc): deprecate pgpass "built in" integration since this.password can be a function
      // it can be supplied by the user if required - this is a breaking change!
      _checkPgPass(cb) {
        const con = this.connection;
        if (typeof this.password === "function") {
          this._Promise.resolve().then(() => this.password()).then((pass) => {
            if (pass !== void 0) {
              if (typeof pass !== "string") {
                con.emit("error", new TypeError("Password must be a string"));
                return;
              }
              this.connectionParameters.password = this.password = pass;
            } else {
              this.connectionParameters.password = this.password = null;
            }
            cb();
          }).catch((err) => {
            con.emit("error", err);
          });
        } else if (this.password !== null) {
          cb();
        } else {
          try {
            const pgPass = require_lib();
            pgPass(this.connectionParameters, (pass) => {
              if (void 0 !== pass) {
                this.connectionParameters.password = this.password = pass;
              }
              cb();
            });
          } catch (e) {
            this.emit("error", e);
          }
        }
      }
      _handleAuthCleartextPassword(msg) {
        this._checkPgPass(() => {
          this.connection.password(this.password);
        });
      }
      _handleAuthMD5Password(msg) {
        this._checkPgPass(async () => {
          try {
            const hashedPassword = await crypto5.postgresMd5PasswordHash(this.user, this.password, msg.salt);
            this.connection.password(hashedPassword);
          } catch (e) {
            this.emit("error", e);
          }
        });
      }
      _handleAuthSASL(msg) {
        this._checkPgPass(() => {
          try {
            this.saslSession = sasl.startSession(msg.mechanisms);
            this.connection.sendSASLInitialResponseMessage(this.saslSession.mechanism, this.saslSession.response);
          } catch (err) {
            this.connection.emit("error", err);
          }
        });
      }
      async _handleAuthSASLContinue(msg) {
        try {
          await sasl.continueSession(this.saslSession, this.password, msg.data);
          this.connection.sendSCRAMClientFinalMessage(this.saslSession.response);
        } catch (err) {
          this.connection.emit("error", err);
        }
      }
      _handleAuthSASLFinal(msg) {
        try {
          sasl.finalizeSession(this.saslSession, msg.data);
          this.saslSession = null;
        } catch (err) {
          this.connection.emit("error", err);
        }
      }
      _handleBackendKeyData(msg) {
        this.processID = msg.processID;
        this.secretKey = msg.secretKey;
      }
      _handleReadyForQuery(msg) {
        if (this._connecting) {
          this._connecting = false;
          this._connected = true;
          clearTimeout(this.connectionTimeoutHandle);
          if (this._connectionCallback) {
            this._connectionCallback(null, this);
            this._connectionCallback = null;
          }
          this.emit("connect");
        }
        const { activeQuery } = this;
        this.activeQuery = null;
        this.readyForQuery = true;
        if (activeQuery) {
          activeQuery.handleReadyForQuery(this.connection);
        }
        this._pulseQueryQueue();
      }
      // if we receieve an error event or error message
      // during the connection process we handle it here
      _handleErrorWhileConnecting(err) {
        if (this._connectionError) {
          return;
        }
        this._connectionError = true;
        clearTimeout(this.connectionTimeoutHandle);
        if (this._connectionCallback) {
          return this._connectionCallback(err);
        }
        this.emit("error", err);
      }
      // if we're connected and we receive an error event from the connection
      // this means the socket is dead - do a hard abort of all queries and emit
      // the socket error on the client as well
      _handleErrorEvent(err) {
        if (this._connecting) {
          return this._handleErrorWhileConnecting(err);
        }
        this._queryable = false;
        this._errorAllQueries(err);
        this.emit("error", err);
      }
      // handle error messages from the postgres backend
      _handleErrorMessage(msg) {
        if (this._connecting) {
          return this._handleErrorWhileConnecting(msg);
        }
        const activeQuery = this.activeQuery;
        if (!activeQuery) {
          this._handleErrorEvent(msg);
          return;
        }
        this.activeQuery = null;
        activeQuery.handleError(msg, this.connection);
      }
      _handleRowDescription(msg) {
        this.activeQuery.handleRowDescription(msg);
      }
      _handleDataRow(msg) {
        this.activeQuery.handleDataRow(msg);
      }
      _handlePortalSuspended(msg) {
        this.activeQuery.handlePortalSuspended(this.connection);
      }
      _handleEmptyQuery(msg) {
        this.activeQuery.handleEmptyQuery(this.connection);
      }
      _handleCommandComplete(msg) {
        this.activeQuery.handleCommandComplete(msg, this.connection);
      }
      _handleParseComplete(msg) {
        if (this.activeQuery.name) {
          this.connection.parsedStatements[this.activeQuery.name] = this.activeQuery.text;
        }
      }
      _handleCopyInResponse(msg) {
        this.activeQuery.handleCopyInResponse(this.connection);
      }
      _handleCopyData(msg) {
        this.activeQuery.handleCopyData(msg, this.connection);
      }
      _handleNotification(msg) {
        this.emit("notification", msg);
      }
      _handleNotice(msg) {
        this.emit("notice", msg);
      }
      getStartupConf() {
        var params = this.connectionParameters;
        var data = {
          user: params.user,
          database: params.database
        };
        var appName = params.application_name || params.fallback_application_name;
        if (appName) {
          data.application_name = appName;
        }
        if (params.replication) {
          data.replication = "" + params.replication;
        }
        if (params.statement_timeout) {
          data.statement_timeout = String(parseInt(params.statement_timeout, 10));
        }
        if (params.lock_timeout) {
          data.lock_timeout = String(parseInt(params.lock_timeout, 10));
        }
        if (params.idle_in_transaction_session_timeout) {
          data.idle_in_transaction_session_timeout = String(parseInt(params.idle_in_transaction_session_timeout, 10));
        }
        if (params.options) {
          data.options = params.options;
        }
        return data;
      }
      cancel(client, query2) {
        if (client.activeQuery === query2) {
          var con = this.connection;
          if (this.host && this.host.indexOf("/") === 0) {
            con.connect(this.host + "/.s.PGSQL." + this.port);
          } else {
            con.connect(this.port, this.host);
          }
          con.on("connect", function() {
            con.cancel(client.processID, client.secretKey);
          });
        } else if (client.queryQueue.indexOf(query2) !== -1) {
          client.queryQueue.splice(client.queryQueue.indexOf(query2), 1);
        }
      }
      setTypeParser(oid, format, parseFn) {
        return this._types.setTypeParser(oid, format, parseFn);
      }
      getTypeParser(oid, format) {
        return this._types.getTypeParser(oid, format);
      }
      // escapeIdentifier and escapeLiteral moved to utility functions & exported
      // on PG
      // re-exported here for backwards compatibility
      escapeIdentifier(str) {
        return utils.escapeIdentifier(str);
      }
      escapeLiteral(str) {
        return utils.escapeLiteral(str);
      }
      _pulseQueryQueue() {
        if (this.readyForQuery === true) {
          this.activeQuery = this.queryQueue.shift();
          if (this.activeQuery) {
            this.readyForQuery = false;
            this.hasExecuted = true;
            const queryError = this.activeQuery.submit(this.connection);
            if (queryError) {
              process.nextTick(() => {
                this.activeQuery.handleError(queryError, this.connection);
                this.readyForQuery = true;
                this._pulseQueryQueue();
              });
            }
          } else if (this.hasExecuted) {
            this.activeQuery = null;
            this.emit("drain");
          }
        }
      }
      query(config, values, callback) {
        var query2;
        var result;
        var readTimeout;
        var readTimeoutTimer;
        var queryCallback;
        if (config === null || config === void 0) {
          throw new TypeError("Client was passed a null or undefined query");
        } else if (typeof config.submit === "function") {
          readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
          result = query2 = config;
          if (typeof values === "function") {
            query2.callback = query2.callback || values;
          }
        } else {
          readTimeout = this.connectionParameters.query_timeout;
          query2 = new Query(config, values, callback);
          if (!query2.callback) {
            result = new this._Promise((resolve, reject) => {
              query2.callback = (err, res) => err ? reject(err) : resolve(res);
            }).catch((err) => {
              Error.captureStackTrace(err);
              throw err;
            });
          }
        }
        if (readTimeout) {
          queryCallback = query2.callback;
          readTimeoutTimer = setTimeout(() => {
            var error = new Error("Query read timeout");
            process.nextTick(() => {
              query2.handleError(error, this.connection);
            });
            queryCallback(error);
            query2.callback = () => {
            };
            var index = this.queryQueue.indexOf(query2);
            if (index > -1) {
              this.queryQueue.splice(index, 1);
            }
            this._pulseQueryQueue();
          }, readTimeout);
          query2.callback = (err, res) => {
            clearTimeout(readTimeoutTimer);
            queryCallback(err, res);
          };
        }
        if (this.binary && !query2.binary) {
          query2.binary = true;
        }
        if (query2._result && !query2._result._types) {
          query2._result._types = this._types;
        }
        if (!this._queryable) {
          process.nextTick(() => {
            query2.handleError(new Error("Client has encountered a connection error and is not queryable"), this.connection);
          });
          return result;
        }
        if (this._ending) {
          process.nextTick(() => {
            query2.handleError(new Error("Client was closed and is not queryable"), this.connection);
          });
          return result;
        }
        this.queryQueue.push(query2);
        this._pulseQueryQueue();
        return result;
      }
      ref() {
        this.connection.ref();
      }
      unref() {
        this.connection.unref();
      }
      end(cb) {
        this._ending = true;
        if (!this.connection._connecting || this._ended) {
          if (cb) {
            cb();
          } else {
            return this._Promise.resolve();
          }
        }
        if (this.activeQuery || !this._queryable) {
          this.connection.stream.destroy();
        } else {
          this.connection.end();
        }
        if (cb) {
          this.connection.once("end", cb);
        } else {
          return new this._Promise((resolve) => {
            this.connection.once("end", resolve);
          });
        }
      }
    };
    Client2.Query = Query;
    module2.exports = Client2;
  }
});

// node_modules/pg-pool/index.js
var require_pg_pool = __commonJS({
  "node_modules/pg-pool/index.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events").EventEmitter;
    var NOOP = function() {
    };
    var removeWhere = (list, predicate) => {
      const i = list.findIndex(predicate);
      return i === -1 ? void 0 : list.splice(i, 1)[0];
    };
    var IdleItem = class {
      constructor(client, idleListener, timeoutId) {
        this.client = client;
        this.idleListener = idleListener;
        this.timeoutId = timeoutId;
      }
    };
    var PendingItem = class {
      constructor(callback) {
        this.callback = callback;
      }
    };
    function throwOnDoubleRelease() {
      throw new Error("Release called on client which has already been released to the pool.");
    }
    function promisify(Promise2, callback) {
      if (callback) {
        return { callback, result: void 0 };
      }
      let rej;
      let res;
      const cb = function(err, client) {
        err ? rej(err) : res(client);
      };
      const result = new Promise2(function(resolve, reject) {
        res = resolve;
        rej = reject;
      }).catch((err) => {
        Error.captureStackTrace(err);
        throw err;
      });
      return { callback: cb, result };
    }
    function makeIdleListener(pool, client) {
      return function idleListener(err) {
        err.client = client;
        client.removeListener("error", idleListener);
        client.on("error", () => {
          pool.log("additional client error after disconnection due to error", err);
        });
        pool._remove(client);
        pool.emit("error", err, client);
      };
    }
    var Pool = class extends EventEmitter {
      constructor(options, Client2) {
        super();
        this.options = Object.assign({}, options);
        if (options != null && "password" in options) {
          Object.defineProperty(this.options, "password", {
            configurable: true,
            enumerable: false,
            writable: true,
            value: options.password
          });
        }
        if (options != null && options.ssl && options.ssl.key) {
          Object.defineProperty(this.options.ssl, "key", {
            enumerable: false
          });
        }
        this.options.max = this.options.max || this.options.poolSize || 10;
        this.options.maxUses = this.options.maxUses || Infinity;
        this.options.allowExitOnIdle = this.options.allowExitOnIdle || false;
        this.options.maxLifetimeSeconds = this.options.maxLifetimeSeconds || 0;
        this.log = this.options.log || function() {
        };
        this.Client = this.options.Client || Client2 || require_lib2().Client;
        this.Promise = this.options.Promise || global.Promise;
        if (typeof this.options.idleTimeoutMillis === "undefined") {
          this.options.idleTimeoutMillis = 1e4;
        }
        this._clients = [];
        this._idle = [];
        this._expired = /* @__PURE__ */ new WeakSet();
        this._pendingQueue = [];
        this._endCallback = void 0;
        this.ending = false;
        this.ended = false;
      }
      _isFull() {
        return this._clients.length >= this.options.max;
      }
      _pulseQueue() {
        this.log("pulse queue");
        if (this.ended) {
          this.log("pulse queue ended");
          return;
        }
        if (this.ending) {
          this.log("pulse queue on ending");
          if (this._idle.length) {
            this._idle.slice().map((item) => {
              this._remove(item.client);
            });
          }
          if (!this._clients.length) {
            this.ended = true;
            this._endCallback();
          }
          return;
        }
        if (!this._pendingQueue.length) {
          this.log("no queued requests");
          return;
        }
        if (!this._idle.length && this._isFull()) {
          return;
        }
        const pendingItem = this._pendingQueue.shift();
        if (this._idle.length) {
          const idleItem = this._idle.pop();
          clearTimeout(idleItem.timeoutId);
          const client = idleItem.client;
          client.ref && client.ref();
          const idleListener = idleItem.idleListener;
          return this._acquireClient(client, pendingItem, idleListener, false);
        }
        if (!this._isFull()) {
          return this.newClient(pendingItem);
        }
        throw new Error("unexpected condition");
      }
      _remove(client) {
        const removed = removeWhere(this._idle, (item) => item.client === client);
        if (removed !== void 0) {
          clearTimeout(removed.timeoutId);
        }
        this._clients = this._clients.filter((c) => c !== client);
        client.end();
        this.emit("remove", client);
      }
      connect(cb) {
        if (this.ending) {
          const err = new Error("Cannot use a pool after calling end on the pool");
          return cb ? cb(err) : this.Promise.reject(err);
        }
        const response = promisify(this.Promise, cb);
        const result = response.result;
        if (this._isFull() || this._idle.length) {
          if (this._idle.length) {
            process.nextTick(() => this._pulseQueue());
          }
          if (!this.options.connectionTimeoutMillis) {
            this._pendingQueue.push(new PendingItem(response.callback));
            return result;
          }
          const queueCallback = (err, res, done) => {
            clearTimeout(tid);
            response.callback(err, res, done);
          };
          const pendingItem = new PendingItem(queueCallback);
          const tid = setTimeout(() => {
            removeWhere(this._pendingQueue, (i) => i.callback === queueCallback);
            pendingItem.timedOut = true;
            response.callback(new Error("timeout exceeded when trying to connect"));
          }, this.options.connectionTimeoutMillis);
          this._pendingQueue.push(pendingItem);
          return result;
        }
        this.newClient(new PendingItem(response.callback));
        return result;
      }
      newClient(pendingItem) {
        const client = new this.Client(this.options);
        this._clients.push(client);
        const idleListener = makeIdleListener(this, client);
        this.log("checking client timeout");
        let tid;
        let timeoutHit = false;
        if (this.options.connectionTimeoutMillis) {
          tid = setTimeout(() => {
            this.log("ending client due to timeout");
            timeoutHit = true;
            client.connection ? client.connection.stream.destroy() : client.end();
          }, this.options.connectionTimeoutMillis);
        }
        this.log("connecting new client");
        client.connect((err) => {
          if (tid) {
            clearTimeout(tid);
          }
          client.on("error", idleListener);
          if (err) {
            this.log("client failed to connect", err);
            this._clients = this._clients.filter((c) => c !== client);
            if (timeoutHit) {
              err.message = "Connection terminated due to connection timeout";
            }
            this._pulseQueue();
            if (!pendingItem.timedOut) {
              pendingItem.callback(err, void 0, NOOP);
            }
          } else {
            this.log("new client connected");
            if (this.options.maxLifetimeSeconds !== 0) {
              const maxLifetimeTimeout = setTimeout(() => {
                this.log("ending client due to expired lifetime");
                this._expired.add(client);
                const idleIndex = this._idle.findIndex((idleItem) => idleItem.client === client);
                if (idleIndex !== -1) {
                  this._acquireClient(
                    client,
                    new PendingItem((err2, client2, clientRelease) => clientRelease()),
                    idleListener,
                    false
                  );
                }
              }, this.options.maxLifetimeSeconds * 1e3);
              maxLifetimeTimeout.unref();
              client.once("end", () => clearTimeout(maxLifetimeTimeout));
            }
            return this._acquireClient(client, pendingItem, idleListener, true);
          }
        });
      }
      // acquire a client for a pending work item
      _acquireClient(client, pendingItem, idleListener, isNew) {
        if (isNew) {
          this.emit("connect", client);
        }
        this.emit("acquire", client);
        client.release = this._releaseOnce(client, idleListener);
        client.removeListener("error", idleListener);
        if (!pendingItem.timedOut) {
          if (isNew && this.options.verify) {
            this.options.verify(client, (err) => {
              if (err) {
                client.release(err);
                return pendingItem.callback(err, void 0, NOOP);
              }
              pendingItem.callback(void 0, client, client.release);
            });
          } else {
            pendingItem.callback(void 0, client, client.release);
          }
        } else {
          if (isNew && this.options.verify) {
            this.options.verify(client, client.release);
          } else {
            client.release();
          }
        }
      }
      // returns a function that wraps _release and throws if called more than once
      _releaseOnce(client, idleListener) {
        let released = false;
        return (err) => {
          if (released) {
            throwOnDoubleRelease();
          }
          released = true;
          this._release(client, idleListener, err);
        };
      }
      // release a client back to the poll, include an error
      // to remove it from the pool
      _release(client, idleListener, err) {
        client.on("error", idleListener);
        client._poolUseCount = (client._poolUseCount || 0) + 1;
        this.emit("release", err, client);
        if (err || this.ending || !client._queryable || client._ending || client._poolUseCount >= this.options.maxUses) {
          if (client._poolUseCount >= this.options.maxUses) {
            this.log("remove expended client");
          }
          this._remove(client);
          this._pulseQueue();
          return;
        }
        const isExpired = this._expired.has(client);
        if (isExpired) {
          this.log("remove expired client");
          this._expired.delete(client);
          this._remove(client);
          this._pulseQueue();
          return;
        }
        let tid;
        if (this.options.idleTimeoutMillis) {
          tid = setTimeout(() => {
            this.log("remove idle client");
            this._remove(client);
          }, this.options.idleTimeoutMillis);
          if (this.options.allowExitOnIdle) {
            tid.unref();
          }
        }
        if (this.options.allowExitOnIdle) {
          client.unref();
        }
        this._idle.push(new IdleItem(client, idleListener, tid));
        this._pulseQueue();
      }
      query(text, values, cb) {
        if (typeof text === "function") {
          const response2 = promisify(this.Promise, text);
          setImmediate(function() {
            return response2.callback(new Error("Passing a function as the first parameter to pool.query is not supported"));
          });
          return response2.result;
        }
        if (typeof values === "function") {
          cb = values;
          values = void 0;
        }
        const response = promisify(this.Promise, cb);
        cb = response.callback;
        this.connect((err, client) => {
          if (err) {
            return cb(err);
          }
          let clientReleased = false;
          const onError = (err2) => {
            if (clientReleased) {
              return;
            }
            clientReleased = true;
            client.release(err2);
            cb(err2);
          };
          client.once("error", onError);
          this.log("dispatching query");
          try {
            client.query(text, values, (err2, res) => {
              this.log("query dispatched");
              client.removeListener("error", onError);
              if (clientReleased) {
                return;
              }
              clientReleased = true;
              client.release(err2);
              if (err2) {
                return cb(err2);
              }
              return cb(void 0, res);
            });
          } catch (err2) {
            client.release(err2);
            return cb(err2);
          }
        });
        return response.result;
      }
      end(cb) {
        this.log("ending");
        if (this.ending) {
          const err = new Error("Called end on pool more than once");
          return cb ? cb(err) : this.Promise.reject(err);
        }
        this.ending = true;
        const promised = promisify(this.Promise, cb);
        this._endCallback = promised.callback;
        this._pulseQueue();
        return promised.result;
      }
      get waitingCount() {
        return this._pendingQueue.length;
      }
      get idleCount() {
        return this._idle.length;
      }
      get expiredCount() {
        return this._clients.reduce((acc, client) => acc + (this._expired.has(client) ? 1 : 0), 0);
      }
      get totalCount() {
        return this._clients.length;
      }
    };
    module2.exports = Pool;
  }
});

// node_modules/pg/lib/native/query.js
var require_query2 = __commonJS({
  "node_modules/pg/lib/native/query.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events").EventEmitter;
    var util = require("util");
    var utils = require_utils();
    var NativeQuery = module2.exports = function(config, values, callback) {
      EventEmitter.call(this);
      config = utils.normalizeQueryConfig(config, values, callback);
      this.text = config.text;
      this.values = config.values;
      this.name = config.name;
      this.queryMode = config.queryMode;
      this.callback = config.callback;
      this.state = "new";
      this._arrayMode = config.rowMode === "array";
      this._emitRowEvents = false;
      this.on(
        "newListener",
        function(event) {
          if (event === "row")
            this._emitRowEvents = true;
        }.bind(this)
      );
    };
    util.inherits(NativeQuery, EventEmitter);
    var errorFieldMap = {
      /* eslint-disable quote-props */
      sqlState: "code",
      statementPosition: "position",
      messagePrimary: "message",
      context: "where",
      schemaName: "schema",
      tableName: "table",
      columnName: "column",
      dataTypeName: "dataType",
      constraintName: "constraint",
      sourceFile: "file",
      sourceLine: "line",
      sourceFunction: "routine"
    };
    NativeQuery.prototype.handleError = function(err) {
      var fields = this.native.pq.resultErrorFields();
      if (fields) {
        for (var key in fields) {
          var normalizedFieldName = errorFieldMap[key] || key;
          err[normalizedFieldName] = fields[key];
        }
      }
      if (this.callback) {
        this.callback(err);
      } else {
        this.emit("error", err);
      }
      this.state = "error";
    };
    NativeQuery.prototype.then = function(onSuccess, onFailure) {
      return this._getPromise().then(onSuccess, onFailure);
    };
    NativeQuery.prototype.catch = function(callback) {
      return this._getPromise().catch(callback);
    };
    NativeQuery.prototype._getPromise = function() {
      if (this._promise)
        return this._promise;
      this._promise = new Promise(
        function(resolve, reject) {
          this._once("end", resolve);
          this._once("error", reject);
        }.bind(this)
      );
      return this._promise;
    };
    NativeQuery.prototype.submit = function(client) {
      this.state = "running";
      var self = this;
      this.native = client.native;
      client.native.arrayMode = this._arrayMode;
      var after = function(err, rows, results) {
        client.native.arrayMode = false;
        setImmediate(function() {
          self.emit("_done");
        });
        if (err) {
          return self.handleError(err);
        }
        if (self._emitRowEvents) {
          if (results.length > 1) {
            rows.forEach((rowOfRows, i) => {
              rowOfRows.forEach((row) => {
                self.emit("row", row, results[i]);
              });
            });
          } else {
            rows.forEach(function(row) {
              self.emit("row", row, results);
            });
          }
        }
        self.state = "end";
        self.emit("end", results);
        if (self.callback) {
          self.callback(null, results);
        }
      };
      if (process.domain) {
        after = process.domain.bind(after);
      }
      if (this.name) {
        if (this.name.length > 63) {
          console.error("Warning! Postgres only supports 63 characters for query names.");
          console.error("You supplied %s (%s)", this.name, this.name.length);
          console.error("This can cause conflicts and silent errors executing queries");
        }
        var values = (this.values || []).map(utils.prepareValue);
        if (client.namedQueries[this.name]) {
          if (this.text && client.namedQueries[this.name] !== this.text) {
            const err = new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
            return after(err);
          }
          return client.native.execute(this.name, values, after);
        }
        return client.native.prepare(this.name, this.text, values.length, function(err) {
          if (err)
            return after(err);
          client.namedQueries[self.name] = self.text;
          return self.native.execute(self.name, values, after);
        });
      } else if (this.values) {
        if (!Array.isArray(this.values)) {
          const err = new Error("Query values must be an array");
          return after(err);
        }
        var vals = this.values.map(utils.prepareValue);
        client.native.query(this.text, vals, after);
      } else if (this.queryMode === "extended") {
        client.native.query(this.text, [], after);
      } else {
        client.native.query(this.text, after);
      }
    };
  }
});

// node_modules/pg/lib/native/client.js
var require_client2 = __commonJS({
  "node_modules/pg/lib/native/client.js"(exports2, module2) {
    "use strict";
    var Native;
    try {
      Native = require("pg-native");
    } catch (e) {
      throw e;
    }
    var TypeOverrides = require_type_overrides();
    var EventEmitter = require("events").EventEmitter;
    var util = require("util");
    var ConnectionParameters = require_connection_parameters();
    var NativeQuery = require_query2();
    var Client2 = module2.exports = function(config) {
      EventEmitter.call(this);
      config = config || {};
      this._Promise = config.Promise || global.Promise;
      this._types = new TypeOverrides(config.types);
      this.native = new Native({
        types: this._types
      });
      this._queryQueue = [];
      this._ending = false;
      this._connecting = false;
      this._connected = false;
      this._queryable = true;
      var cp = this.connectionParameters = new ConnectionParameters(config);
      if (config.nativeConnectionString)
        cp.nativeConnectionString = config.nativeConnectionString;
      this.user = cp.user;
      Object.defineProperty(this, "password", {
        configurable: true,
        enumerable: false,
        writable: true,
        value: cp.password
      });
      this.database = cp.database;
      this.host = cp.host;
      this.port = cp.port;
      this.namedQueries = {};
    };
    Client2.Query = NativeQuery;
    util.inherits(Client2, EventEmitter);
    Client2.prototype._errorAllQueries = function(err) {
      const enqueueError = (query2) => {
        process.nextTick(() => {
          query2.native = this.native;
          query2.handleError(err);
        });
      };
      if (this._hasActiveQuery()) {
        enqueueError(this._activeQuery);
        this._activeQuery = null;
      }
      this._queryQueue.forEach(enqueueError);
      this._queryQueue.length = 0;
    };
    Client2.prototype._connect = function(cb) {
      var self = this;
      if (this._connecting) {
        process.nextTick(() => cb(new Error("Client has already been connected. You cannot reuse a client.")));
        return;
      }
      this._connecting = true;
      this.connectionParameters.getLibpqConnectionString(function(err, conString) {
        if (self.connectionParameters.nativeConnectionString)
          conString = self.connectionParameters.nativeConnectionString;
        if (err)
          return cb(err);
        self.native.connect(conString, function(err2) {
          if (err2) {
            self.native.end();
            return cb(err2);
          }
          self._connected = true;
          self.native.on("error", function(err3) {
            self._queryable = false;
            self._errorAllQueries(err3);
            self.emit("error", err3);
          });
          self.native.on("notification", function(msg) {
            self.emit("notification", {
              channel: msg.relname,
              payload: msg.extra
            });
          });
          self.emit("connect");
          self._pulseQueryQueue(true);
          cb();
        });
      });
    };
    Client2.prototype.connect = function(callback) {
      if (callback) {
        this._connect(callback);
        return;
      }
      return new this._Promise((resolve, reject) => {
        this._connect((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    };
    Client2.prototype.query = function(config, values, callback) {
      var query2;
      var result;
      var readTimeout;
      var readTimeoutTimer;
      var queryCallback;
      if (config === null || config === void 0) {
        throw new TypeError("Client was passed a null or undefined query");
      } else if (typeof config.submit === "function") {
        readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
        result = query2 = config;
        if (typeof values === "function") {
          config.callback = values;
        }
      } else {
        readTimeout = this.connectionParameters.query_timeout;
        query2 = new NativeQuery(config, values, callback);
        if (!query2.callback) {
          let resolveOut, rejectOut;
          result = new this._Promise((resolve, reject) => {
            resolveOut = resolve;
            rejectOut = reject;
          }).catch((err) => {
            Error.captureStackTrace(err);
            throw err;
          });
          query2.callback = (err, res) => err ? rejectOut(err) : resolveOut(res);
        }
      }
      if (readTimeout) {
        queryCallback = query2.callback;
        readTimeoutTimer = setTimeout(() => {
          var error = new Error("Query read timeout");
          process.nextTick(() => {
            query2.handleError(error, this.connection);
          });
          queryCallback(error);
          query2.callback = () => {
          };
          var index = this._queryQueue.indexOf(query2);
          if (index > -1) {
            this._queryQueue.splice(index, 1);
          }
          this._pulseQueryQueue();
        }, readTimeout);
        query2.callback = (err, res) => {
          clearTimeout(readTimeoutTimer);
          queryCallback(err, res);
        };
      }
      if (!this._queryable) {
        query2.native = this.native;
        process.nextTick(() => {
          query2.handleError(new Error("Client has encountered a connection error and is not queryable"));
        });
        return result;
      }
      if (this._ending) {
        query2.native = this.native;
        process.nextTick(() => {
          query2.handleError(new Error("Client was closed and is not queryable"));
        });
        return result;
      }
      this._queryQueue.push(query2);
      this._pulseQueryQueue();
      return result;
    };
    Client2.prototype.end = function(cb) {
      var self = this;
      this._ending = true;
      if (!this._connected) {
        this.once("connect", this.end.bind(this, cb));
      }
      var result;
      if (!cb) {
        result = new this._Promise(function(resolve, reject) {
          cb = (err) => err ? reject(err) : resolve();
        });
      }
      this.native.end(function() {
        self._errorAllQueries(new Error("Connection terminated"));
        process.nextTick(() => {
          self.emit("end");
          if (cb)
            cb();
        });
      });
      return result;
    };
    Client2.prototype._hasActiveQuery = function() {
      return this._activeQuery && this._activeQuery.state !== "error" && this._activeQuery.state !== "end";
    };
    Client2.prototype._pulseQueryQueue = function(initialConnection) {
      if (!this._connected) {
        return;
      }
      if (this._hasActiveQuery()) {
        return;
      }
      var query2 = this._queryQueue.shift();
      if (!query2) {
        if (!initialConnection) {
          this.emit("drain");
        }
        return;
      }
      this._activeQuery = query2;
      query2.submit(this);
      var self = this;
      query2.once("_done", function() {
        self._pulseQueryQueue();
      });
    };
    Client2.prototype.cancel = function(query2) {
      if (this._activeQuery === query2) {
        this.native.cancel(function() {
        });
      } else if (this._queryQueue.indexOf(query2) !== -1) {
        this._queryQueue.splice(this._queryQueue.indexOf(query2), 1);
      }
    };
    Client2.prototype.ref = function() {
    };
    Client2.prototype.unref = function() {
    };
    Client2.prototype.setTypeParser = function(oid, format, parseFn) {
      return this._types.setTypeParser(oid, format, parseFn);
    };
    Client2.prototype.getTypeParser = function(oid, format) {
      return this._types.getTypeParser(oid, format);
    };
  }
});

// node_modules/pg/lib/native/index.js
var require_native = __commonJS({
  "node_modules/pg/lib/native/index.js"(exports2, module2) {
    "use strict";
    module2.exports = require_client2();
  }
});

// node_modules/pg/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/pg/lib/index.js"(exports2, module2) {
    "use strict";
    var Client2 = require_client();
    var defaults = require_defaults();
    var Connection = require_connection();
    var Pool = require_pg_pool();
    var { DatabaseError } = require_dist();
    var { escapeIdentifier, escapeLiteral } = require_utils();
    var poolFactory = (Client3) => {
      return class BoundPool extends Pool {
        constructor(options) {
          super(options, Client3);
        }
      };
    };
    var PG = function(clientConstructor) {
      this.defaults = defaults;
      this.Client = clientConstructor;
      this.Query = this.Client.Query;
      this.Pool = poolFactory(this.Client);
      this._pools = [];
      this.Connection = Connection;
      this.types = require_pg_types();
      this.DatabaseError = DatabaseError;
      this.escapeIdentifier = escapeIdentifier;
      this.escapeLiteral = escapeLiteral;
    };
    if (typeof process.env.NODE_PG_FORCE_NATIVE !== "undefined") {
      module2.exports = new PG(require_native());
    } else {
      module2.exports = new PG(Client2);
      Object.defineProperty(module2.exports, "native", {
        configurable: true,
        enumerable: false,
        get() {
          var native = null;
          try {
            native = new PG(require_native());
          } catch (err) {
            if (err.code !== "MODULE_NOT_FOUND") {
              throw err;
            }
          }
          Object.defineProperty(module2.exports, "native", {
            value: native
          });
          return native;
        }
      });
    }
  }
});

// node_modules/@smithy/types/dist-cjs/index.js
var require_dist_cjs = __commonJS({
  "node_modules/@smithy/types/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      AlgorithmId: () => AlgorithmId,
      EndpointURLScheme: () => EndpointURLScheme,
      FieldPosition: () => FieldPosition,
      HttpApiKeyAuthLocation: () => HttpApiKeyAuthLocation2,
      HttpAuthLocation: () => HttpAuthLocation,
      IniSectionType: () => IniSectionType,
      RequestHandlerProtocol: () => RequestHandlerProtocol,
      SMITHY_CONTEXT_KEY: () => SMITHY_CONTEXT_KEY4,
      getDefaultClientConfiguration: () => getDefaultClientConfiguration,
      resolveDefaultRuntimeConfig: () => resolveDefaultRuntimeConfig
    });
    module2.exports = __toCommonJS2(src_exports);
    var HttpAuthLocation = /* @__PURE__ */ ((HttpAuthLocation2) => {
      HttpAuthLocation2["HEADER"] = "header";
      HttpAuthLocation2["QUERY"] = "query";
      return HttpAuthLocation2;
    })(HttpAuthLocation || {});
    var HttpApiKeyAuthLocation2 = /* @__PURE__ */ ((HttpApiKeyAuthLocation22) => {
      HttpApiKeyAuthLocation22["HEADER"] = "header";
      HttpApiKeyAuthLocation22["QUERY"] = "query";
      return HttpApiKeyAuthLocation22;
    })(HttpApiKeyAuthLocation2 || {});
    var EndpointURLScheme = /* @__PURE__ */ ((EndpointURLScheme2) => {
      EndpointURLScheme2["HTTP"] = "http";
      EndpointURLScheme2["HTTPS"] = "https";
      return EndpointURLScheme2;
    })(EndpointURLScheme || {});
    var AlgorithmId = /* @__PURE__ */ ((AlgorithmId2) => {
      AlgorithmId2["MD5"] = "md5";
      AlgorithmId2["CRC32"] = "crc32";
      AlgorithmId2["CRC32C"] = "crc32c";
      AlgorithmId2["SHA1"] = "sha1";
      AlgorithmId2["SHA256"] = "sha256";
      return AlgorithmId2;
    })(AlgorithmId || {});
    var getChecksumConfiguration = /* @__PURE__ */ __name((runtimeConfig) => {
      const checksumAlgorithms = [];
      if (runtimeConfig.sha256 !== void 0) {
        checksumAlgorithms.push({
          algorithmId: () => "sha256",
          checksumConstructor: () => runtimeConfig.sha256
        });
      }
      if (runtimeConfig.md5 != void 0) {
        checksumAlgorithms.push({
          algorithmId: () => "md5",
          checksumConstructor: () => runtimeConfig.md5
        });
      }
      return {
        _checksumAlgorithms: checksumAlgorithms,
        addChecksumAlgorithm(algo) {
          this._checksumAlgorithms.push(algo);
        },
        checksumAlgorithms() {
          return this._checksumAlgorithms;
        }
      };
    }, "getChecksumConfiguration");
    var resolveChecksumRuntimeConfig = /* @__PURE__ */ __name((clientConfig) => {
      const runtimeConfig = {};
      clientConfig.checksumAlgorithms().forEach((checksumAlgorithm) => {
        runtimeConfig[checksumAlgorithm.algorithmId()] = checksumAlgorithm.checksumConstructor();
      });
      return runtimeConfig;
    }, "resolveChecksumRuntimeConfig");
    var getDefaultClientConfiguration = /* @__PURE__ */ __name((runtimeConfig) => {
      return {
        ...getChecksumConfiguration(runtimeConfig)
      };
    }, "getDefaultClientConfiguration");
    var resolveDefaultRuntimeConfig = /* @__PURE__ */ __name((config) => {
      return {
        ...resolveChecksumRuntimeConfig(config)
      };
    }, "resolveDefaultRuntimeConfig");
    var FieldPosition = /* @__PURE__ */ ((FieldPosition2) => {
      FieldPosition2[FieldPosition2["HEADER"] = 0] = "HEADER";
      FieldPosition2[FieldPosition2["TRAILER"] = 1] = "TRAILER";
      return FieldPosition2;
    })(FieldPosition || {});
    var SMITHY_CONTEXT_KEY4 = "__smithy_context";
    var IniSectionType = /* @__PURE__ */ ((IniSectionType2) => {
      IniSectionType2["PROFILE"] = "profile";
      IniSectionType2["SSO_SESSION"] = "sso-session";
      IniSectionType2["SERVICES"] = "services";
      return IniSectionType2;
    })(IniSectionType || {});
    var RequestHandlerProtocol = /* @__PURE__ */ ((RequestHandlerProtocol2) => {
      RequestHandlerProtocol2["HTTP_0_9"] = "http/0.9";
      RequestHandlerProtocol2["HTTP_1_0"] = "http/1.0";
      RequestHandlerProtocol2["TDS_8_0"] = "tds/8.0";
      return RequestHandlerProtocol2;
    })(RequestHandlerProtocol || {});
  }
});

// node_modules/@smithy/protocol-http/dist-cjs/index.js
var require_dist_cjs2 = __commonJS({
  "node_modules/@smithy/protocol-http/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      Field: () => Field,
      Fields: () => Fields,
      HttpRequest: () => HttpRequest7,
      HttpResponse: () => HttpResponse2,
      IHttpRequest: () => import_types5.HttpRequest,
      getHttpHandlerExtensionConfiguration: () => getHttpHandlerExtensionConfiguration,
      isValidHostname: () => isValidHostname,
      resolveHttpHandlerRuntimeConfig: () => resolveHttpHandlerRuntimeConfig
    });
    module2.exports = __toCommonJS2(src_exports);
    var getHttpHandlerExtensionConfiguration = /* @__PURE__ */ __name((runtimeConfig) => {
      let httpHandler = runtimeConfig.httpHandler;
      return {
        setHttpHandler(handler) {
          httpHandler = handler;
        },
        httpHandler() {
          return httpHandler;
        },
        updateHttpClientConfig(key, value) {
          httpHandler.updateHttpClientConfig(key, value);
        },
        httpHandlerConfigs() {
          return httpHandler.httpHandlerConfigs();
        }
      };
    }, "getHttpHandlerExtensionConfiguration");
    var resolveHttpHandlerRuntimeConfig = /* @__PURE__ */ __name((httpHandlerExtensionConfiguration) => {
      return {
        httpHandler: httpHandlerExtensionConfiguration.httpHandler()
      };
    }, "resolveHttpHandlerRuntimeConfig");
    var import_types5 = require_dist_cjs();
    var _Field = class _Field {
      constructor({ name, kind = import_types5.FieldPosition.HEADER, values = [] }) {
        this.name = name;
        this.kind = kind;
        this.values = values;
      }
      /**
       * Appends a value to the field.
       *
       * @param value The value to append.
       */
      add(value) {
        this.values.push(value);
      }
      /**
       * Overwrite existing field values.
       *
       * @param values The new field values.
       */
      set(values) {
        this.values = values;
      }
      /**
       * Remove all matching entries from list.
       *
       * @param value Value to remove.
       */
      remove(value) {
        this.values = this.values.filter((v) => v !== value);
      }
      /**
       * Get comma-delimited string.
       *
       * @returns String representation of {@link Field}.
       */
      toString() {
        return this.values.map((v) => v.includes(",") || v.includes(" ") ? `"${v}"` : v).join(", ");
      }
      /**
       * Get string values as a list
       *
       * @returns Values in {@link Field} as a list.
       */
      get() {
        return this.values;
      }
    };
    __name(_Field, "Field");
    var Field = _Field;
    var _Fields = class _Fields {
      constructor({ fields = [], encoding = "utf-8" }) {
        this.entries = {};
        fields.forEach(this.setField.bind(this));
        this.encoding = encoding;
      }
      /**
       * Set entry for a {@link Field} name. The `name`
       * attribute will be used to key the collection.
       *
       * @param field The {@link Field} to set.
       */
      setField(field) {
        this.entries[field.name.toLowerCase()] = field;
      }
      /**
       *  Retrieve {@link Field} entry by name.
       *
       * @param name The name of the {@link Field} entry
       *  to retrieve
       * @returns The {@link Field} if it exists.
       */
      getField(name) {
        return this.entries[name.toLowerCase()];
      }
      /**
       * Delete entry from collection.
       *
       * @param name Name of the entry to delete.
       */
      removeField(name) {
        delete this.entries[name.toLowerCase()];
      }
      /**
       * Helper function for retrieving specific types of fields.
       * Used to grab all headers or all trailers.
       *
       * @param kind {@link FieldPosition} of entries to retrieve.
       * @returns The {@link Field} entries with the specified
       *  {@link FieldPosition}.
       */
      getByType(kind) {
        return Object.values(this.entries).filter((field) => field.kind === kind);
      }
    };
    __name(_Fields, "Fields");
    var Fields = _Fields;
    var _HttpRequest = class _HttpRequest2 {
      constructor(options) {
        this.method = options.method || "GET";
        this.hostname = options.hostname || "localhost";
        this.port = options.port;
        this.query = options.query || {};
        this.headers = options.headers || {};
        this.body = options.body;
        this.protocol = options.protocol ? options.protocol.slice(-1) !== ":" ? `${options.protocol}:` : options.protocol : "https:";
        this.path = options.path ? options.path.charAt(0) !== "/" ? `/${options.path}` : options.path : "/";
        this.username = options.username;
        this.password = options.password;
        this.fragment = options.fragment;
      }
      /**
       * Note: this does not deep-clone the body.
       */
      static clone(request) {
        const cloned = new _HttpRequest2({
          ...request,
          headers: { ...request.headers }
        });
        if (cloned.query) {
          cloned.query = cloneQuery(cloned.query);
        }
        return cloned;
      }
      /**
       * This method only actually asserts that request is the interface {@link IHttpRequest},
       * and not necessarily this concrete class. Left in place for API stability.
       *
       * Do not call instance methods on the input of this function, and
       * do not assume it has the HttpRequest prototype.
       */
      static isInstance(request) {
        if (!request) {
          return false;
        }
        const req = request;
        return "method" in req && "protocol" in req && "hostname" in req && "path" in req && typeof req["query"] === "object" && typeof req["headers"] === "object";
      }
      /**
       * @deprecated use static HttpRequest.clone(request) instead. It's not safe to call
       * this method because {@link HttpRequest.isInstance} incorrectly
       * asserts that IHttpRequest (interface) objects are of type HttpRequest (class).
       */
      clone() {
        return _HttpRequest2.clone(this);
      }
    };
    __name(_HttpRequest, "HttpRequest");
    var HttpRequest7 = _HttpRequest;
    function cloneQuery(query2) {
      return Object.keys(query2).reduce((carry, paramName) => {
        const param = query2[paramName];
        return {
          ...carry,
          [paramName]: Array.isArray(param) ? [...param] : param
        };
      }, {});
    }
    __name(cloneQuery, "cloneQuery");
    var _HttpResponse = class _HttpResponse {
      constructor(options) {
        this.statusCode = options.statusCode;
        this.reason = options.reason;
        this.headers = options.headers || {};
        this.body = options.body;
      }
      static isInstance(response) {
        if (!response)
          return false;
        const resp = response;
        return typeof resp.statusCode === "number" && typeof resp.headers === "object";
      }
    };
    __name(_HttpResponse, "HttpResponse");
    var HttpResponse2 = _HttpResponse;
    function isValidHostname(hostname) {
      const hostPattern = /^[a-z0-9][a-z0-9\.\-]*[a-z0-9]$/;
      return hostPattern.test(hostname);
    }
    __name(isValidHostname, "isValidHostname");
  }
});

// node_modules/@aws-sdk/middleware-host-header/dist-cjs/index.js
var require_dist_cjs3 = __commonJS({
  "node_modules/@aws-sdk/middleware-host-header/dist-cjs/index.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      getHostHeaderPlugin: () => getHostHeaderPlugin,
      hostHeaderMiddleware: () => hostHeaderMiddleware,
      hostHeaderMiddlewareOptions: () => hostHeaderMiddlewareOptions,
      resolveHostHeaderConfig: () => resolveHostHeaderConfig
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_protocol_http8 = require_dist_cjs2();
    function resolveHostHeaderConfig(input) {
      return input;
    }
    __name(resolveHostHeaderConfig, "resolveHostHeaderConfig");
    var hostHeaderMiddleware = /* @__PURE__ */ __name((options) => (next) => async (args) => {
      if (!import_protocol_http8.HttpRequest.isInstance(args.request))
        return next(args);
      const { request } = args;
      const { handlerProtocol = "" } = options.requestHandler.metadata || {};
      if (handlerProtocol.indexOf("h2") >= 0 && !request.headers[":authority"]) {
        delete request.headers["host"];
        request.headers[":authority"] = request.hostname + (request.port ? ":" + request.port : "");
      } else if (!request.headers["host"]) {
        let host = request.hostname;
        if (request.port != null)
          host += `:${request.port}`;
        request.headers["host"] = host;
      }
      return next(args);
    }, "hostHeaderMiddleware");
    var hostHeaderMiddlewareOptions = {
      name: "hostHeaderMiddleware",
      step: "build",
      priority: "low",
      tags: ["HOST"],
      override: true
    };
    var getHostHeaderPlugin = /* @__PURE__ */ __name((options) => ({
      applyToStack: (clientStack) => {
        clientStack.add(hostHeaderMiddleware(options), hostHeaderMiddlewareOptions);
      }
    }), "getHostHeaderPlugin");
  }
});

// node_modules/@aws-sdk/middleware-logger/dist-cjs/index.js
var require_dist_cjs4 = __commonJS({
  "node_modules/@aws-sdk/middleware-logger/dist-cjs/index.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      getLoggerPlugin: () => getLoggerPlugin,
      loggerMiddleware: () => loggerMiddleware,
      loggerMiddlewareOptions: () => loggerMiddlewareOptions
    });
    module2.exports = __toCommonJS2(src_exports);
    var loggerMiddleware = /* @__PURE__ */ __name(() => (next, context) => async (args) => {
      var _a, _b;
      try {
        const response = await next(args);
        const { clientName, commandName, logger, dynamoDbDocumentClientOptions = {} } = context;
        const { overrideInputFilterSensitiveLog, overrideOutputFilterSensitiveLog } = dynamoDbDocumentClientOptions;
        const inputFilterSensitiveLog = overrideInputFilterSensitiveLog ?? context.inputFilterSensitiveLog;
        const outputFilterSensitiveLog = overrideOutputFilterSensitiveLog ?? context.outputFilterSensitiveLog;
        const { $metadata, ...outputWithoutMetadata } = response.output;
        (_a = logger == null ? void 0 : logger.info) == null ? void 0 : _a.call(logger, {
          clientName,
          commandName,
          input: inputFilterSensitiveLog(args.input),
          output: outputFilterSensitiveLog(outputWithoutMetadata),
          metadata: $metadata
        });
        return response;
      } catch (error) {
        const { clientName, commandName, logger, dynamoDbDocumentClientOptions = {} } = context;
        const { overrideInputFilterSensitiveLog } = dynamoDbDocumentClientOptions;
        const inputFilterSensitiveLog = overrideInputFilterSensitiveLog ?? context.inputFilterSensitiveLog;
        (_b = logger == null ? void 0 : logger.error) == null ? void 0 : _b.call(logger, {
          clientName,
          commandName,
          input: inputFilterSensitiveLog(args.input),
          error,
          metadata: error.$metadata
        });
        throw error;
      }
    }, "loggerMiddleware");
    var loggerMiddlewareOptions = {
      name: "loggerMiddleware",
      tags: ["LOGGER"],
      step: "initialize",
      override: true
    };
    var getLoggerPlugin = /* @__PURE__ */ __name((options) => ({
      applyToStack: (clientStack) => {
        clientStack.add(loggerMiddleware(), loggerMiddlewareOptions);
      }
    }), "getLoggerPlugin");
  }
});

// node_modules/@aws-sdk/middleware-recursion-detection/dist-cjs/index.js
var require_dist_cjs5 = __commonJS({
  "node_modules/@aws-sdk/middleware-recursion-detection/dist-cjs/index.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      addRecursionDetectionMiddlewareOptions: () => addRecursionDetectionMiddlewareOptions,
      getRecursionDetectionPlugin: () => getRecursionDetectionPlugin,
      recursionDetectionMiddleware: () => recursionDetectionMiddleware
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_protocol_http8 = require_dist_cjs2();
    var TRACE_ID_HEADER_NAME = "X-Amzn-Trace-Id";
    var ENV_LAMBDA_FUNCTION_NAME = "AWS_LAMBDA_FUNCTION_NAME";
    var ENV_TRACE_ID = "_X_AMZN_TRACE_ID";
    var recursionDetectionMiddleware = /* @__PURE__ */ __name((options) => (next) => async (args) => {
      const { request } = args;
      if (!import_protocol_http8.HttpRequest.isInstance(request) || options.runtime !== "node" || request.headers.hasOwnProperty(TRACE_ID_HEADER_NAME)) {
        return next(args);
      }
      const functionName = process.env[ENV_LAMBDA_FUNCTION_NAME];
      const traceId = process.env[ENV_TRACE_ID];
      const nonEmptyString = /* @__PURE__ */ __name((str) => typeof str === "string" && str.length > 0, "nonEmptyString");
      if (nonEmptyString(functionName) && nonEmptyString(traceId)) {
        request.headers[TRACE_ID_HEADER_NAME] = traceId;
      }
      return next({
        ...args,
        request
      });
    }, "recursionDetectionMiddleware");
    var addRecursionDetectionMiddlewareOptions = {
      step: "build",
      tags: ["RECURSION_DETECTION"],
      name: "recursionDetectionMiddleware",
      override: true,
      priority: "low"
    };
    var getRecursionDetectionPlugin = /* @__PURE__ */ __name((options) => ({
      applyToStack: (clientStack) => {
        clientStack.add(recursionDetectionMiddleware(options), addRecursionDetectionMiddlewareOptions);
      }
    }), "getRecursionDetectionPlugin");
  }
});

// node_modules/@smithy/util-endpoints/dist-cjs/index.js
var require_dist_cjs6 = __commonJS({
  "node_modules/@smithy/util-endpoints/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      EndpointError: () => EndpointError2,
      customEndpointFunctions: () => customEndpointFunctions,
      isIpAddress: () => isIpAddress2,
      isValidHostLabel: () => isValidHostLabel,
      resolveEndpoint: () => resolveEndpoint2
    });
    module2.exports = __toCommonJS2(src_exports);
    var IP_V4_REGEX = new RegExp(
      `^(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}$`
    );
    var isIpAddress2 = /* @__PURE__ */ __name((value) => IP_V4_REGEX.test(value) || value.startsWith("[") && value.endsWith("]"), "isIpAddress");
    var VALID_HOST_LABEL_REGEX = new RegExp(`^(?!.*-$)(?!-)[a-zA-Z0-9-]{1,63}$`);
    var isValidHostLabel = /* @__PURE__ */ __name((value, allowSubDomains = false) => {
      if (!allowSubDomains) {
        return VALID_HOST_LABEL_REGEX.test(value);
      }
      const labels = value.split(".");
      for (const label of labels) {
        if (!isValidHostLabel(label)) {
          return false;
        }
      }
      return true;
    }, "isValidHostLabel");
    var customEndpointFunctions = {};
    var debugId = "endpoints";
    function toDebugString(input) {
      if (typeof input !== "object" || input == null) {
        return input;
      }
      if ("ref" in input) {
        return `$${toDebugString(input.ref)}`;
      }
      if ("fn" in input) {
        return `${input.fn}(${(input.argv || []).map(toDebugString).join(", ")})`;
      }
      return JSON.stringify(input, null, 2);
    }
    __name(toDebugString, "toDebugString");
    var _EndpointError = class _EndpointError extends Error {
      constructor(message) {
        super(message);
        this.name = "EndpointError";
      }
    };
    __name(_EndpointError, "EndpointError");
    var EndpointError2 = _EndpointError;
    var booleanEquals = /* @__PURE__ */ __name((value1, value2) => value1 === value2, "booleanEquals");
    var getAttrPathList = /* @__PURE__ */ __name((path) => {
      const parts = path.split(".");
      const pathList = [];
      for (const part of parts) {
        const squareBracketIndex = part.indexOf("[");
        if (squareBracketIndex !== -1) {
          if (part.indexOf("]") !== part.length - 1) {
            throw new EndpointError2(`Path: '${path}' does not end with ']'`);
          }
          const arrayIndex = part.slice(squareBracketIndex + 1, -1);
          if (Number.isNaN(parseInt(arrayIndex))) {
            throw new EndpointError2(`Invalid array index: '${arrayIndex}' in path: '${path}'`);
          }
          if (squareBracketIndex !== 0) {
            pathList.push(part.slice(0, squareBracketIndex));
          }
          pathList.push(arrayIndex);
        } else {
          pathList.push(part);
        }
      }
      return pathList;
    }, "getAttrPathList");
    var getAttr = /* @__PURE__ */ __name((value, path) => getAttrPathList(path).reduce((acc, index) => {
      if (typeof acc !== "object") {
        throw new EndpointError2(`Index '${index}' in '${path}' not found in '${JSON.stringify(value)}'`);
      } else if (Array.isArray(acc)) {
        return acc[parseInt(index)];
      }
      return acc[index];
    }, value), "getAttr");
    var isSet = /* @__PURE__ */ __name((value) => value != null, "isSet");
    var not = /* @__PURE__ */ __name((value) => !value, "not");
    var import_types32 = require_dist_cjs();
    var DEFAULT_PORTS = {
      [import_types32.EndpointURLScheme.HTTP]: 80,
      [import_types32.EndpointURLScheme.HTTPS]: 443
    };
    var parseURL = /* @__PURE__ */ __name((value) => {
      const whatwgURL = (() => {
        try {
          if (value instanceof URL) {
            return value;
          }
          if (typeof value === "object" && "hostname" in value) {
            const { hostname: hostname2, port, protocol: protocol2 = "", path = "", query: query2 = {} } = value;
            const url = new URL(`${protocol2}//${hostname2}${port ? `:${port}` : ""}${path}`);
            url.search = Object.entries(query2).map(([k, v]) => `${k}=${v}`).join("&");
            return url;
          }
          return new URL(value);
        } catch (error) {
          return null;
        }
      })();
      if (!whatwgURL) {
        console.error(`Unable to parse ${JSON.stringify(value)} as a whatwg URL.`);
        return null;
      }
      const urlString = whatwgURL.href;
      const { host, hostname, pathname, protocol, search } = whatwgURL;
      if (search) {
        return null;
      }
      const scheme = protocol.slice(0, -1);
      if (!Object.values(import_types32.EndpointURLScheme).includes(scheme)) {
        return null;
      }
      const isIp = isIpAddress2(hostname);
      const inputContainsDefaultPort = urlString.includes(`${host}:${DEFAULT_PORTS[scheme]}`) || typeof value === "string" && value.includes(`${host}:${DEFAULT_PORTS[scheme]}`);
      const authority = `${host}${inputContainsDefaultPort ? `:${DEFAULT_PORTS[scheme]}` : ``}`;
      return {
        scheme,
        authority,
        path: pathname,
        normalizedPath: pathname.endsWith("/") ? pathname : `${pathname}/`,
        isIp
      };
    }, "parseURL");
    var stringEquals = /* @__PURE__ */ __name((value1, value2) => value1 === value2, "stringEquals");
    var substring = /* @__PURE__ */ __name((input, start, stop, reverse) => {
      if (start >= stop || input.length < stop) {
        return null;
      }
      if (!reverse) {
        return input.substring(start, stop);
      }
      return input.substring(input.length - stop, input.length - start);
    }, "substring");
    var uriEncode = /* @__PURE__ */ __name((value) => encodeURIComponent(value).replace(/[!*'()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`), "uriEncode");
    var endpointFunctions = {
      booleanEquals,
      getAttr,
      isSet,
      isValidHostLabel,
      not,
      parseURL,
      stringEquals,
      substring,
      uriEncode
    };
    var evaluateTemplate = /* @__PURE__ */ __name((template, options) => {
      const evaluatedTemplateArr = [];
      const templateContext = {
        ...options.endpointParams,
        ...options.referenceRecord
      };
      let currentIndex = 0;
      while (currentIndex < template.length) {
        const openingBraceIndex = template.indexOf("{", currentIndex);
        if (openingBraceIndex === -1) {
          evaluatedTemplateArr.push(template.slice(currentIndex));
          break;
        }
        evaluatedTemplateArr.push(template.slice(currentIndex, openingBraceIndex));
        const closingBraceIndex = template.indexOf("}", openingBraceIndex);
        if (closingBraceIndex === -1) {
          evaluatedTemplateArr.push(template.slice(openingBraceIndex));
          break;
        }
        if (template[openingBraceIndex + 1] === "{" && template[closingBraceIndex + 1] === "}") {
          evaluatedTemplateArr.push(template.slice(openingBraceIndex + 1, closingBraceIndex));
          currentIndex = closingBraceIndex + 2;
        }
        const parameterName = template.substring(openingBraceIndex + 1, closingBraceIndex);
        if (parameterName.includes("#")) {
          const [refName, attrName] = parameterName.split("#");
          evaluatedTemplateArr.push(getAttr(templateContext[refName], attrName));
        } else {
          evaluatedTemplateArr.push(templateContext[parameterName]);
        }
        currentIndex = closingBraceIndex + 1;
      }
      return evaluatedTemplateArr.join("");
    }, "evaluateTemplate");
    var getReferenceValue = /* @__PURE__ */ __name(({ ref }, options) => {
      const referenceRecord = {
        ...options.endpointParams,
        ...options.referenceRecord
      };
      return referenceRecord[ref];
    }, "getReferenceValue");
    var evaluateExpression = /* @__PURE__ */ __name((obj, keyName, options) => {
      if (typeof obj === "string") {
        return evaluateTemplate(obj, options);
      } else if (obj["fn"]) {
        return callFunction(obj, options);
      } else if (obj["ref"]) {
        return getReferenceValue(obj, options);
      }
      throw new EndpointError2(`'${keyName}': ${String(obj)} is not a string, function or reference.`);
    }, "evaluateExpression");
    var callFunction = /* @__PURE__ */ __name(({ fn, argv }, options) => {
      const evaluatedArgs = argv.map(
        (arg) => ["boolean", "number"].includes(typeof arg) ? arg : evaluateExpression(arg, "arg", options)
      );
      const fnSegments = fn.split(".");
      if (fnSegments[0] in customEndpointFunctions && fnSegments[1] != null) {
        return customEndpointFunctions[fnSegments[0]][fnSegments[1]](...evaluatedArgs);
      }
      return endpointFunctions[fn](...evaluatedArgs);
    }, "callFunction");
    var evaluateCondition = /* @__PURE__ */ __name(({ assign, ...fnArgs }, options) => {
      var _a, _b;
      if (assign && assign in options.referenceRecord) {
        throw new EndpointError2(`'${assign}' is already defined in Reference Record.`);
      }
      const value = callFunction(fnArgs, options);
      (_b = (_a = options.logger) == null ? void 0 : _a.debug) == null ? void 0 : _b.call(_a, `${debugId} evaluateCondition: ${toDebugString(fnArgs)} = ${toDebugString(value)}`);
      return {
        result: value === "" ? true : !!value,
        ...assign != null && { toAssign: { name: assign, value } }
      };
    }, "evaluateCondition");
    var evaluateConditions = /* @__PURE__ */ __name((conditions = [], options) => {
      var _a, _b;
      const conditionsReferenceRecord = {};
      for (const condition of conditions) {
        const { result, toAssign } = evaluateCondition(condition, {
          ...options,
          referenceRecord: {
            ...options.referenceRecord,
            ...conditionsReferenceRecord
          }
        });
        if (!result) {
          return { result };
        }
        if (toAssign) {
          conditionsReferenceRecord[toAssign.name] = toAssign.value;
          (_b = (_a = options.logger) == null ? void 0 : _a.debug) == null ? void 0 : _b.call(_a, `${debugId} assign: ${toAssign.name} := ${toDebugString(toAssign.value)}`);
        }
      }
      return { result: true, referenceRecord: conditionsReferenceRecord };
    }, "evaluateConditions");
    var getEndpointHeaders = /* @__PURE__ */ __name((headers, options) => Object.entries(headers).reduce(
      (acc, [headerKey, headerVal]) => ({
        ...acc,
        [headerKey]: headerVal.map((headerValEntry) => {
          const processedExpr = evaluateExpression(headerValEntry, "Header value entry", options);
          if (typeof processedExpr !== "string") {
            throw new EndpointError2(`Header '${headerKey}' value '${processedExpr}' is not a string`);
          }
          return processedExpr;
        })
      }),
      {}
    ), "getEndpointHeaders");
    var getEndpointProperty = /* @__PURE__ */ __name((property, options) => {
      if (Array.isArray(property)) {
        return property.map((propertyEntry) => getEndpointProperty(propertyEntry, options));
      }
      switch (typeof property) {
        case "string":
          return evaluateTemplate(property, options);
        case "object":
          if (property === null) {
            throw new EndpointError2(`Unexpected endpoint property: ${property}`);
          }
          return getEndpointProperties(property, options);
        case "boolean":
          return property;
        default:
          throw new EndpointError2(`Unexpected endpoint property type: ${typeof property}`);
      }
    }, "getEndpointProperty");
    var getEndpointProperties = /* @__PURE__ */ __name((properties, options) => Object.entries(properties).reduce(
      (acc, [propertyKey, propertyVal]) => ({
        ...acc,
        [propertyKey]: getEndpointProperty(propertyVal, options)
      }),
      {}
    ), "getEndpointProperties");
    var getEndpointUrl = /* @__PURE__ */ __name((endpointUrl, options) => {
      const expression = evaluateExpression(endpointUrl, "Endpoint URL", options);
      if (typeof expression === "string") {
        try {
          return new URL(expression);
        } catch (error) {
          console.error(`Failed to construct URL with ${expression}`, error);
          throw error;
        }
      }
      throw new EndpointError2(`Endpoint URL must be a string, got ${typeof expression}`);
    }, "getEndpointUrl");
    var evaluateEndpointRule = /* @__PURE__ */ __name((endpointRule, options) => {
      var _a, _b;
      const { conditions, endpoint } = endpointRule;
      const { result, referenceRecord } = evaluateConditions(conditions, options);
      if (!result) {
        return;
      }
      const endpointRuleOptions = {
        ...options,
        referenceRecord: { ...options.referenceRecord, ...referenceRecord }
      };
      const { url, properties, headers } = endpoint;
      (_b = (_a = options.logger) == null ? void 0 : _a.debug) == null ? void 0 : _b.call(_a, `${debugId} Resolving endpoint from template: ${toDebugString(endpoint)}`);
      return {
        ...headers != void 0 && {
          headers: getEndpointHeaders(headers, endpointRuleOptions)
        },
        ...properties != void 0 && {
          properties: getEndpointProperties(properties, endpointRuleOptions)
        },
        url: getEndpointUrl(url, endpointRuleOptions)
      };
    }, "evaluateEndpointRule");
    var evaluateErrorRule = /* @__PURE__ */ __name((errorRule, options) => {
      const { conditions, error } = errorRule;
      const { result, referenceRecord } = evaluateConditions(conditions, options);
      if (!result) {
        return;
      }
      throw new EndpointError2(
        evaluateExpression(error, "Error", {
          ...options,
          referenceRecord: { ...options.referenceRecord, ...referenceRecord }
        })
      );
    }, "evaluateErrorRule");
    var evaluateTreeRule = /* @__PURE__ */ __name((treeRule, options) => {
      const { conditions, rules } = treeRule;
      const { result, referenceRecord } = evaluateConditions(conditions, options);
      if (!result) {
        return;
      }
      return evaluateRules(rules, {
        ...options,
        referenceRecord: { ...options.referenceRecord, ...referenceRecord }
      });
    }, "evaluateTreeRule");
    var evaluateRules = /* @__PURE__ */ __name((rules, options) => {
      for (const rule of rules) {
        if (rule.type === "endpoint") {
          const endpointOrUndefined = evaluateEndpointRule(rule, options);
          if (endpointOrUndefined) {
            return endpointOrUndefined;
          }
        } else if (rule.type === "error") {
          evaluateErrorRule(rule, options);
        } else if (rule.type === "tree") {
          const endpointOrUndefined = evaluateTreeRule(rule, options);
          if (endpointOrUndefined) {
            return endpointOrUndefined;
          }
        } else {
          throw new EndpointError2(`Unknown endpoint rule: ${rule}`);
        }
      }
      throw new EndpointError2(`Rules evaluation failed`);
    }, "evaluateRules");
    var resolveEndpoint2 = /* @__PURE__ */ __name((ruleSetObject, options) => {
      var _a, _b, _c, _d, _e;
      const { endpointParams, logger } = options;
      const { parameters, rules } = ruleSetObject;
      (_b = (_a = options.logger) == null ? void 0 : _a.debug) == null ? void 0 : _b.call(_a, `${debugId} Initial EndpointParams: ${toDebugString(endpointParams)}`);
      const paramsWithDefault = Object.entries(parameters).filter(([, v]) => v.default != null).map(([k, v]) => [k, v.default]);
      if (paramsWithDefault.length > 0) {
        for (const [paramKey, paramDefaultValue] of paramsWithDefault) {
          endpointParams[paramKey] = endpointParams[paramKey] ?? paramDefaultValue;
        }
      }
      const requiredParams = Object.entries(parameters).filter(([, v]) => v.required).map(([k]) => k);
      for (const requiredParam of requiredParams) {
        if (endpointParams[requiredParam] == null) {
          throw new EndpointError2(`Missing required parameter: '${requiredParam}'`);
        }
      }
      const endpoint = evaluateRules(rules, { endpointParams, logger, referenceRecord: {} });
      if ((_c = options.endpointParams) == null ? void 0 : _c.Endpoint) {
        try {
          const givenEndpoint = new URL(options.endpointParams.Endpoint);
          const { protocol, port } = givenEndpoint;
          endpoint.url.protocol = protocol;
          endpoint.url.port = port;
        } catch (e) {
        }
      }
      (_e = (_d = options.logger) == null ? void 0 : _d.debug) == null ? void 0 : _e.call(_d, `${debugId} Resolved endpoint: ${toDebugString(endpoint)}`);
      return endpoint;
    }, "resolveEndpoint");
  }
});

// node_modules/@aws-sdk/util-endpoints/dist-cjs/index.js
var require_dist_cjs7 = __commonJS({
  "node_modules/@aws-sdk/util-endpoints/dist-cjs/index.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      ConditionObject: () => import_util_endpoints.ConditionObject,
      DeprecatedObject: () => import_util_endpoints.DeprecatedObject,
      EndpointError: () => import_util_endpoints.EndpointError,
      EndpointObject: () => import_util_endpoints.EndpointObject,
      EndpointObjectHeaders: () => import_util_endpoints.EndpointObjectHeaders,
      EndpointObjectProperties: () => import_util_endpoints.EndpointObjectProperties,
      EndpointParams: () => import_util_endpoints.EndpointParams,
      EndpointResolverOptions: () => import_util_endpoints.EndpointResolverOptions,
      EndpointRuleObject: () => import_util_endpoints.EndpointRuleObject,
      ErrorRuleObject: () => import_util_endpoints.ErrorRuleObject,
      EvaluateOptions: () => import_util_endpoints.EvaluateOptions,
      Expression: () => import_util_endpoints.Expression,
      FunctionArgv: () => import_util_endpoints.FunctionArgv,
      FunctionObject: () => import_util_endpoints.FunctionObject,
      FunctionReturn: () => import_util_endpoints.FunctionReturn,
      ParameterObject: () => import_util_endpoints.ParameterObject,
      ReferenceObject: () => import_util_endpoints.ReferenceObject,
      ReferenceRecord: () => import_util_endpoints.ReferenceRecord,
      RuleSetObject: () => import_util_endpoints.RuleSetObject,
      RuleSetRules: () => import_util_endpoints.RuleSetRules,
      TreeRuleObject: () => import_util_endpoints.TreeRuleObject,
      awsEndpointFunctions: () => awsEndpointFunctions,
      getUserAgentPrefix: () => getUserAgentPrefix,
      isIpAddress: () => import_util_endpoints.isIpAddress,
      partition: () => partition,
      resolveEndpoint: () => import_util_endpoints.resolveEndpoint,
      setPartitionInfo: () => setPartitionInfo,
      useDefaultPartitionInfo: () => useDefaultPartitionInfo
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_util_endpoints = require_dist_cjs6();
    var isVirtualHostableS3Bucket = /* @__PURE__ */ __name((value, allowSubDomains = false) => {
      if (allowSubDomains) {
        for (const label of value.split(".")) {
          if (!isVirtualHostableS3Bucket(label)) {
            return false;
          }
        }
        return true;
      }
      if (!(0, import_util_endpoints.isValidHostLabel)(value)) {
        return false;
      }
      if (value.length < 3 || value.length > 63) {
        return false;
      }
      if (value !== value.toLowerCase()) {
        return false;
      }
      if ((0, import_util_endpoints.isIpAddress)(value)) {
        return false;
      }
      return true;
    }, "isVirtualHostableS3Bucket");
    var ARN_DELIMITER = ":";
    var RESOURCE_DELIMITER = "/";
    var parseArn = /* @__PURE__ */ __name((value) => {
      const segments = value.split(ARN_DELIMITER);
      if (segments.length < 6)
        return null;
      const [arn, partition2, service, region, accountId, ...resourcePath] = segments;
      if (arn !== "arn" || partition2 === "" || service === "" || resourcePath.join(ARN_DELIMITER) === "")
        return null;
      const resourceId = resourcePath.map((resource) => resource.split(RESOURCE_DELIMITER)).flat();
      return {
        partition: partition2,
        service,
        region,
        accountId,
        resourceId
      };
    }, "parseArn");
    var partitions_default = {
      partitions: [{
        id: "aws",
        outputs: {
          dnsSuffix: "amazonaws.com",
          dualStackDnsSuffix: "api.aws",
          implicitGlobalRegion: "us-east-1",
          name: "aws",
          supportsDualStack: true,
          supportsFIPS: true
        },
        regionRegex: "^(us|eu|ap|sa|ca|me|af|il|mx)\\-\\w+\\-\\d+$",
        regions: {
          "af-south-1": {
            description: "Africa (Cape Town)"
          },
          "ap-east-1": {
            description: "Asia Pacific (Hong Kong)"
          },
          "ap-northeast-1": {
            description: "Asia Pacific (Tokyo)"
          },
          "ap-northeast-2": {
            description: "Asia Pacific (Seoul)"
          },
          "ap-northeast-3": {
            description: "Asia Pacific (Osaka)"
          },
          "ap-south-1": {
            description: "Asia Pacific (Mumbai)"
          },
          "ap-south-2": {
            description: "Asia Pacific (Hyderabad)"
          },
          "ap-southeast-1": {
            description: "Asia Pacific (Singapore)"
          },
          "ap-southeast-2": {
            description: "Asia Pacific (Sydney)"
          },
          "ap-southeast-3": {
            description: "Asia Pacific (Jakarta)"
          },
          "ap-southeast-4": {
            description: "Asia Pacific (Melbourne)"
          },
          "ap-southeast-5": {
            description: "Asia Pacific (Malaysia)"
          },
          "aws-global": {
            description: "AWS Standard global region"
          },
          "ca-central-1": {
            description: "Canada (Central)"
          },
          "ca-west-1": {
            description: "Canada West (Calgary)"
          },
          "eu-central-1": {
            description: "Europe (Frankfurt)"
          },
          "eu-central-2": {
            description: "Europe (Zurich)"
          },
          "eu-north-1": {
            description: "Europe (Stockholm)"
          },
          "eu-south-1": {
            description: "Europe (Milan)"
          },
          "eu-south-2": {
            description: "Europe (Spain)"
          },
          "eu-west-1": {
            description: "Europe (Ireland)"
          },
          "eu-west-2": {
            description: "Europe (London)"
          },
          "eu-west-3": {
            description: "Europe (Paris)"
          },
          "il-central-1": {
            description: "Israel (Tel Aviv)"
          },
          "me-central-1": {
            description: "Middle East (UAE)"
          },
          "me-south-1": {
            description: "Middle East (Bahrain)"
          },
          "sa-east-1": {
            description: "South America (Sao Paulo)"
          },
          "us-east-1": {
            description: "US East (N. Virginia)"
          },
          "us-east-2": {
            description: "US East (Ohio)"
          },
          "us-west-1": {
            description: "US West (N. California)"
          },
          "us-west-2": {
            description: "US West (Oregon)"
          }
        }
      }, {
        id: "aws-cn",
        outputs: {
          dnsSuffix: "amazonaws.com.cn",
          dualStackDnsSuffix: "api.amazonwebservices.com.cn",
          implicitGlobalRegion: "cn-northwest-1",
          name: "aws-cn",
          supportsDualStack: true,
          supportsFIPS: true
        },
        regionRegex: "^cn\\-\\w+\\-\\d+$",
        regions: {
          "aws-cn-global": {
            description: "AWS China global region"
          },
          "cn-north-1": {
            description: "China (Beijing)"
          },
          "cn-northwest-1": {
            description: "China (Ningxia)"
          }
        }
      }, {
        id: "aws-us-gov",
        outputs: {
          dnsSuffix: "amazonaws.com",
          dualStackDnsSuffix: "api.aws",
          implicitGlobalRegion: "us-gov-west-1",
          name: "aws-us-gov",
          supportsDualStack: true,
          supportsFIPS: true
        },
        regionRegex: "^us\\-gov\\-\\w+\\-\\d+$",
        regions: {
          "aws-us-gov-global": {
            description: "AWS GovCloud (US) global region"
          },
          "us-gov-east-1": {
            description: "AWS GovCloud (US-East)"
          },
          "us-gov-west-1": {
            description: "AWS GovCloud (US-West)"
          }
        }
      }, {
        id: "aws-iso",
        outputs: {
          dnsSuffix: "c2s.ic.gov",
          dualStackDnsSuffix: "c2s.ic.gov",
          implicitGlobalRegion: "us-iso-east-1",
          name: "aws-iso",
          supportsDualStack: false,
          supportsFIPS: true
        },
        regionRegex: "^us\\-iso\\-\\w+\\-\\d+$",
        regions: {
          "aws-iso-global": {
            description: "AWS ISO (US) global region"
          },
          "us-iso-east-1": {
            description: "US ISO East"
          },
          "us-iso-west-1": {
            description: "US ISO WEST"
          }
        }
      }, {
        id: "aws-iso-b",
        outputs: {
          dnsSuffix: "sc2s.sgov.gov",
          dualStackDnsSuffix: "sc2s.sgov.gov",
          implicitGlobalRegion: "us-isob-east-1",
          name: "aws-iso-b",
          supportsDualStack: false,
          supportsFIPS: true
        },
        regionRegex: "^us\\-isob\\-\\w+\\-\\d+$",
        regions: {
          "aws-iso-b-global": {
            description: "AWS ISOB (US) global region"
          },
          "us-isob-east-1": {
            description: "US ISOB East (Ohio)"
          }
        }
      }, {
        id: "aws-iso-e",
        outputs: {
          dnsSuffix: "cloud.adc-e.uk",
          dualStackDnsSuffix: "cloud.adc-e.uk",
          implicitGlobalRegion: "eu-isoe-west-1",
          name: "aws-iso-e",
          supportsDualStack: false,
          supportsFIPS: true
        },
        regionRegex: "^eu\\-isoe\\-\\w+\\-\\d+$",
        regions: {
          "eu-isoe-west-1": {
            description: "EU ISOE West"
          }
        }
      }, {
        id: "aws-iso-f",
        outputs: {
          dnsSuffix: "csp.hci.ic.gov",
          dualStackDnsSuffix: "csp.hci.ic.gov",
          implicitGlobalRegion: "us-isof-south-1",
          name: "aws-iso-f",
          supportsDualStack: false,
          supportsFIPS: true
        },
        regionRegex: "^us\\-isof\\-\\w+\\-\\d+$",
        regions: {}
      }],
      version: "1.1"
    };
    var selectedPartitionsInfo = partitions_default;
    var selectedUserAgentPrefix = "";
    var partition = /* @__PURE__ */ __name((value) => {
      const { partitions } = selectedPartitionsInfo;
      for (const partition2 of partitions) {
        const { regions, outputs } = partition2;
        for (const [region, regionData] of Object.entries(regions)) {
          if (region === value) {
            return {
              ...outputs,
              ...regionData
            };
          }
        }
      }
      for (const partition2 of partitions) {
        const { regionRegex, outputs } = partition2;
        if (new RegExp(regionRegex).test(value)) {
          return {
            ...outputs
          };
        }
      }
      const DEFAULT_PARTITION = partitions.find((partition2) => partition2.id === "aws");
      if (!DEFAULT_PARTITION) {
        throw new Error(
          "Provided region was not found in the partition array or regex, and default partition with id 'aws' doesn't exist."
        );
      }
      return {
        ...DEFAULT_PARTITION.outputs
      };
    }, "partition");
    var setPartitionInfo = /* @__PURE__ */ __name((partitionsInfo, userAgentPrefix = "") => {
      selectedPartitionsInfo = partitionsInfo;
      selectedUserAgentPrefix = userAgentPrefix;
    }, "setPartitionInfo");
    var useDefaultPartitionInfo = /* @__PURE__ */ __name(() => {
      setPartitionInfo(partitions_default, "");
    }, "useDefaultPartitionInfo");
    var getUserAgentPrefix = /* @__PURE__ */ __name(() => selectedUserAgentPrefix, "getUserAgentPrefix");
    var awsEndpointFunctions = {
      isVirtualHostableS3Bucket,
      parseArn,
      partition
    };
    import_util_endpoints.customEndpointFunctions.aws = awsEndpointFunctions;
  }
});

// node_modules/@aws-sdk/middleware-user-agent/dist-cjs/index.js
var require_dist_cjs8 = __commonJS({
  "node_modules/@aws-sdk/middleware-user-agent/dist-cjs/index.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      getUserAgentMiddlewareOptions: () => getUserAgentMiddlewareOptions,
      getUserAgentPlugin: () => getUserAgentPlugin,
      resolveUserAgentConfig: () => resolveUserAgentConfig,
      userAgentMiddleware: () => userAgentMiddleware
    });
    module2.exports = __toCommonJS2(src_exports);
    function resolveUserAgentConfig(input) {
      return {
        ...input,
        customUserAgent: typeof input.customUserAgent === "string" ? [[input.customUserAgent]] : input.customUserAgent
      };
    }
    __name(resolveUserAgentConfig, "resolveUserAgentConfig");
    var import_util_endpoints = require_dist_cjs7();
    var import_protocol_http8 = require_dist_cjs2();
    var USER_AGENT = "user-agent";
    var X_AMZ_USER_AGENT = "x-amz-user-agent";
    var SPACE = " ";
    var UA_NAME_SEPARATOR = "/";
    var UA_NAME_ESCAPE_REGEX = /[^\!\$\%\&\'\*\+\-\.\^\_\`\|\~\d\w]/g;
    var UA_VALUE_ESCAPE_REGEX = /[^\!\$\%\&\'\*\+\-\.\^\_\`\|\~\d\w\#]/g;
    var UA_ESCAPE_CHAR = "-";
    var userAgentMiddleware = /* @__PURE__ */ __name((options) => (next, context) => async (args) => {
      var _a, _b;
      const { request } = args;
      if (!import_protocol_http8.HttpRequest.isInstance(request))
        return next(args);
      const { headers } = request;
      const userAgent = ((_a = context == null ? void 0 : context.userAgent) == null ? void 0 : _a.map(escapeUserAgent)) || [];
      const defaultUserAgent = (await options.defaultUserAgentProvider()).map(escapeUserAgent);
      const customUserAgent = ((_b = options == null ? void 0 : options.customUserAgent) == null ? void 0 : _b.map(escapeUserAgent)) || [];
      const prefix = (0, import_util_endpoints.getUserAgentPrefix)();
      const sdkUserAgentValue = (prefix ? [prefix] : []).concat([...defaultUserAgent, ...userAgent, ...customUserAgent]).join(SPACE);
      const normalUAValue = [
        ...defaultUserAgent.filter((section) => section.startsWith("aws-sdk-")),
        ...customUserAgent
      ].join(SPACE);
      if (options.runtime !== "browser") {
        if (normalUAValue) {
          headers[X_AMZ_USER_AGENT] = headers[X_AMZ_USER_AGENT] ? `${headers[USER_AGENT]} ${normalUAValue}` : normalUAValue;
        }
        headers[USER_AGENT] = sdkUserAgentValue;
      } else {
        headers[X_AMZ_USER_AGENT] = sdkUserAgentValue;
      }
      return next({
        ...args,
        request
      });
    }, "userAgentMiddleware");
    var escapeUserAgent = /* @__PURE__ */ __name((userAgentPair) => {
      var _a;
      const name = userAgentPair[0].split(UA_NAME_SEPARATOR).map((part) => part.replace(UA_NAME_ESCAPE_REGEX, UA_ESCAPE_CHAR)).join(UA_NAME_SEPARATOR);
      const version2 = (_a = userAgentPair[1]) == null ? void 0 : _a.replace(UA_VALUE_ESCAPE_REGEX, UA_ESCAPE_CHAR);
      const prefixSeparatorIndex = name.indexOf(UA_NAME_SEPARATOR);
      const prefix = name.substring(0, prefixSeparatorIndex);
      let uaName = name.substring(prefixSeparatorIndex + 1);
      if (prefix === "api") {
        uaName = uaName.toLowerCase();
      }
      return [prefix, uaName, version2].filter((item) => item && item.length > 0).reduce((acc, item, index) => {
        switch (index) {
          case 0:
            return item;
          case 1:
            return `${acc}/${item}`;
          default:
            return `${acc}#${item}`;
        }
      }, "");
    }, "escapeUserAgent");
    var getUserAgentMiddlewareOptions = {
      name: "getUserAgentMiddleware",
      step: "build",
      priority: "low",
      tags: ["SET_USER_AGENT", "USER_AGENT"],
      override: true
    };
    var getUserAgentPlugin = /* @__PURE__ */ __name((config) => ({
      applyToStack: (clientStack) => {
        clientStack.add(userAgentMiddleware(config), getUserAgentMiddlewareOptions);
      }
    }), "getUserAgentPlugin");
  }
});

// node_modules/@smithy/util-config-provider/dist-cjs/index.js
var require_dist_cjs9 = __commonJS({
  "node_modules/@smithy/util-config-provider/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      SelectorType: () => SelectorType,
      booleanSelector: () => booleanSelector,
      numberSelector: () => numberSelector
    });
    module2.exports = __toCommonJS2(src_exports);
    var booleanSelector = /* @__PURE__ */ __name((obj, key, type) => {
      if (!(key in obj))
        return void 0;
      if (obj[key] === "true")
        return true;
      if (obj[key] === "false")
        return false;
      throw new Error(`Cannot load ${type} "${key}". Expected "true" or "false", got ${obj[key]}.`);
    }, "booleanSelector");
    var numberSelector = /* @__PURE__ */ __name((obj, key, type) => {
      if (!(key in obj))
        return void 0;
      const numberValue = parseInt(obj[key], 10);
      if (Number.isNaN(numberValue)) {
        throw new TypeError(`Cannot load ${type} '${key}'. Expected number, got '${obj[key]}'.`);
      }
      return numberValue;
    }, "numberSelector");
    var SelectorType = /* @__PURE__ */ ((SelectorType2) => {
      SelectorType2["ENV"] = "env";
      SelectorType2["CONFIG"] = "shared config entry";
      return SelectorType2;
    })(SelectorType || {});
  }
});

// node_modules/@smithy/util-middleware/dist-cjs/index.js
var require_dist_cjs10 = __commonJS({
  "node_modules/@smithy/util-middleware/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      getSmithyContext: () => getSmithyContext4,
      normalizeProvider: () => normalizeProvider2
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_types5 = require_dist_cjs();
    var getSmithyContext4 = /* @__PURE__ */ __name((context) => context[import_types5.SMITHY_CONTEXT_KEY] || (context[import_types5.SMITHY_CONTEXT_KEY] = {}), "getSmithyContext");
    var normalizeProvider2 = /* @__PURE__ */ __name((input) => {
      if (typeof input === "function")
        return input;
      const promisified = Promise.resolve(input);
      return () => promisified;
    }, "normalizeProvider");
  }
});

// node_modules/@smithy/config-resolver/dist-cjs/index.js
var require_dist_cjs11 = __commonJS({
  "node_modules/@smithy/config-resolver/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      CONFIG_USE_DUALSTACK_ENDPOINT: () => CONFIG_USE_DUALSTACK_ENDPOINT,
      CONFIG_USE_FIPS_ENDPOINT: () => CONFIG_USE_FIPS_ENDPOINT,
      DEFAULT_USE_DUALSTACK_ENDPOINT: () => DEFAULT_USE_DUALSTACK_ENDPOINT,
      DEFAULT_USE_FIPS_ENDPOINT: () => DEFAULT_USE_FIPS_ENDPOINT,
      ENV_USE_DUALSTACK_ENDPOINT: () => ENV_USE_DUALSTACK_ENDPOINT,
      ENV_USE_FIPS_ENDPOINT: () => ENV_USE_FIPS_ENDPOINT,
      NODE_REGION_CONFIG_FILE_OPTIONS: () => NODE_REGION_CONFIG_FILE_OPTIONS,
      NODE_REGION_CONFIG_OPTIONS: () => NODE_REGION_CONFIG_OPTIONS,
      NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS: () => NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS,
      NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS: () => NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS,
      REGION_ENV_NAME: () => REGION_ENV_NAME,
      REGION_INI_NAME: () => REGION_INI_NAME,
      getRegionInfo: () => getRegionInfo,
      resolveCustomEndpointsConfig: () => resolveCustomEndpointsConfig,
      resolveEndpointsConfig: () => resolveEndpointsConfig,
      resolveRegionConfig: () => resolveRegionConfig
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_util_config_provider = require_dist_cjs9();
    var ENV_USE_DUALSTACK_ENDPOINT = "AWS_USE_DUALSTACK_ENDPOINT";
    var CONFIG_USE_DUALSTACK_ENDPOINT = "use_dualstack_endpoint";
    var DEFAULT_USE_DUALSTACK_ENDPOINT = false;
    var NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS = {
      environmentVariableSelector: (env) => (0, import_util_config_provider.booleanSelector)(env, ENV_USE_DUALSTACK_ENDPOINT, import_util_config_provider.SelectorType.ENV),
      configFileSelector: (profile) => (0, import_util_config_provider.booleanSelector)(profile, CONFIG_USE_DUALSTACK_ENDPOINT, import_util_config_provider.SelectorType.CONFIG),
      default: false
    };
    var ENV_USE_FIPS_ENDPOINT = "AWS_USE_FIPS_ENDPOINT";
    var CONFIG_USE_FIPS_ENDPOINT = "use_fips_endpoint";
    var DEFAULT_USE_FIPS_ENDPOINT = false;
    var NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS = {
      environmentVariableSelector: (env) => (0, import_util_config_provider.booleanSelector)(env, ENV_USE_FIPS_ENDPOINT, import_util_config_provider.SelectorType.ENV),
      configFileSelector: (profile) => (0, import_util_config_provider.booleanSelector)(profile, CONFIG_USE_FIPS_ENDPOINT, import_util_config_provider.SelectorType.CONFIG),
      default: false
    };
    var import_util_middleware3 = require_dist_cjs10();
    var resolveCustomEndpointsConfig = /* @__PURE__ */ __name((input) => {
      const { endpoint, urlParser } = input;
      return {
        ...input,
        tls: input.tls ?? true,
        endpoint: (0, import_util_middleware3.normalizeProvider)(typeof endpoint === "string" ? urlParser(endpoint) : endpoint),
        isCustomEndpoint: true,
        useDualstackEndpoint: (0, import_util_middleware3.normalizeProvider)(input.useDualstackEndpoint ?? false)
      };
    }, "resolveCustomEndpointsConfig");
    var getEndpointFromRegion = /* @__PURE__ */ __name(async (input) => {
      const { tls = true } = input;
      const region = await input.region();
      const dnsHostRegex = new RegExp(/^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])$/);
      if (!dnsHostRegex.test(region)) {
        throw new Error("Invalid region in client config");
      }
      const useDualstackEndpoint = await input.useDualstackEndpoint();
      const useFipsEndpoint = await input.useFipsEndpoint();
      const { hostname } = await input.regionInfoProvider(region, { useDualstackEndpoint, useFipsEndpoint }) ?? {};
      if (!hostname) {
        throw new Error("Cannot resolve hostname from client config");
      }
      return input.urlParser(`${tls ? "https:" : "http:"}//${hostname}`);
    }, "getEndpointFromRegion");
    var resolveEndpointsConfig = /* @__PURE__ */ __name((input) => {
      const useDualstackEndpoint = (0, import_util_middleware3.normalizeProvider)(input.useDualstackEndpoint ?? false);
      const { endpoint, useFipsEndpoint, urlParser } = input;
      return {
        ...input,
        tls: input.tls ?? true,
        endpoint: endpoint ? (0, import_util_middleware3.normalizeProvider)(typeof endpoint === "string" ? urlParser(endpoint) : endpoint) : () => getEndpointFromRegion({ ...input, useDualstackEndpoint, useFipsEndpoint }),
        isCustomEndpoint: !!endpoint,
        useDualstackEndpoint
      };
    }, "resolveEndpointsConfig");
    var REGION_ENV_NAME = "AWS_REGION";
    var REGION_INI_NAME = "region";
    var NODE_REGION_CONFIG_OPTIONS = {
      environmentVariableSelector: (env) => env[REGION_ENV_NAME],
      configFileSelector: (profile) => profile[REGION_INI_NAME],
      default: () => {
        throw new Error("Region is missing");
      }
    };
    var NODE_REGION_CONFIG_FILE_OPTIONS = {
      preferredFile: "credentials"
    };
    var isFipsRegion = /* @__PURE__ */ __name((region) => typeof region === "string" && (region.startsWith("fips-") || region.endsWith("-fips")), "isFipsRegion");
    var getRealRegion = /* @__PURE__ */ __name((region) => isFipsRegion(region) ? ["fips-aws-global", "aws-fips"].includes(region) ? "us-east-1" : region.replace(/fips-(dkr-|prod-)?|-fips/, "") : region, "getRealRegion");
    var resolveRegionConfig = /* @__PURE__ */ __name((input) => {
      const { region, useFipsEndpoint } = input;
      if (!region) {
        throw new Error("Region is missing");
      }
      return {
        ...input,
        region: async () => {
          if (typeof region === "string") {
            return getRealRegion(region);
          }
          const providedRegion = await region();
          return getRealRegion(providedRegion);
        },
        useFipsEndpoint: async () => {
          const providedRegion = typeof region === "string" ? region : await region();
          if (isFipsRegion(providedRegion)) {
            return true;
          }
          return typeof useFipsEndpoint !== "function" ? Promise.resolve(!!useFipsEndpoint) : useFipsEndpoint();
        }
      };
    }, "resolveRegionConfig");
    var getHostnameFromVariants = /* @__PURE__ */ __name((variants = [], { useFipsEndpoint, useDualstackEndpoint }) => {
      var _a;
      return (_a = variants.find(
        ({ tags }) => useFipsEndpoint === tags.includes("fips") && useDualstackEndpoint === tags.includes("dualstack")
      )) == null ? void 0 : _a.hostname;
    }, "getHostnameFromVariants");
    var getResolvedHostname = /* @__PURE__ */ __name((resolvedRegion, { regionHostname, partitionHostname }) => regionHostname ? regionHostname : partitionHostname ? partitionHostname.replace("{region}", resolvedRegion) : void 0, "getResolvedHostname");
    var getResolvedPartition = /* @__PURE__ */ __name((region, { partitionHash }) => Object.keys(partitionHash || {}).find((key) => partitionHash[key].regions.includes(region)) ?? "aws", "getResolvedPartition");
    var getResolvedSigningRegion = /* @__PURE__ */ __name((hostname, { signingRegion, regionRegex, useFipsEndpoint }) => {
      if (signingRegion) {
        return signingRegion;
      } else if (useFipsEndpoint) {
        const regionRegexJs = regionRegex.replace("\\\\", "\\").replace(/^\^/g, "\\.").replace(/\$$/g, "\\.");
        const regionRegexmatchArray = hostname.match(regionRegexJs);
        if (regionRegexmatchArray) {
          return regionRegexmatchArray[0].slice(1, -1);
        }
      }
    }, "getResolvedSigningRegion");
    var getRegionInfo = /* @__PURE__ */ __name((region, {
      useFipsEndpoint = false,
      useDualstackEndpoint = false,
      signingService,
      regionHash,
      partitionHash
    }) => {
      var _a, _b, _c, _d, _e;
      const partition = getResolvedPartition(region, { partitionHash });
      const resolvedRegion = region in regionHash ? region : ((_a = partitionHash[partition]) == null ? void 0 : _a.endpoint) ?? region;
      const hostnameOptions = { useFipsEndpoint, useDualstackEndpoint };
      const regionHostname = getHostnameFromVariants((_b = regionHash[resolvedRegion]) == null ? void 0 : _b.variants, hostnameOptions);
      const partitionHostname = getHostnameFromVariants((_c = partitionHash[partition]) == null ? void 0 : _c.variants, hostnameOptions);
      const hostname = getResolvedHostname(resolvedRegion, { regionHostname, partitionHostname });
      if (hostname === void 0) {
        throw new Error(`Endpoint resolution failed for: ${{ resolvedRegion, useFipsEndpoint, useDualstackEndpoint }}`);
      }
      const signingRegion = getResolvedSigningRegion(hostname, {
        signingRegion: (_d = regionHash[resolvedRegion]) == null ? void 0 : _d.signingRegion,
        regionRegex: partitionHash[partition].regionRegex,
        useFipsEndpoint
      });
      return {
        partition,
        signingService,
        hostname,
        ...signingRegion && { signingRegion },
        ...((_e = regionHash[resolvedRegion]) == null ? void 0 : _e.signingService) && {
          signingService: regionHash[resolvedRegion].signingService
        }
      };
    }, "getRegionInfo");
  }
});

// node_modules/@smithy/core/dist-es/middleware-http-auth-scheme/httpAuthSchemeMiddleware.js
function convertHttpAuthSchemesToMap(httpAuthSchemes) {
  const map = /* @__PURE__ */ new Map();
  for (const scheme of httpAuthSchemes) {
    map.set(scheme.schemeId, scheme);
  }
  return map;
}
var import_types, import_util_middleware, httpAuthSchemeMiddleware;
var init_httpAuthSchemeMiddleware = __esm({
  "node_modules/@smithy/core/dist-es/middleware-http-auth-scheme/httpAuthSchemeMiddleware.js"() {
    import_types = __toESM(require_dist_cjs());
    import_util_middleware = __toESM(require_dist_cjs10());
    httpAuthSchemeMiddleware = (config, mwOptions) => (next, context) => async (args) => {
      const options = config.httpAuthSchemeProvider(await mwOptions.httpAuthSchemeParametersProvider(config, context, args.input));
      const authSchemes = convertHttpAuthSchemesToMap(config.httpAuthSchemes);
      const smithyContext = (0, import_util_middleware.getSmithyContext)(context);
      const failureReasons = [];
      for (const option of options) {
        const scheme = authSchemes.get(option.schemeId);
        if (!scheme) {
          failureReasons.push(`HttpAuthScheme \`${option.schemeId}\` was not enabled for this service.`);
          continue;
        }
        const identityProvider = scheme.identityProvider(await mwOptions.identityProviderConfigProvider(config));
        if (!identityProvider) {
          failureReasons.push(`HttpAuthScheme \`${option.schemeId}\` did not have an IdentityProvider configured.`);
          continue;
        }
        const { identityProperties = {}, signingProperties = {} } = option.propertiesExtractor?.(config, context) || {};
        option.identityProperties = Object.assign(option.identityProperties || {}, identityProperties);
        option.signingProperties = Object.assign(option.signingProperties || {}, signingProperties);
        smithyContext.selectedHttpAuthScheme = {
          httpAuthOption: option,
          identity: await identityProvider(option.identityProperties),
          signer: scheme.signer
        };
        break;
      }
      if (!smithyContext.selectedHttpAuthScheme) {
        throw new Error(failureReasons.join("\n"));
      }
      return next(args);
    };
  }
});

// node_modules/@smithy/property-provider/dist-cjs/index.js
var require_dist_cjs12 = __commonJS({
  "node_modules/@smithy/property-provider/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      CredentialsProviderError: () => CredentialsProviderError,
      ProviderError: () => ProviderError2,
      TokenProviderError: () => TokenProviderError,
      chain: () => chain,
      fromStatic: () => fromStatic,
      memoize: () => memoize
    });
    module2.exports = __toCommonJS2(src_exports);
    var _ProviderError = class _ProviderError2 extends Error {
      constructor(message, options = true) {
        var _a;
        let logger;
        let tryNextLink = true;
        if (typeof options === "boolean") {
          logger = void 0;
          tryNextLink = options;
        } else if (options != null && typeof options === "object") {
          logger = options.logger;
          tryNextLink = options.tryNextLink ?? true;
        }
        super(message);
        this.name = "ProviderError";
        this.tryNextLink = tryNextLink;
        Object.setPrototypeOf(this, _ProviderError2.prototype);
        (_a = logger == null ? void 0 : logger.debug) == null ? void 0 : _a.call(logger, `@smithy/property-provider ${tryNextLink ? "->" : "(!)"} ${message}`);
      }
      /**
       * @deprecated use new operator.
       */
      static from(error, options = true) {
        return Object.assign(new this(error.message, options), error);
      }
    };
    __name(_ProviderError, "ProviderError");
    var ProviderError2 = _ProviderError;
    var _CredentialsProviderError = class _CredentialsProviderError2 extends ProviderError2 {
      /**
       * @override
       */
      constructor(message, options = true) {
        super(message, options);
        this.name = "CredentialsProviderError";
        Object.setPrototypeOf(this, _CredentialsProviderError2.prototype);
      }
    };
    __name(_CredentialsProviderError, "CredentialsProviderError");
    var CredentialsProviderError = _CredentialsProviderError;
    var _TokenProviderError = class _TokenProviderError2 extends ProviderError2 {
      /**
       * @override
       */
      constructor(message, options = true) {
        super(message, options);
        this.name = "TokenProviderError";
        Object.setPrototypeOf(this, _TokenProviderError2.prototype);
      }
    };
    __name(_TokenProviderError, "TokenProviderError");
    var TokenProviderError = _TokenProviderError;
    var chain = /* @__PURE__ */ __name((...providers) => async () => {
      if (providers.length === 0) {
        throw new ProviderError2("No providers in chain");
      }
      let lastProviderError;
      for (const provider of providers) {
        try {
          const credentials = await provider();
          return credentials;
        } catch (err) {
          lastProviderError = err;
          if (err == null ? void 0 : err.tryNextLink) {
            continue;
          }
          throw err;
        }
      }
      throw lastProviderError;
    }, "chain");
    var fromStatic = /* @__PURE__ */ __name((staticValue) => () => Promise.resolve(staticValue), "fromStatic");
    var memoize = /* @__PURE__ */ __name((provider, isExpired, requiresRefresh) => {
      let resolved;
      let pending;
      let hasResult;
      let isConstant = false;
      const coalesceProvider = /* @__PURE__ */ __name(async () => {
        if (!pending) {
          pending = provider();
        }
        try {
          resolved = await pending;
          hasResult = true;
          isConstant = false;
        } finally {
          pending = void 0;
        }
        return resolved;
      }, "coalesceProvider");
      if (isExpired === void 0) {
        return async (options) => {
          if (!hasResult || (options == null ? void 0 : options.forceRefresh)) {
            resolved = await coalesceProvider();
          }
          return resolved;
        };
      }
      return async (options) => {
        if (!hasResult || (options == null ? void 0 : options.forceRefresh)) {
          resolved = await coalesceProvider();
        }
        if (isConstant) {
          return resolved;
        }
        if (requiresRefresh && !requiresRefresh(resolved)) {
          isConstant = true;
          return resolved;
        }
        if (isExpired(resolved)) {
          await coalesceProvider();
          return resolved;
        }
        return resolved;
      };
    }, "memoize");
  }
});

// node_modules/@smithy/shared-ini-file-loader/dist-cjs/getHomeDir.js
var require_getHomeDir = __commonJS({
  "node_modules/@smithy/shared-ini-file-loader/dist-cjs/getHomeDir.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getHomeDir = void 0;
    var os_1 = require("os");
    var path_1 = require("path");
    var homeDirCache = {};
    var getHomeDirCacheKey = () => {
      if (process && process.geteuid) {
        return `${process.geteuid()}`;
      }
      return "DEFAULT";
    };
    var getHomeDir2 = () => {
      const { HOME, USERPROFILE, HOMEPATH, HOMEDRIVE = `C:${path_1.sep}` } = process.env;
      if (HOME)
        return HOME;
      if (USERPROFILE)
        return USERPROFILE;
      if (HOMEPATH)
        return `${HOMEDRIVE}${HOMEPATH}`;
      const homeDirCacheKey = getHomeDirCacheKey();
      if (!homeDirCache[homeDirCacheKey])
        homeDirCache[homeDirCacheKey] = (0, os_1.homedir)();
      return homeDirCache[homeDirCacheKey];
    };
    exports2.getHomeDir = getHomeDir2;
  }
});

// node_modules/@smithy/shared-ini-file-loader/dist-cjs/getSSOTokenFilepath.js
var require_getSSOTokenFilepath = __commonJS({
  "node_modules/@smithy/shared-ini-file-loader/dist-cjs/getSSOTokenFilepath.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getSSOTokenFilepath = void 0;
    var crypto_1 = require("crypto");
    var path_1 = require("path");
    var getHomeDir_1 = require_getHomeDir();
    var getSSOTokenFilepath2 = (id) => {
      const hasher = (0, crypto_1.createHash)("sha1");
      const cacheName = hasher.update(id).digest("hex");
      return (0, path_1.join)((0, getHomeDir_1.getHomeDir)(), ".aws", "sso", "cache", `${cacheName}.json`);
    };
    exports2.getSSOTokenFilepath = getSSOTokenFilepath2;
  }
});

// node_modules/@smithy/shared-ini-file-loader/dist-cjs/getSSOTokenFromFile.js
var require_getSSOTokenFromFile = __commonJS({
  "node_modules/@smithy/shared-ini-file-loader/dist-cjs/getSSOTokenFromFile.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getSSOTokenFromFile = void 0;
    var fs_1 = require("fs");
    var getSSOTokenFilepath_1 = require_getSSOTokenFilepath();
    var { readFile } = fs_1.promises;
    var getSSOTokenFromFile2 = async (id) => {
      const ssoTokenFilepath = (0, getSSOTokenFilepath_1.getSSOTokenFilepath)(id);
      const ssoTokenText = await readFile(ssoTokenFilepath, "utf8");
      return JSON.parse(ssoTokenText);
    };
    exports2.getSSOTokenFromFile = getSSOTokenFromFile2;
  }
});

// node_modules/@smithy/shared-ini-file-loader/dist-cjs/slurpFile.js
var require_slurpFile = __commonJS({
  "node_modules/@smithy/shared-ini-file-loader/dist-cjs/slurpFile.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.slurpFile = void 0;
    var fs_1 = require("fs");
    var { readFile } = fs_1.promises;
    var filePromisesHash = {};
    var slurpFile = (path, options) => {
      if (!filePromisesHash[path] || (options === null || options === void 0 ? void 0 : options.ignoreCache)) {
        filePromisesHash[path] = readFile(path, "utf8");
      }
      return filePromisesHash[path];
    };
    exports2.slurpFile = slurpFile;
  }
});

// node_modules/@smithy/shared-ini-file-loader/dist-cjs/index.js
var require_dist_cjs13 = __commonJS({
  "node_modules/@smithy/shared-ini-file-loader/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __reExport = (target, mod, secondTarget) => (__copyProps2(target, mod, "default"), secondTarget && __copyProps2(secondTarget, mod, "default"));
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      CONFIG_PREFIX_SEPARATOR: () => CONFIG_PREFIX_SEPARATOR,
      DEFAULT_PROFILE: () => DEFAULT_PROFILE,
      ENV_PROFILE: () => ENV_PROFILE,
      getProfileName: () => getProfileName,
      loadSharedConfigFiles: () => loadSharedConfigFiles,
      loadSsoSessionData: () => loadSsoSessionData,
      parseKnownFiles: () => parseKnownFiles
    });
    module2.exports = __toCommonJS2(src_exports);
    __reExport(src_exports, require_getHomeDir(), module2.exports);
    var ENV_PROFILE = "AWS_PROFILE";
    var DEFAULT_PROFILE = "default";
    var getProfileName = /* @__PURE__ */ __name((init) => init.profile || process.env[ENV_PROFILE] || DEFAULT_PROFILE, "getProfileName");
    __reExport(src_exports, require_getSSOTokenFilepath(), module2.exports);
    __reExport(src_exports, require_getSSOTokenFromFile(), module2.exports);
    var import_types5 = require_dist_cjs();
    var getConfigData = /* @__PURE__ */ __name((data) => Object.entries(data).filter(([key]) => {
      const indexOfSeparator = key.indexOf(CONFIG_PREFIX_SEPARATOR);
      if (indexOfSeparator === -1) {
        return false;
      }
      return Object.values(import_types5.IniSectionType).includes(key.substring(0, indexOfSeparator));
    }).reduce(
      (acc, [key, value]) => {
        const indexOfSeparator = key.indexOf(CONFIG_PREFIX_SEPARATOR);
        const updatedKey = key.substring(0, indexOfSeparator) === import_types5.IniSectionType.PROFILE ? key.substring(indexOfSeparator + 1) : key;
        acc[updatedKey] = value;
        return acc;
      },
      {
        // Populate default profile, if present.
        ...data.default && { default: data.default }
      }
    ), "getConfigData");
    var import_path = require("path");
    var import_getHomeDir = require_getHomeDir();
    var ENV_CONFIG_PATH = "AWS_CONFIG_FILE";
    var getConfigFilepath = /* @__PURE__ */ __name(() => process.env[ENV_CONFIG_PATH] || (0, import_path.join)((0, import_getHomeDir.getHomeDir)(), ".aws", "config"), "getConfigFilepath");
    var import_getHomeDir2 = require_getHomeDir();
    var ENV_CREDENTIALS_PATH = "AWS_SHARED_CREDENTIALS_FILE";
    var getCredentialsFilepath = /* @__PURE__ */ __name(() => process.env[ENV_CREDENTIALS_PATH] || (0, import_path.join)((0, import_getHomeDir2.getHomeDir)(), ".aws", "credentials"), "getCredentialsFilepath");
    var import_getHomeDir3 = require_getHomeDir();
    var prefixKeyRegex = /^([\w-]+)\s(["'])?([\w-@\+\.%:/]+)\2$/;
    var profileNameBlockList = ["__proto__", "profile __proto__"];
    var parseIni = /* @__PURE__ */ __name((iniData) => {
      const map = {};
      let currentSection;
      let currentSubSection;
      for (const iniLine of iniData.split(/\r?\n/)) {
        const trimmedLine = iniLine.split(/(^|\s)[;#]/)[0].trim();
        const isSection = trimmedLine[0] === "[" && trimmedLine[trimmedLine.length - 1] === "]";
        if (isSection) {
          currentSection = void 0;
          currentSubSection = void 0;
          const sectionName = trimmedLine.substring(1, trimmedLine.length - 1);
          const matches = prefixKeyRegex.exec(sectionName);
          if (matches) {
            const [, prefix, , name] = matches;
            if (Object.values(import_types5.IniSectionType).includes(prefix)) {
              currentSection = [prefix, name].join(CONFIG_PREFIX_SEPARATOR);
            }
          } else {
            currentSection = sectionName;
          }
          if (profileNameBlockList.includes(sectionName)) {
            throw new Error(`Found invalid profile name "${sectionName}"`);
          }
        } else if (currentSection) {
          const indexOfEqualsSign = trimmedLine.indexOf("=");
          if (![0, -1].includes(indexOfEqualsSign)) {
            const [name, value] = [
              trimmedLine.substring(0, indexOfEqualsSign).trim(),
              trimmedLine.substring(indexOfEqualsSign + 1).trim()
            ];
            if (value === "") {
              currentSubSection = name;
            } else {
              if (currentSubSection && iniLine.trimStart() === iniLine) {
                currentSubSection = void 0;
              }
              map[currentSection] = map[currentSection] || {};
              const key = currentSubSection ? [currentSubSection, name].join(CONFIG_PREFIX_SEPARATOR) : name;
              map[currentSection][key] = value;
            }
          }
        }
      }
      return map;
    }, "parseIni");
    var import_slurpFile = require_slurpFile();
    var swallowError = /* @__PURE__ */ __name(() => ({}), "swallowError");
    var CONFIG_PREFIX_SEPARATOR = ".";
    var loadSharedConfigFiles = /* @__PURE__ */ __name(async (init = {}) => {
      const { filepath = getCredentialsFilepath(), configFilepath = getConfigFilepath() } = init;
      const homeDir = (0, import_getHomeDir3.getHomeDir)();
      const relativeHomeDirPrefix = "~/";
      let resolvedFilepath = filepath;
      if (filepath.startsWith(relativeHomeDirPrefix)) {
        resolvedFilepath = (0, import_path.join)(homeDir, filepath.slice(2));
      }
      let resolvedConfigFilepath = configFilepath;
      if (configFilepath.startsWith(relativeHomeDirPrefix)) {
        resolvedConfigFilepath = (0, import_path.join)(homeDir, configFilepath.slice(2));
      }
      const parsedFiles = await Promise.all([
        (0, import_slurpFile.slurpFile)(resolvedConfigFilepath, {
          ignoreCache: init.ignoreCache
        }).then(parseIni).then(getConfigData).catch(swallowError),
        (0, import_slurpFile.slurpFile)(resolvedFilepath, {
          ignoreCache: init.ignoreCache
        }).then(parseIni).catch(swallowError)
      ]);
      return {
        configFile: parsedFiles[0],
        credentialsFile: parsedFiles[1]
      };
    }, "loadSharedConfigFiles");
    var getSsoSessionData = /* @__PURE__ */ __name((data) => Object.entries(data).filter(([key]) => key.startsWith(import_types5.IniSectionType.SSO_SESSION + CONFIG_PREFIX_SEPARATOR)).reduce((acc, [key, value]) => ({ ...acc, [key.substring(key.indexOf(CONFIG_PREFIX_SEPARATOR) + 1)]: value }), {}), "getSsoSessionData");
    var import_slurpFile2 = require_slurpFile();
    var swallowError2 = /* @__PURE__ */ __name(() => ({}), "swallowError");
    var loadSsoSessionData = /* @__PURE__ */ __name(async (init = {}) => (0, import_slurpFile2.slurpFile)(init.configFilepath ?? getConfigFilepath()).then(parseIni).then(getSsoSessionData).catch(swallowError2), "loadSsoSessionData");
    var mergeConfigFiles = /* @__PURE__ */ __name((...files) => {
      const merged = {};
      for (const file of files) {
        for (const [key, values] of Object.entries(file)) {
          if (merged[key] !== void 0) {
            Object.assign(merged[key], values);
          } else {
            merged[key] = values;
          }
        }
      }
      return merged;
    }, "mergeConfigFiles");
    var parseKnownFiles = /* @__PURE__ */ __name(async (init) => {
      const parsedFiles = await loadSharedConfigFiles(init);
      return mergeConfigFiles(parsedFiles.configFile, parsedFiles.credentialsFile);
    }, "parseKnownFiles");
  }
});

// node_modules/@smithy/node-config-provider/dist-cjs/index.js
var require_dist_cjs14 = __commonJS({
  "node_modules/@smithy/node-config-provider/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      loadConfig: () => loadConfig
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_property_provider2 = require_dist_cjs12();
    function getSelectorName(functionString) {
      try {
        const constants = new Set(Array.from(functionString.match(/([A-Z_]){3,}/g) ?? []));
        constants.delete("CONFIG");
        constants.delete("CONFIG_PREFIX_SEPARATOR");
        constants.delete("ENV");
        return [...constants].join(", ");
      } catch (e) {
        return functionString;
      }
    }
    __name(getSelectorName, "getSelectorName");
    var fromEnv = /* @__PURE__ */ __name((envVarSelector, logger) => async () => {
      try {
        const config = envVarSelector(process.env);
        if (config === void 0) {
          throw new Error();
        }
        return config;
      } catch (e) {
        throw new import_property_provider2.CredentialsProviderError(
          e.message || `Not found in ENV: ${getSelectorName(envVarSelector.toString())}`,
          { logger }
        );
      }
    }, "fromEnv");
    var import_shared_ini_file_loader = require_dist_cjs13();
    var fromSharedConfigFiles = /* @__PURE__ */ __name((configSelector, { preferredFile = "config", ...init } = {}) => async () => {
      const profile = (0, import_shared_ini_file_loader.getProfileName)(init);
      const { configFile, credentialsFile } = await (0, import_shared_ini_file_loader.loadSharedConfigFiles)(init);
      const profileFromCredentials = credentialsFile[profile] || {};
      const profileFromConfig = configFile[profile] || {};
      const mergedProfile = preferredFile === "config" ? { ...profileFromCredentials, ...profileFromConfig } : { ...profileFromConfig, ...profileFromCredentials };
      try {
        const cfgFile = preferredFile === "config" ? configFile : credentialsFile;
        const configValue = configSelector(mergedProfile, cfgFile);
        if (configValue === void 0) {
          throw new Error();
        }
        return configValue;
      } catch (e) {
        throw new import_property_provider2.CredentialsProviderError(
          e.message || `Not found in config files w/ profile [${profile}]: ${getSelectorName(configSelector.toString())}`,
          { logger: init.logger }
        );
      }
    }, "fromSharedConfigFiles");
    var isFunction = /* @__PURE__ */ __name((func) => typeof func === "function", "isFunction");
    var fromStatic = /* @__PURE__ */ __name((defaultValue) => isFunction(defaultValue) ? async () => await defaultValue() : (0, import_property_provider2.fromStatic)(defaultValue), "fromStatic");
    var loadConfig = /* @__PURE__ */ __name(({ environmentVariableSelector, configFileSelector, default: defaultValue }, configuration = {}) => (0, import_property_provider2.memoize)(
      (0, import_property_provider2.chain)(
        fromEnv(environmentVariableSelector),
        fromSharedConfigFiles(configFileSelector, configuration),
        fromStatic(defaultValue)
      )
    ), "loadConfig");
  }
});

// node_modules/@smithy/middleware-endpoint/dist-cjs/adaptors/getEndpointUrlConfig.js
var require_getEndpointUrlConfig = __commonJS({
  "node_modules/@smithy/middleware-endpoint/dist-cjs/adaptors/getEndpointUrlConfig.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getEndpointUrlConfig = void 0;
    var shared_ini_file_loader_1 = require_dist_cjs13();
    var ENV_ENDPOINT_URL = "AWS_ENDPOINT_URL";
    var CONFIG_ENDPOINT_URL = "endpoint_url";
    var getEndpointUrlConfig = (serviceId) => ({
      environmentVariableSelector: (env) => {
        const serviceSuffixParts = serviceId.split(" ").map((w) => w.toUpperCase());
        const serviceEndpointUrl = env[[ENV_ENDPOINT_URL, ...serviceSuffixParts].join("_")];
        if (serviceEndpointUrl)
          return serviceEndpointUrl;
        const endpointUrl = env[ENV_ENDPOINT_URL];
        if (endpointUrl)
          return endpointUrl;
        return void 0;
      },
      configFileSelector: (profile, config) => {
        if (config && profile.services) {
          const servicesSection = config[["services", profile.services].join(shared_ini_file_loader_1.CONFIG_PREFIX_SEPARATOR)];
          if (servicesSection) {
            const servicePrefixParts = serviceId.split(" ").map((w) => w.toLowerCase());
            const endpointUrl2 = servicesSection[[servicePrefixParts.join("_"), CONFIG_ENDPOINT_URL].join(shared_ini_file_loader_1.CONFIG_PREFIX_SEPARATOR)];
            if (endpointUrl2)
              return endpointUrl2;
          }
        }
        const endpointUrl = profile[CONFIG_ENDPOINT_URL];
        if (endpointUrl)
          return endpointUrl;
        return void 0;
      },
      default: void 0
    });
    exports2.getEndpointUrlConfig = getEndpointUrlConfig;
  }
});

// node_modules/@smithy/middleware-endpoint/dist-cjs/adaptors/getEndpointFromConfig.js
var require_getEndpointFromConfig = __commonJS({
  "node_modules/@smithy/middleware-endpoint/dist-cjs/adaptors/getEndpointFromConfig.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getEndpointFromConfig = void 0;
    var node_config_provider_1 = require_dist_cjs14();
    var getEndpointUrlConfig_1 = require_getEndpointUrlConfig();
    var getEndpointFromConfig = async (serviceId) => (0, node_config_provider_1.loadConfig)((0, getEndpointUrlConfig_1.getEndpointUrlConfig)(serviceId))();
    exports2.getEndpointFromConfig = getEndpointFromConfig;
  }
});

// node_modules/@smithy/querystring-parser/dist-cjs/index.js
var require_dist_cjs15 = __commonJS({
  "node_modules/@smithy/querystring-parser/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      parseQueryString: () => parseQueryString
    });
    module2.exports = __toCommonJS2(src_exports);
    function parseQueryString(querystring) {
      const query2 = {};
      querystring = querystring.replace(/^\?/, "");
      if (querystring) {
        for (const pair of querystring.split("&")) {
          let [key, value = null] = pair.split("=");
          key = decodeURIComponent(key);
          if (value) {
            value = decodeURIComponent(value);
          }
          if (!(key in query2)) {
            query2[key] = value;
          } else if (Array.isArray(query2[key])) {
            query2[key].push(value);
          } else {
            query2[key] = [query2[key], value];
          }
        }
      }
      return query2;
    }
    __name(parseQueryString, "parseQueryString");
  }
});

// node_modules/@smithy/url-parser/dist-cjs/index.js
var require_dist_cjs16 = __commonJS({
  "node_modules/@smithy/url-parser/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      parseUrl: () => parseUrl
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_querystring_parser = require_dist_cjs15();
    var parseUrl = /* @__PURE__ */ __name((url) => {
      if (typeof url === "string") {
        return parseUrl(new URL(url));
      }
      const { hostname, pathname, port, protocol, search } = url;
      let query2;
      if (search) {
        query2 = (0, import_querystring_parser.parseQueryString)(search);
      }
      return {
        hostname,
        port: port ? parseInt(port) : void 0,
        protocol,
        path: pathname,
        query: query2
      };
    }, "parseUrl");
  }
});

// node_modules/@smithy/middleware-serde/dist-cjs/index.js
var require_dist_cjs17 = __commonJS({
  "node_modules/@smithy/middleware-serde/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      deserializerMiddleware: () => deserializerMiddleware,
      deserializerMiddlewareOption: () => deserializerMiddlewareOption,
      getSerdePlugin: () => getSerdePlugin,
      serializerMiddleware: () => serializerMiddleware,
      serializerMiddlewareOption: () => serializerMiddlewareOption2
    });
    module2.exports = __toCommonJS2(src_exports);
    var deserializerMiddleware = /* @__PURE__ */ __name((options, deserializer) => (next) => async (args) => {
      const { response } = await next(args);
      try {
        const parsed = await deserializer(response, options);
        return {
          response,
          output: parsed
        };
      } catch (error) {
        Object.defineProperty(error, "$response", {
          value: response
        });
        if (!("$metadata" in error)) {
          const hint = `Deserialization error: to see the raw response, inspect the hidden field {error}.$response on this object.`;
          error.message += "\n  " + hint;
          if (typeof error.$responseBodyText !== "undefined") {
            if (error.$response) {
              error.$response.body = error.$responseBodyText;
            }
          }
        }
        throw error;
      }
    }, "deserializerMiddleware");
    var serializerMiddleware = /* @__PURE__ */ __name((options, serializer) => (next, context) => async (args) => {
      var _a;
      const endpoint = ((_a = context.endpointV2) == null ? void 0 : _a.url) && options.urlParser ? async () => options.urlParser(context.endpointV2.url) : options.endpoint;
      if (!endpoint) {
        throw new Error("No valid endpoint provider available.");
      }
      const request = await serializer(args.input, { ...options, endpoint });
      return next({
        ...args,
        request
      });
    }, "serializerMiddleware");
    var deserializerMiddlewareOption = {
      name: "deserializerMiddleware",
      step: "deserialize",
      tags: ["DESERIALIZER"],
      override: true
    };
    var serializerMiddlewareOption2 = {
      name: "serializerMiddleware",
      step: "serialize",
      tags: ["SERIALIZER"],
      override: true
    };
    function getSerdePlugin(config, serializer, deserializer) {
      return {
        applyToStack: (commandStack) => {
          commandStack.add(deserializerMiddleware(config, deserializer), deserializerMiddlewareOption);
          commandStack.add(serializerMiddleware(config, serializer), serializerMiddlewareOption2);
        }
      };
    }
    __name(getSerdePlugin, "getSerdePlugin");
  }
});

// node_modules/@smithy/middleware-endpoint/dist-cjs/index.js
var require_dist_cjs18 = __commonJS({
  "node_modules/@smithy/middleware-endpoint/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      endpointMiddleware: () => endpointMiddleware,
      endpointMiddlewareOptions: () => endpointMiddlewareOptions2,
      getEndpointFromInstructions: () => getEndpointFromInstructions,
      getEndpointPlugin: () => getEndpointPlugin,
      resolveEndpointConfig: () => resolveEndpointConfig,
      resolveParams: () => resolveParams,
      toEndpointV1: () => toEndpointV1
    });
    module2.exports = __toCommonJS2(src_exports);
    var resolveParamsForS3 = /* @__PURE__ */ __name(async (endpointParams) => {
      const bucket = (endpointParams == null ? void 0 : endpointParams.Bucket) || "";
      if (typeof endpointParams.Bucket === "string") {
        endpointParams.Bucket = bucket.replace(/#/g, encodeURIComponent("#")).replace(/\?/g, encodeURIComponent("?"));
      }
      if (isArnBucketName(bucket)) {
        if (endpointParams.ForcePathStyle === true) {
          throw new Error("Path-style addressing cannot be used with ARN buckets");
        }
      } else if (!isDnsCompatibleBucketName(bucket) || bucket.indexOf(".") !== -1 && !String(endpointParams.Endpoint).startsWith("http:") || bucket.toLowerCase() !== bucket || bucket.length < 3) {
        endpointParams.ForcePathStyle = true;
      }
      if (endpointParams.DisableMultiRegionAccessPoints) {
        endpointParams.disableMultiRegionAccessPoints = true;
        endpointParams.DisableMRAP = true;
      }
      return endpointParams;
    }, "resolveParamsForS3");
    var DOMAIN_PATTERN = /^[a-z0-9][a-z0-9\.\-]{1,61}[a-z0-9]$/;
    var IP_ADDRESS_PATTERN = /(\d+\.){3}\d+/;
    var DOTS_PATTERN = /\.\./;
    var isDnsCompatibleBucketName = /* @__PURE__ */ __name((bucketName) => DOMAIN_PATTERN.test(bucketName) && !IP_ADDRESS_PATTERN.test(bucketName) && !DOTS_PATTERN.test(bucketName), "isDnsCompatibleBucketName");
    var isArnBucketName = /* @__PURE__ */ __name((bucketName) => {
      const [arn, partition, service, , , bucket] = bucketName.split(":");
      const isArn = arn === "arn" && bucketName.split(":").length >= 6;
      const isValidArn = Boolean(isArn && partition && service && bucket);
      if (isArn && !isValidArn) {
        throw new Error(`Invalid ARN: ${bucketName} was an invalid ARN.`);
      }
      return isValidArn;
    }, "isArnBucketName");
    var createConfigValueProvider = /* @__PURE__ */ __name((configKey, canonicalEndpointParamKey, config) => {
      const configProvider = /* @__PURE__ */ __name(async () => {
        const configValue = config[configKey] ?? config[canonicalEndpointParamKey];
        if (typeof configValue === "function") {
          return configValue();
        }
        return configValue;
      }, "configProvider");
      if (configKey === "credentialScope" || canonicalEndpointParamKey === "CredentialScope") {
        return async () => {
          const credentials = typeof config.credentials === "function" ? await config.credentials() : config.credentials;
          const configValue = (credentials == null ? void 0 : credentials.credentialScope) ?? (credentials == null ? void 0 : credentials.CredentialScope);
          return configValue;
        };
      }
      if (configKey === "accountId" || canonicalEndpointParamKey === "AccountId") {
        return async () => {
          const credentials = typeof config.credentials === "function" ? await config.credentials() : config.credentials;
          const configValue = (credentials == null ? void 0 : credentials.accountId) ?? (credentials == null ? void 0 : credentials.AccountId);
          return configValue;
        };
      }
      if (configKey === "endpoint" || canonicalEndpointParamKey === "endpoint") {
        return async () => {
          const endpoint = await configProvider();
          if (endpoint && typeof endpoint === "object") {
            if ("url" in endpoint) {
              return endpoint.url.href;
            }
            if ("hostname" in endpoint) {
              const { protocol, hostname, port, path } = endpoint;
              return `${protocol}//${hostname}${port ? ":" + port : ""}${path}`;
            }
          }
          return endpoint;
        };
      }
      return configProvider;
    }, "createConfigValueProvider");
    var import_getEndpointFromConfig = require_getEndpointFromConfig();
    var import_url_parser = require_dist_cjs16();
    var toEndpointV1 = /* @__PURE__ */ __name((endpoint) => {
      if (typeof endpoint === "object") {
        if ("url" in endpoint) {
          return (0, import_url_parser.parseUrl)(endpoint.url);
        }
        return endpoint;
      }
      return (0, import_url_parser.parseUrl)(endpoint);
    }, "toEndpointV1");
    var getEndpointFromInstructions = /* @__PURE__ */ __name(async (commandInput, instructionsSupplier, clientConfig, context) => {
      if (!clientConfig.endpoint) {
        const endpointFromConfig = await (0, import_getEndpointFromConfig.getEndpointFromConfig)(clientConfig.serviceId || "");
        if (endpointFromConfig) {
          clientConfig.endpoint = () => Promise.resolve(toEndpointV1(endpointFromConfig));
        }
      }
      const endpointParams = await resolveParams(commandInput, instructionsSupplier, clientConfig);
      if (typeof clientConfig.endpointProvider !== "function") {
        throw new Error("config.endpointProvider is not set.");
      }
      const endpoint = clientConfig.endpointProvider(endpointParams, context);
      return endpoint;
    }, "getEndpointFromInstructions");
    var resolveParams = /* @__PURE__ */ __name(async (commandInput, instructionsSupplier, clientConfig) => {
      var _a;
      const endpointParams = {};
      const instructions = ((_a = instructionsSupplier == null ? void 0 : instructionsSupplier.getEndpointParameterInstructions) == null ? void 0 : _a.call(instructionsSupplier)) || {};
      for (const [name, instruction] of Object.entries(instructions)) {
        switch (instruction.type) {
          case "staticContextParams":
            endpointParams[name] = instruction.value;
            break;
          case "contextParams":
            endpointParams[name] = commandInput[instruction.name];
            break;
          case "clientContextParams":
          case "builtInParams":
            endpointParams[name] = await createConfigValueProvider(instruction.name, name, clientConfig)();
            break;
          default:
            throw new Error("Unrecognized endpoint parameter instruction: " + JSON.stringify(instruction));
        }
      }
      if (Object.keys(instructions).length === 0) {
        Object.assign(endpointParams, clientConfig);
      }
      if (String(clientConfig.serviceId).toLowerCase() === "s3") {
        await resolveParamsForS3(endpointParams);
      }
      return endpointParams;
    }, "resolveParams");
    var import_util_middleware3 = require_dist_cjs10();
    var endpointMiddleware = /* @__PURE__ */ __name(({
      config,
      instructions
    }) => {
      return (next, context) => async (args) => {
        var _a, _b, _c;
        const endpoint = await getEndpointFromInstructions(
          args.input,
          {
            getEndpointParameterInstructions() {
              return instructions;
            }
          },
          { ...config },
          context
        );
        context.endpointV2 = endpoint;
        context.authSchemes = (_a = endpoint.properties) == null ? void 0 : _a.authSchemes;
        const authScheme = (_b = context.authSchemes) == null ? void 0 : _b[0];
        if (authScheme) {
          context["signing_region"] = authScheme.signingRegion;
          context["signing_service"] = authScheme.signingName;
          const smithyContext = (0, import_util_middleware3.getSmithyContext)(context);
          const httpAuthOption = (_c = smithyContext == null ? void 0 : smithyContext.selectedHttpAuthScheme) == null ? void 0 : _c.httpAuthOption;
          if (httpAuthOption) {
            httpAuthOption.signingProperties = Object.assign(
              httpAuthOption.signingProperties || {},
              {
                signing_region: authScheme.signingRegion,
                signingRegion: authScheme.signingRegion,
                signing_service: authScheme.signingName,
                signingName: authScheme.signingName,
                signingRegionSet: authScheme.signingRegionSet
              },
              authScheme.properties
            );
          }
        }
        return next({
          ...args
        });
      };
    }, "endpointMiddleware");
    var import_middleware_serde2 = require_dist_cjs17();
    var endpointMiddlewareOptions2 = {
      step: "serialize",
      tags: ["ENDPOINT_PARAMETERS", "ENDPOINT_V2", "ENDPOINT"],
      name: "endpointV2Middleware",
      override: true,
      relation: "before",
      toMiddleware: import_middleware_serde2.serializerMiddlewareOption.name
    };
    var getEndpointPlugin = /* @__PURE__ */ __name((config, instructions) => ({
      applyToStack: (clientStack) => {
        clientStack.addRelativeTo(
          endpointMiddleware({
            config,
            instructions
          }),
          endpointMiddlewareOptions2
        );
      }
    }), "getEndpointPlugin");
    var resolveEndpointConfig = /* @__PURE__ */ __name((input) => {
      const tls = input.tls ?? true;
      const { endpoint } = input;
      const customEndpointProvider = endpoint != null ? async () => toEndpointV1(await (0, import_util_middleware3.normalizeProvider)(endpoint)()) : void 0;
      const isCustomEndpoint = !!endpoint;
      return {
        ...input,
        endpoint: customEndpointProvider,
        tls,
        isCustomEndpoint,
        useDualstackEndpoint: (0, import_util_middleware3.normalizeProvider)(input.useDualstackEndpoint ?? false),
        useFipsEndpoint: (0, import_util_middleware3.normalizeProvider)(input.useFipsEndpoint ?? false)
      };
    }, "resolveEndpointConfig");
  }
});

// node_modules/@smithy/core/dist-es/middleware-http-auth-scheme/getHttpAuthSchemeEndpointRuleSetPlugin.js
var import_middleware_endpoint, httpAuthSchemeEndpointRuleSetMiddlewareOptions, getHttpAuthSchemeEndpointRuleSetPlugin;
var init_getHttpAuthSchemeEndpointRuleSetPlugin = __esm({
  "node_modules/@smithy/core/dist-es/middleware-http-auth-scheme/getHttpAuthSchemeEndpointRuleSetPlugin.js"() {
    import_middleware_endpoint = __toESM(require_dist_cjs18());
    init_httpAuthSchemeMiddleware();
    httpAuthSchemeEndpointRuleSetMiddlewareOptions = {
      step: "serialize",
      tags: ["HTTP_AUTH_SCHEME"],
      name: "httpAuthSchemeMiddleware",
      override: true,
      relation: "before",
      toMiddleware: import_middleware_endpoint.endpointMiddlewareOptions.name
    };
    getHttpAuthSchemeEndpointRuleSetPlugin = (config, { httpAuthSchemeParametersProvider, identityProviderConfigProvider }) => ({
      applyToStack: (clientStack) => {
        clientStack.addRelativeTo(httpAuthSchemeMiddleware(config, {
          httpAuthSchemeParametersProvider,
          identityProviderConfigProvider
        }), httpAuthSchemeEndpointRuleSetMiddlewareOptions);
      }
    });
  }
});

// node_modules/@smithy/core/dist-es/middleware-http-auth-scheme/getHttpAuthSchemePlugin.js
var import_middleware_serde, httpAuthSchemeMiddlewareOptions, getHttpAuthSchemePlugin;
var init_getHttpAuthSchemePlugin = __esm({
  "node_modules/@smithy/core/dist-es/middleware-http-auth-scheme/getHttpAuthSchemePlugin.js"() {
    import_middleware_serde = __toESM(require_dist_cjs17());
    init_httpAuthSchemeMiddleware();
    httpAuthSchemeMiddlewareOptions = {
      step: "serialize",
      tags: ["HTTP_AUTH_SCHEME"],
      name: "httpAuthSchemeMiddleware",
      override: true,
      relation: "before",
      toMiddleware: import_middleware_serde.serializerMiddlewareOption.name
    };
    getHttpAuthSchemePlugin = (config, { httpAuthSchemeParametersProvider, identityProviderConfigProvider }) => ({
      applyToStack: (clientStack) => {
        clientStack.addRelativeTo(httpAuthSchemeMiddleware(config, {
          httpAuthSchemeParametersProvider,
          identityProviderConfigProvider
        }), httpAuthSchemeMiddlewareOptions);
      }
    });
  }
});

// node_modules/@smithy/core/dist-es/middleware-http-auth-scheme/index.js
var init_middleware_http_auth_scheme = __esm({
  "node_modules/@smithy/core/dist-es/middleware-http-auth-scheme/index.js"() {
    init_httpAuthSchemeMiddleware();
    init_getHttpAuthSchemeEndpointRuleSetPlugin();
    init_getHttpAuthSchemePlugin();
  }
});

// node_modules/@smithy/core/dist-es/middleware-http-signing/httpSigningMiddleware.js
var import_protocol_http, import_types2, import_util_middleware2, defaultErrorHandler, defaultSuccessHandler, httpSigningMiddleware;
var init_httpSigningMiddleware = __esm({
  "node_modules/@smithy/core/dist-es/middleware-http-signing/httpSigningMiddleware.js"() {
    import_protocol_http = __toESM(require_dist_cjs2());
    import_types2 = __toESM(require_dist_cjs());
    import_util_middleware2 = __toESM(require_dist_cjs10());
    defaultErrorHandler = (signingProperties) => (error) => {
      throw error;
    };
    defaultSuccessHandler = (httpResponse, signingProperties) => {
    };
    httpSigningMiddleware = (config) => (next, context) => async (args) => {
      if (!import_protocol_http.HttpRequest.isInstance(args.request)) {
        return next(args);
      }
      const smithyContext = (0, import_util_middleware2.getSmithyContext)(context);
      const scheme = smithyContext.selectedHttpAuthScheme;
      if (!scheme) {
        throw new Error(`No HttpAuthScheme was selected: unable to sign request`);
      }
      const { httpAuthOption: { signingProperties = {} }, identity, signer } = scheme;
      const output = await next({
        ...args,
        request: await signer.sign(args.request, identity, signingProperties)
      }).catch((signer.errorHandler || defaultErrorHandler)(signingProperties));
      (signer.successHandler || defaultSuccessHandler)(output.response, signingProperties);
      return output;
    };
  }
});

// node_modules/uuid/dist/esm-node/rng.js
function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    import_crypto.default.randomFillSync(rnds8Pool);
    poolPtr = 0;
  }
  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}
var import_crypto, rnds8Pool, poolPtr;
var init_rng = __esm({
  "node_modules/uuid/dist/esm-node/rng.js"() {
    import_crypto = __toESM(require("crypto"));
    rnds8Pool = new Uint8Array(256);
    poolPtr = rnds8Pool.length;
  }
});

// node_modules/uuid/dist/esm-node/regex.js
var regex_default;
var init_regex = __esm({
  "node_modules/uuid/dist/esm-node/regex.js"() {
    regex_default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
  }
});

// node_modules/uuid/dist/esm-node/validate.js
function validate(uuid) {
  return typeof uuid === "string" && regex_default.test(uuid);
}
var validate_default;
var init_validate = __esm({
  "node_modules/uuid/dist/esm-node/validate.js"() {
    init_regex();
    validate_default = validate;
  }
});

// node_modules/uuid/dist/esm-node/stringify.js
function unsafeStringify(arr, offset = 0) {
  return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
}
function stringify(arr, offset = 0) {
  const uuid = unsafeStringify(arr, offset);
  if (!validate_default(uuid)) {
    throw TypeError("Stringified UUID is invalid");
  }
  return uuid;
}
var byteToHex, stringify_default;
var init_stringify = __esm({
  "node_modules/uuid/dist/esm-node/stringify.js"() {
    init_validate();
    byteToHex = [];
    for (let i = 0; i < 256; ++i) {
      byteToHex.push((i + 256).toString(16).slice(1));
    }
    stringify_default = stringify;
  }
});

// node_modules/uuid/dist/esm-node/v1.js
function v1(options, buf, offset) {
  let i = buf && offset || 0;
  const b = buf || new Array(16);
  options = options || {};
  let node = options.node || _nodeId;
  let clockseq = options.clockseq !== void 0 ? options.clockseq : _clockseq;
  if (node == null || clockseq == null) {
    const seedBytes = options.random || (options.rng || rng)();
    if (node == null) {
      node = _nodeId = [seedBytes[0] | 1, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
    }
    if (clockseq == null) {
      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 16383;
    }
  }
  let msecs = options.msecs !== void 0 ? options.msecs : Date.now();
  let nsecs = options.nsecs !== void 0 ? options.nsecs : _lastNSecs + 1;
  const dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 1e4;
  if (dt < 0 && options.clockseq === void 0) {
    clockseq = clockseq + 1 & 16383;
  }
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === void 0) {
    nsecs = 0;
  }
  if (nsecs >= 1e4) {
    throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
  }
  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;
  msecs += 122192928e5;
  const tl = ((msecs & 268435455) * 1e4 + nsecs) % 4294967296;
  b[i++] = tl >>> 24 & 255;
  b[i++] = tl >>> 16 & 255;
  b[i++] = tl >>> 8 & 255;
  b[i++] = tl & 255;
  const tmh = msecs / 4294967296 * 1e4 & 268435455;
  b[i++] = tmh >>> 8 & 255;
  b[i++] = tmh & 255;
  b[i++] = tmh >>> 24 & 15 | 16;
  b[i++] = tmh >>> 16 & 255;
  b[i++] = clockseq >>> 8 | 128;
  b[i++] = clockseq & 255;
  for (let n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }
  return buf || unsafeStringify(b);
}
var _nodeId, _clockseq, _lastMSecs, _lastNSecs, v1_default;
var init_v1 = __esm({
  "node_modules/uuid/dist/esm-node/v1.js"() {
    init_rng();
    init_stringify();
    _lastMSecs = 0;
    _lastNSecs = 0;
    v1_default = v1;
  }
});

// node_modules/uuid/dist/esm-node/parse.js
function parse(uuid) {
  if (!validate_default(uuid)) {
    throw TypeError("Invalid UUID");
  }
  let v;
  const arr = new Uint8Array(16);
  arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
  arr[1] = v >>> 16 & 255;
  arr[2] = v >>> 8 & 255;
  arr[3] = v & 255;
  arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
  arr[5] = v & 255;
  arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
  arr[7] = v & 255;
  arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
  arr[9] = v & 255;
  arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 1099511627776 & 255;
  arr[11] = v / 4294967296 & 255;
  arr[12] = v >>> 24 & 255;
  arr[13] = v >>> 16 & 255;
  arr[14] = v >>> 8 & 255;
  arr[15] = v & 255;
  return arr;
}
var parse_default;
var init_parse = __esm({
  "node_modules/uuid/dist/esm-node/parse.js"() {
    init_validate();
    parse_default = parse;
  }
});

// node_modules/uuid/dist/esm-node/v35.js
function stringToBytes(str) {
  str = unescape(encodeURIComponent(str));
  const bytes = [];
  for (let i = 0; i < str.length; ++i) {
    bytes.push(str.charCodeAt(i));
  }
  return bytes;
}
function v35(name, version2, hashfunc) {
  function generateUUID(value, namespace, buf, offset) {
    var _namespace;
    if (typeof value === "string") {
      value = stringToBytes(value);
    }
    if (typeof namespace === "string") {
      namespace = parse_default(namespace);
    }
    if (((_namespace = namespace) === null || _namespace === void 0 ? void 0 : _namespace.length) !== 16) {
      throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");
    }
    let bytes = new Uint8Array(16 + value.length);
    bytes.set(namespace);
    bytes.set(value, namespace.length);
    bytes = hashfunc(bytes);
    bytes[6] = bytes[6] & 15 | version2;
    bytes[8] = bytes[8] & 63 | 128;
    if (buf) {
      offset = offset || 0;
      for (let i = 0; i < 16; ++i) {
        buf[offset + i] = bytes[i];
      }
      return buf;
    }
    return unsafeStringify(bytes);
  }
  try {
    generateUUID.name = name;
  } catch (err) {
  }
  generateUUID.DNS = DNS;
  generateUUID.URL = URL2;
  return generateUUID;
}
var DNS, URL2;
var init_v35 = __esm({
  "node_modules/uuid/dist/esm-node/v35.js"() {
    init_stringify();
    init_parse();
    DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
    URL2 = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
  }
});

// node_modules/uuid/dist/esm-node/md5.js
function md5(bytes) {
  if (Array.isArray(bytes)) {
    bytes = Buffer.from(bytes);
  } else if (typeof bytes === "string") {
    bytes = Buffer.from(bytes, "utf8");
  }
  return import_crypto2.default.createHash("md5").update(bytes).digest();
}
var import_crypto2, md5_default;
var init_md5 = __esm({
  "node_modules/uuid/dist/esm-node/md5.js"() {
    import_crypto2 = __toESM(require("crypto"));
    md5_default = md5;
  }
});

// node_modules/uuid/dist/esm-node/v3.js
var v3, v3_default;
var init_v3 = __esm({
  "node_modules/uuid/dist/esm-node/v3.js"() {
    init_v35();
    init_md5();
    v3 = v35("v3", 48, md5_default);
    v3_default = v3;
  }
});

// node_modules/uuid/dist/esm-node/native.js
var import_crypto3, native_default;
var init_native = __esm({
  "node_modules/uuid/dist/esm-node/native.js"() {
    import_crypto3 = __toESM(require("crypto"));
    native_default = {
      randomUUID: import_crypto3.default.randomUUID
    };
  }
});

// node_modules/uuid/dist/esm-node/v4.js
function v4(options, buf, offset) {
  if (native_default.randomUUID && !buf && !options) {
    return native_default.randomUUID();
  }
  options = options || {};
  const rnds = options.random || (options.rng || rng)();
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
var v4_default;
var init_v4 = __esm({
  "node_modules/uuid/dist/esm-node/v4.js"() {
    init_native();
    init_rng();
    init_stringify();
    v4_default = v4;
  }
});

// node_modules/uuid/dist/esm-node/sha1.js
function sha1(bytes) {
  if (Array.isArray(bytes)) {
    bytes = Buffer.from(bytes);
  } else if (typeof bytes === "string") {
    bytes = Buffer.from(bytes, "utf8");
  }
  return import_crypto4.default.createHash("sha1").update(bytes).digest();
}
var import_crypto4, sha1_default;
var init_sha1 = __esm({
  "node_modules/uuid/dist/esm-node/sha1.js"() {
    import_crypto4 = __toESM(require("crypto"));
    sha1_default = sha1;
  }
});

// node_modules/uuid/dist/esm-node/v5.js
var v5, v5_default;
var init_v5 = __esm({
  "node_modules/uuid/dist/esm-node/v5.js"() {
    init_v35();
    init_sha1();
    v5 = v35("v5", 80, sha1_default);
    v5_default = v5;
  }
});

// node_modules/uuid/dist/esm-node/nil.js
var nil_default;
var init_nil = __esm({
  "node_modules/uuid/dist/esm-node/nil.js"() {
    nil_default = "00000000-0000-0000-0000-000000000000";
  }
});

// node_modules/uuid/dist/esm-node/version.js
function version(uuid) {
  if (!validate_default(uuid)) {
    throw TypeError("Invalid UUID");
  }
  return parseInt(uuid.slice(14, 15), 16);
}
var version_default;
var init_version = __esm({
  "node_modules/uuid/dist/esm-node/version.js"() {
    init_validate();
    version_default = version;
  }
});

// node_modules/uuid/dist/esm-node/index.js
var esm_node_exports = {};
__export(esm_node_exports, {
  NIL: () => nil_default,
  parse: () => parse_default,
  stringify: () => stringify_default,
  v1: () => v1_default,
  v3: () => v3_default,
  v4: () => v4_default,
  v5: () => v5_default,
  validate: () => validate_default,
  version: () => version_default
});
var init_esm_node = __esm({
  "node_modules/uuid/dist/esm-node/index.js"() {
    init_v1();
    init_v3();
    init_v4();
    init_v5();
    init_nil();
    init_version();
    init_validate();
    init_stringify();
    init_parse();
  }
});

// node_modules/@smithy/service-error-classification/dist-cjs/index.js
var require_dist_cjs19 = __commonJS({
  "node_modules/@smithy/service-error-classification/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      isClockSkewCorrectedError: () => isClockSkewCorrectedError,
      isClockSkewError: () => isClockSkewError,
      isRetryableByTrait: () => isRetryableByTrait,
      isServerError: () => isServerError,
      isThrottlingError: () => isThrottlingError,
      isTransientError: () => isTransientError
    });
    module2.exports = __toCommonJS2(src_exports);
    var CLOCK_SKEW_ERROR_CODES = [
      "AuthFailure",
      "InvalidSignatureException",
      "RequestExpired",
      "RequestInTheFuture",
      "RequestTimeTooSkewed",
      "SignatureDoesNotMatch"
    ];
    var THROTTLING_ERROR_CODES = [
      "BandwidthLimitExceeded",
      "EC2ThrottledException",
      "LimitExceededException",
      "PriorRequestNotComplete",
      "ProvisionedThroughputExceededException",
      "RequestLimitExceeded",
      "RequestThrottled",
      "RequestThrottledException",
      "SlowDown",
      "ThrottledException",
      "Throttling",
      "ThrottlingException",
      "TooManyRequestsException",
      "TransactionInProgressException"
      // DynamoDB
    ];
    var TRANSIENT_ERROR_CODES = ["TimeoutError", "RequestTimeout", "RequestTimeoutException"];
    var TRANSIENT_ERROR_STATUS_CODES = [500, 502, 503, 504];
    var NODEJS_TIMEOUT_ERROR_CODES = ["ECONNRESET", "ECONNREFUSED", "EPIPE", "ETIMEDOUT"];
    var isRetryableByTrait = /* @__PURE__ */ __name((error) => error.$retryable !== void 0, "isRetryableByTrait");
    var isClockSkewError = /* @__PURE__ */ __name((error) => CLOCK_SKEW_ERROR_CODES.includes(error.name), "isClockSkewError");
    var isClockSkewCorrectedError = /* @__PURE__ */ __name((error) => {
      var _a;
      return (_a = error.$metadata) == null ? void 0 : _a.clockSkewCorrected;
    }, "isClockSkewCorrectedError");
    var isThrottlingError = /* @__PURE__ */ __name((error) => {
      var _a, _b;
      return ((_a = error.$metadata) == null ? void 0 : _a.httpStatusCode) === 429 || THROTTLING_ERROR_CODES.includes(error.name) || ((_b = error.$retryable) == null ? void 0 : _b.throttling) == true;
    }, "isThrottlingError");
    var isTransientError = /* @__PURE__ */ __name((error) => {
      var _a;
      return isClockSkewCorrectedError(error) || TRANSIENT_ERROR_CODES.includes(error.name) || NODEJS_TIMEOUT_ERROR_CODES.includes((error == null ? void 0 : error.code) || "") || TRANSIENT_ERROR_STATUS_CODES.includes(((_a = error.$metadata) == null ? void 0 : _a.httpStatusCode) || 0);
    }, "isTransientError");
    var isServerError = /* @__PURE__ */ __name((error) => {
      var _a;
      if (((_a = error.$metadata) == null ? void 0 : _a.httpStatusCode) !== void 0) {
        const statusCode = error.$metadata.httpStatusCode;
        if (500 <= statusCode && statusCode <= 599 && !isTransientError(error)) {
          return true;
        }
        return false;
      }
      return false;
    }, "isServerError");
  }
});

// node_modules/@smithy/util-retry/dist-cjs/index.js
var require_dist_cjs20 = __commonJS({
  "node_modules/@smithy/util-retry/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      AdaptiveRetryStrategy: () => AdaptiveRetryStrategy,
      ConfiguredRetryStrategy: () => ConfiguredRetryStrategy,
      DEFAULT_MAX_ATTEMPTS: () => DEFAULT_MAX_ATTEMPTS,
      DEFAULT_RETRY_DELAY_BASE: () => DEFAULT_RETRY_DELAY_BASE,
      DEFAULT_RETRY_MODE: () => DEFAULT_RETRY_MODE,
      DefaultRateLimiter: () => DefaultRateLimiter,
      INITIAL_RETRY_TOKENS: () => INITIAL_RETRY_TOKENS,
      INVOCATION_ID_HEADER: () => INVOCATION_ID_HEADER,
      MAXIMUM_RETRY_DELAY: () => MAXIMUM_RETRY_DELAY,
      NO_RETRY_INCREMENT: () => NO_RETRY_INCREMENT,
      REQUEST_HEADER: () => REQUEST_HEADER,
      RETRY_COST: () => RETRY_COST,
      RETRY_MODES: () => RETRY_MODES,
      StandardRetryStrategy: () => StandardRetryStrategy,
      THROTTLING_RETRY_DELAY_BASE: () => THROTTLING_RETRY_DELAY_BASE,
      TIMEOUT_RETRY_COST: () => TIMEOUT_RETRY_COST
    });
    module2.exports = __toCommonJS2(src_exports);
    var RETRY_MODES = /* @__PURE__ */ ((RETRY_MODES2) => {
      RETRY_MODES2["STANDARD"] = "standard";
      RETRY_MODES2["ADAPTIVE"] = "adaptive";
      return RETRY_MODES2;
    })(RETRY_MODES || {});
    var DEFAULT_MAX_ATTEMPTS = 3;
    var DEFAULT_RETRY_MODE = "standard";
    var import_service_error_classification = require_dist_cjs19();
    var _DefaultRateLimiter = class _DefaultRateLimiter {
      constructor(options) {
        this.currentCapacity = 0;
        this.enabled = false;
        this.lastMaxRate = 0;
        this.measuredTxRate = 0;
        this.requestCount = 0;
        this.lastTimestamp = 0;
        this.timeWindow = 0;
        this.beta = (options == null ? void 0 : options.beta) ?? 0.7;
        this.minCapacity = (options == null ? void 0 : options.minCapacity) ?? 1;
        this.minFillRate = (options == null ? void 0 : options.minFillRate) ?? 0.5;
        this.scaleConstant = (options == null ? void 0 : options.scaleConstant) ?? 0.4;
        this.smooth = (options == null ? void 0 : options.smooth) ?? 0.8;
        const currentTimeInSeconds = this.getCurrentTimeInSeconds();
        this.lastThrottleTime = currentTimeInSeconds;
        this.lastTxRateBucket = Math.floor(this.getCurrentTimeInSeconds());
        this.fillRate = this.minFillRate;
        this.maxCapacity = this.minCapacity;
      }
      getCurrentTimeInSeconds() {
        return Date.now() / 1e3;
      }
      async getSendToken() {
        return this.acquireTokenBucket(1);
      }
      async acquireTokenBucket(amount) {
        if (!this.enabled) {
          return;
        }
        this.refillTokenBucket();
        if (amount > this.currentCapacity) {
          const delay = (amount - this.currentCapacity) / this.fillRate * 1e3;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
        this.currentCapacity = this.currentCapacity - amount;
      }
      refillTokenBucket() {
        const timestamp = this.getCurrentTimeInSeconds();
        if (!this.lastTimestamp) {
          this.lastTimestamp = timestamp;
          return;
        }
        const fillAmount = (timestamp - this.lastTimestamp) * this.fillRate;
        this.currentCapacity = Math.min(this.maxCapacity, this.currentCapacity + fillAmount);
        this.lastTimestamp = timestamp;
      }
      updateClientSendingRate(response) {
        let calculatedRate;
        this.updateMeasuredRate();
        if ((0, import_service_error_classification.isThrottlingError)(response)) {
          const rateToUse = !this.enabled ? this.measuredTxRate : Math.min(this.measuredTxRate, this.fillRate);
          this.lastMaxRate = rateToUse;
          this.calculateTimeWindow();
          this.lastThrottleTime = this.getCurrentTimeInSeconds();
          calculatedRate = this.cubicThrottle(rateToUse);
          this.enableTokenBucket();
        } else {
          this.calculateTimeWindow();
          calculatedRate = this.cubicSuccess(this.getCurrentTimeInSeconds());
        }
        const newRate = Math.min(calculatedRate, 2 * this.measuredTxRate);
        this.updateTokenBucketRate(newRate);
      }
      calculateTimeWindow() {
        this.timeWindow = this.getPrecise(Math.pow(this.lastMaxRate * (1 - this.beta) / this.scaleConstant, 1 / 3));
      }
      cubicThrottle(rateToUse) {
        return this.getPrecise(rateToUse * this.beta);
      }
      cubicSuccess(timestamp) {
        return this.getPrecise(
          this.scaleConstant * Math.pow(timestamp - this.lastThrottleTime - this.timeWindow, 3) + this.lastMaxRate
        );
      }
      enableTokenBucket() {
        this.enabled = true;
      }
      updateTokenBucketRate(newRate) {
        this.refillTokenBucket();
        this.fillRate = Math.max(newRate, this.minFillRate);
        this.maxCapacity = Math.max(newRate, this.minCapacity);
        this.currentCapacity = Math.min(this.currentCapacity, this.maxCapacity);
      }
      updateMeasuredRate() {
        const t = this.getCurrentTimeInSeconds();
        const timeBucket = Math.floor(t * 2) / 2;
        this.requestCount++;
        if (timeBucket > this.lastTxRateBucket) {
          const currentRate = this.requestCount / (timeBucket - this.lastTxRateBucket);
          this.measuredTxRate = this.getPrecise(currentRate * this.smooth + this.measuredTxRate * (1 - this.smooth));
          this.requestCount = 0;
          this.lastTxRateBucket = timeBucket;
        }
      }
      getPrecise(num) {
        return parseFloat(num.toFixed(8));
      }
    };
    __name(_DefaultRateLimiter, "DefaultRateLimiter");
    var DefaultRateLimiter = _DefaultRateLimiter;
    var DEFAULT_RETRY_DELAY_BASE = 100;
    var MAXIMUM_RETRY_DELAY = 20 * 1e3;
    var THROTTLING_RETRY_DELAY_BASE = 500;
    var INITIAL_RETRY_TOKENS = 500;
    var RETRY_COST = 5;
    var TIMEOUT_RETRY_COST = 10;
    var NO_RETRY_INCREMENT = 1;
    var INVOCATION_ID_HEADER = "amz-sdk-invocation-id";
    var REQUEST_HEADER = "amz-sdk-request";
    var getDefaultRetryBackoffStrategy = /* @__PURE__ */ __name(() => {
      let delayBase = DEFAULT_RETRY_DELAY_BASE;
      const computeNextBackoffDelay = /* @__PURE__ */ __name((attempts) => {
        return Math.floor(Math.min(MAXIMUM_RETRY_DELAY, Math.random() * 2 ** attempts * delayBase));
      }, "computeNextBackoffDelay");
      const setDelayBase = /* @__PURE__ */ __name((delay) => {
        delayBase = delay;
      }, "setDelayBase");
      return {
        computeNextBackoffDelay,
        setDelayBase
      };
    }, "getDefaultRetryBackoffStrategy");
    var createDefaultRetryToken = /* @__PURE__ */ __name(({
      retryDelay,
      retryCount,
      retryCost
    }) => {
      const getRetryCount = /* @__PURE__ */ __name(() => retryCount, "getRetryCount");
      const getRetryDelay = /* @__PURE__ */ __name(() => Math.min(MAXIMUM_RETRY_DELAY, retryDelay), "getRetryDelay");
      const getRetryCost = /* @__PURE__ */ __name(() => retryCost, "getRetryCost");
      return {
        getRetryCount,
        getRetryDelay,
        getRetryCost
      };
    }, "createDefaultRetryToken");
    var _StandardRetryStrategy = class _StandardRetryStrategy {
      constructor(maxAttempts) {
        this.maxAttempts = maxAttempts;
        this.mode = "standard";
        this.capacity = INITIAL_RETRY_TOKENS;
        this.retryBackoffStrategy = getDefaultRetryBackoffStrategy();
        this.maxAttemptsProvider = typeof maxAttempts === "function" ? maxAttempts : async () => maxAttempts;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async acquireInitialRetryToken(retryTokenScope) {
        return createDefaultRetryToken({
          retryDelay: DEFAULT_RETRY_DELAY_BASE,
          retryCount: 0
        });
      }
      async refreshRetryTokenForRetry(token, errorInfo) {
        const maxAttempts = await this.getMaxAttempts();
        if (this.shouldRetry(token, errorInfo, maxAttempts)) {
          const errorType = errorInfo.errorType;
          this.retryBackoffStrategy.setDelayBase(
            errorType === "THROTTLING" ? THROTTLING_RETRY_DELAY_BASE : DEFAULT_RETRY_DELAY_BASE
          );
          const delayFromErrorType = this.retryBackoffStrategy.computeNextBackoffDelay(token.getRetryCount());
          const retryDelay = errorInfo.retryAfterHint ? Math.max(errorInfo.retryAfterHint.getTime() - Date.now() || 0, delayFromErrorType) : delayFromErrorType;
          const capacityCost = this.getCapacityCost(errorType);
          this.capacity -= capacityCost;
          return createDefaultRetryToken({
            retryDelay,
            retryCount: token.getRetryCount() + 1,
            retryCost: capacityCost
          });
        }
        throw new Error("No retry token available");
      }
      recordSuccess(token) {
        this.capacity = Math.max(INITIAL_RETRY_TOKENS, this.capacity + (token.getRetryCost() ?? NO_RETRY_INCREMENT));
      }
      /**
       * @returns the current available retry capacity.
       *
       * This number decreases when retries are executed and refills when requests or retries succeed.
       */
      getCapacity() {
        return this.capacity;
      }
      async getMaxAttempts() {
        try {
          return await this.maxAttemptsProvider();
        } catch (error) {
          console.warn(`Max attempts provider could not resolve. Using default of ${DEFAULT_MAX_ATTEMPTS}`);
          return DEFAULT_MAX_ATTEMPTS;
        }
      }
      shouldRetry(tokenToRenew, errorInfo, maxAttempts) {
        const attempts = tokenToRenew.getRetryCount() + 1;
        return attempts < maxAttempts && this.capacity >= this.getCapacityCost(errorInfo.errorType) && this.isRetryableError(errorInfo.errorType);
      }
      getCapacityCost(errorType) {
        return errorType === "TRANSIENT" ? TIMEOUT_RETRY_COST : RETRY_COST;
      }
      isRetryableError(errorType) {
        return errorType === "THROTTLING" || errorType === "TRANSIENT";
      }
    };
    __name(_StandardRetryStrategy, "StandardRetryStrategy");
    var StandardRetryStrategy = _StandardRetryStrategy;
    var _AdaptiveRetryStrategy = class _AdaptiveRetryStrategy {
      constructor(maxAttemptsProvider, options) {
        this.maxAttemptsProvider = maxAttemptsProvider;
        this.mode = "adaptive";
        const { rateLimiter } = options ?? {};
        this.rateLimiter = rateLimiter ?? new DefaultRateLimiter();
        this.standardRetryStrategy = new StandardRetryStrategy(maxAttemptsProvider);
      }
      async acquireInitialRetryToken(retryTokenScope) {
        await this.rateLimiter.getSendToken();
        return this.standardRetryStrategy.acquireInitialRetryToken(retryTokenScope);
      }
      async refreshRetryTokenForRetry(tokenToRenew, errorInfo) {
        this.rateLimiter.updateClientSendingRate(errorInfo);
        return this.standardRetryStrategy.refreshRetryTokenForRetry(tokenToRenew, errorInfo);
      }
      recordSuccess(token) {
        this.rateLimiter.updateClientSendingRate({});
        this.standardRetryStrategy.recordSuccess(token);
      }
    };
    __name(_AdaptiveRetryStrategy, "AdaptiveRetryStrategy");
    var AdaptiveRetryStrategy = _AdaptiveRetryStrategy;
    var _ConfiguredRetryStrategy = class _ConfiguredRetryStrategy extends StandardRetryStrategy {
      /**
       * @param maxAttempts - the maximum number of retry attempts allowed.
       *                      e.g., if set to 3, then 4 total requests are possible.
       * @param computeNextBackoffDelay - a millisecond delay for each retry or a function that takes the retry attempt
       *                                  and returns the delay.
       *
       * @example exponential backoff.
       * ```js
       * new Client({
       *   retryStrategy: new ConfiguredRetryStrategy(3, (attempt) => attempt ** 2)
       * });
       * ```
       * @example constant delay.
       * ```js
       * new Client({
       *   retryStrategy: new ConfiguredRetryStrategy(3, 2000)
       * });
       * ```
       */
      constructor(maxAttempts, computeNextBackoffDelay = DEFAULT_RETRY_DELAY_BASE) {
        super(typeof maxAttempts === "function" ? maxAttempts : async () => maxAttempts);
        if (typeof computeNextBackoffDelay === "number") {
          this.computeNextBackoffDelay = () => computeNextBackoffDelay;
        } else {
          this.computeNextBackoffDelay = computeNextBackoffDelay;
        }
      }
      async refreshRetryTokenForRetry(tokenToRenew, errorInfo) {
        const token = await super.refreshRetryTokenForRetry(tokenToRenew, errorInfo);
        token.getRetryDelay = () => this.computeNextBackoffDelay(token.getRetryCount());
        return token;
      }
    };
    __name(_ConfiguredRetryStrategy, "ConfiguredRetryStrategy");
    var ConfiguredRetryStrategy = _ConfiguredRetryStrategy;
  }
});

// node_modules/@smithy/middleware-stack/dist-cjs/index.js
var require_dist_cjs21 = __commonJS({
  "node_modules/@smithy/middleware-stack/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      constructStack: () => constructStack
    });
    module2.exports = __toCommonJS2(src_exports);
    var getAllAliases = /* @__PURE__ */ __name((name, aliases) => {
      const _aliases = [];
      if (name) {
        _aliases.push(name);
      }
      if (aliases) {
        for (const alias of aliases) {
          _aliases.push(alias);
        }
      }
      return _aliases;
    }, "getAllAliases");
    var getMiddlewareNameWithAliases = /* @__PURE__ */ __name((name, aliases) => {
      return `${name || "anonymous"}${aliases && aliases.length > 0 ? ` (a.k.a. ${aliases.join(",")})` : ""}`;
    }, "getMiddlewareNameWithAliases");
    var constructStack = /* @__PURE__ */ __name(() => {
      let absoluteEntries = [];
      let relativeEntries = [];
      let identifyOnResolve = false;
      const entriesNameSet = /* @__PURE__ */ new Set();
      const sort = /* @__PURE__ */ __name((entries) => entries.sort(
        (a, b) => stepWeights[b.step] - stepWeights[a.step] || priorityWeights[b.priority || "normal"] - priorityWeights[a.priority || "normal"]
      ), "sort");
      const removeByName = /* @__PURE__ */ __name((toRemove) => {
        let isRemoved = false;
        const filterCb = /* @__PURE__ */ __name((entry) => {
          const aliases = getAllAliases(entry.name, entry.aliases);
          if (aliases.includes(toRemove)) {
            isRemoved = true;
            for (const alias of aliases) {
              entriesNameSet.delete(alias);
            }
            return false;
          }
          return true;
        }, "filterCb");
        absoluteEntries = absoluteEntries.filter(filterCb);
        relativeEntries = relativeEntries.filter(filterCb);
        return isRemoved;
      }, "removeByName");
      const removeByReference = /* @__PURE__ */ __name((toRemove) => {
        let isRemoved = false;
        const filterCb = /* @__PURE__ */ __name((entry) => {
          if (entry.middleware === toRemove) {
            isRemoved = true;
            for (const alias of getAllAliases(entry.name, entry.aliases)) {
              entriesNameSet.delete(alias);
            }
            return false;
          }
          return true;
        }, "filterCb");
        absoluteEntries = absoluteEntries.filter(filterCb);
        relativeEntries = relativeEntries.filter(filterCb);
        return isRemoved;
      }, "removeByReference");
      const cloneTo = /* @__PURE__ */ __name((toStack) => {
        var _a;
        absoluteEntries.forEach((entry) => {
          toStack.add(entry.middleware, { ...entry });
        });
        relativeEntries.forEach((entry) => {
          toStack.addRelativeTo(entry.middleware, { ...entry });
        });
        (_a = toStack.identifyOnResolve) == null ? void 0 : _a.call(toStack, stack.identifyOnResolve());
        return toStack;
      }, "cloneTo");
      const expandRelativeMiddlewareList = /* @__PURE__ */ __name((from) => {
        const expandedMiddlewareList = [];
        from.before.forEach((entry) => {
          if (entry.before.length === 0 && entry.after.length === 0) {
            expandedMiddlewareList.push(entry);
          } else {
            expandedMiddlewareList.push(...expandRelativeMiddlewareList(entry));
          }
        });
        expandedMiddlewareList.push(from);
        from.after.reverse().forEach((entry) => {
          if (entry.before.length === 0 && entry.after.length === 0) {
            expandedMiddlewareList.push(entry);
          } else {
            expandedMiddlewareList.push(...expandRelativeMiddlewareList(entry));
          }
        });
        return expandedMiddlewareList;
      }, "expandRelativeMiddlewareList");
      const getMiddlewareList = /* @__PURE__ */ __name((debug = false) => {
        const normalizedAbsoluteEntries = [];
        const normalizedRelativeEntries = [];
        const normalizedEntriesNameMap = {};
        absoluteEntries.forEach((entry) => {
          const normalizedEntry = {
            ...entry,
            before: [],
            after: []
          };
          for (const alias of getAllAliases(normalizedEntry.name, normalizedEntry.aliases)) {
            normalizedEntriesNameMap[alias] = normalizedEntry;
          }
          normalizedAbsoluteEntries.push(normalizedEntry);
        });
        relativeEntries.forEach((entry) => {
          const normalizedEntry = {
            ...entry,
            before: [],
            after: []
          };
          for (const alias of getAllAliases(normalizedEntry.name, normalizedEntry.aliases)) {
            normalizedEntriesNameMap[alias] = normalizedEntry;
          }
          normalizedRelativeEntries.push(normalizedEntry);
        });
        normalizedRelativeEntries.forEach((entry) => {
          if (entry.toMiddleware) {
            const toMiddleware = normalizedEntriesNameMap[entry.toMiddleware];
            if (toMiddleware === void 0) {
              if (debug) {
                return;
              }
              throw new Error(
                `${entry.toMiddleware} is not found when adding ${getMiddlewareNameWithAliases(entry.name, entry.aliases)} middleware ${entry.relation} ${entry.toMiddleware}`
              );
            }
            if (entry.relation === "after") {
              toMiddleware.after.push(entry);
            }
            if (entry.relation === "before") {
              toMiddleware.before.push(entry);
            }
          }
        });
        const mainChain = sort(normalizedAbsoluteEntries).map(expandRelativeMiddlewareList).reduce(
          (wholeList, expandedMiddlewareList) => {
            wholeList.push(...expandedMiddlewareList);
            return wholeList;
          },
          []
        );
        return mainChain;
      }, "getMiddlewareList");
      const stack = {
        add: (middleware, options = {}) => {
          const { name, override, aliases: _aliases } = options;
          const entry = {
            step: "initialize",
            priority: "normal",
            middleware,
            ...options
          };
          const aliases = getAllAliases(name, _aliases);
          if (aliases.length > 0) {
            if (aliases.some((alias) => entriesNameSet.has(alias))) {
              if (!override)
                throw new Error(`Duplicate middleware name '${getMiddlewareNameWithAliases(name, _aliases)}'`);
              for (const alias of aliases) {
                const toOverrideIndex = absoluteEntries.findIndex(
                  (entry2) => {
                    var _a;
                    return entry2.name === alias || ((_a = entry2.aliases) == null ? void 0 : _a.some((a) => a === alias));
                  }
                );
                if (toOverrideIndex === -1) {
                  continue;
                }
                const toOverride = absoluteEntries[toOverrideIndex];
                if (toOverride.step !== entry.step || entry.priority !== toOverride.priority) {
                  throw new Error(
                    `"${getMiddlewareNameWithAliases(toOverride.name, toOverride.aliases)}" middleware with ${toOverride.priority} priority in ${toOverride.step} step cannot be overridden by "${getMiddlewareNameWithAliases(name, _aliases)}" middleware with ${entry.priority} priority in ${entry.step} step.`
                  );
                }
                absoluteEntries.splice(toOverrideIndex, 1);
              }
            }
            for (const alias of aliases) {
              entriesNameSet.add(alias);
            }
          }
          absoluteEntries.push(entry);
        },
        addRelativeTo: (middleware, options) => {
          const { name, override, aliases: _aliases } = options;
          const entry = {
            middleware,
            ...options
          };
          const aliases = getAllAliases(name, _aliases);
          if (aliases.length > 0) {
            if (aliases.some((alias) => entriesNameSet.has(alias))) {
              if (!override)
                throw new Error(`Duplicate middleware name '${getMiddlewareNameWithAliases(name, _aliases)}'`);
              for (const alias of aliases) {
                const toOverrideIndex = relativeEntries.findIndex(
                  (entry2) => {
                    var _a;
                    return entry2.name === alias || ((_a = entry2.aliases) == null ? void 0 : _a.some((a) => a === alias));
                  }
                );
                if (toOverrideIndex === -1) {
                  continue;
                }
                const toOverride = relativeEntries[toOverrideIndex];
                if (toOverride.toMiddleware !== entry.toMiddleware || toOverride.relation !== entry.relation) {
                  throw new Error(
                    `"${getMiddlewareNameWithAliases(toOverride.name, toOverride.aliases)}" middleware ${toOverride.relation} "${toOverride.toMiddleware}" middleware cannot be overridden by "${getMiddlewareNameWithAliases(name, _aliases)}" middleware ${entry.relation} "${entry.toMiddleware}" middleware.`
                  );
                }
                relativeEntries.splice(toOverrideIndex, 1);
              }
            }
            for (const alias of aliases) {
              entriesNameSet.add(alias);
            }
          }
          relativeEntries.push(entry);
        },
        clone: () => cloneTo(constructStack()),
        use: (plugin) => {
          plugin.applyToStack(stack);
        },
        remove: (toRemove) => {
          if (typeof toRemove === "string")
            return removeByName(toRemove);
          else
            return removeByReference(toRemove);
        },
        removeByTag: (toRemove) => {
          let isRemoved = false;
          const filterCb = /* @__PURE__ */ __name((entry) => {
            const { tags, name, aliases: _aliases } = entry;
            if (tags && tags.includes(toRemove)) {
              const aliases = getAllAliases(name, _aliases);
              for (const alias of aliases) {
                entriesNameSet.delete(alias);
              }
              isRemoved = true;
              return false;
            }
            return true;
          }, "filterCb");
          absoluteEntries = absoluteEntries.filter(filterCb);
          relativeEntries = relativeEntries.filter(filterCb);
          return isRemoved;
        },
        concat: (from) => {
          var _a;
          const cloned = cloneTo(constructStack());
          cloned.use(from);
          cloned.identifyOnResolve(
            identifyOnResolve || cloned.identifyOnResolve() || (((_a = from.identifyOnResolve) == null ? void 0 : _a.call(from)) ?? false)
          );
          return cloned;
        },
        applyToStack: cloneTo,
        identify: () => {
          return getMiddlewareList(true).map((mw) => {
            const step = mw.step ?? mw.relation + " " + mw.toMiddleware;
            return getMiddlewareNameWithAliases(mw.name, mw.aliases) + " - " + step;
          });
        },
        identifyOnResolve(toggle) {
          if (typeof toggle === "boolean")
            identifyOnResolve = toggle;
          return identifyOnResolve;
        },
        resolve: (handler, context) => {
          for (const middleware of getMiddlewareList().map((entry) => entry.middleware).reverse()) {
            handler = middleware(handler, context);
          }
          if (identifyOnResolve) {
            console.log(stack.identify());
          }
          return handler;
        }
      };
      return stack;
    }, "constructStack");
    var stepWeights = {
      initialize: 5,
      serialize: 4,
      build: 3,
      finalizeRequest: 2,
      deserialize: 1
    };
    var priorityWeights = {
      high: 3,
      normal: 2,
      low: 1
    };
  }
});

// node_modules/@smithy/is-array-buffer/dist-cjs/index.js
var require_dist_cjs22 = __commonJS({
  "node_modules/@smithy/is-array-buffer/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      isArrayBuffer: () => isArrayBuffer
    });
    module2.exports = __toCommonJS2(src_exports);
    var isArrayBuffer = /* @__PURE__ */ __name((arg) => typeof ArrayBuffer === "function" && arg instanceof ArrayBuffer || Object.prototype.toString.call(arg) === "[object ArrayBuffer]", "isArrayBuffer");
  }
});

// node_modules/@smithy/util-buffer-from/dist-cjs/index.js
var require_dist_cjs23 = __commonJS({
  "node_modules/@smithy/util-buffer-from/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      fromArrayBuffer: () => fromArrayBuffer,
      fromString: () => fromString
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_is_array_buffer = require_dist_cjs22();
    var import_buffer = require("buffer");
    var fromArrayBuffer = /* @__PURE__ */ __name((input, offset = 0, length = input.byteLength - offset) => {
      if (!(0, import_is_array_buffer.isArrayBuffer)(input)) {
        throw new TypeError(`The "input" argument must be ArrayBuffer. Received type ${typeof input} (${input})`);
      }
      return import_buffer.Buffer.from(input, offset, length);
    }, "fromArrayBuffer");
    var fromString = /* @__PURE__ */ __name((input, encoding) => {
      if (typeof input !== "string") {
        throw new TypeError(`The "input" argument must be of type string. Received type ${typeof input} (${input})`);
      }
      return encoding ? import_buffer.Buffer.from(input, encoding) : import_buffer.Buffer.from(input);
    }, "fromString");
  }
});

// node_modules/@smithy/util-base64/dist-cjs/fromBase64.js
var require_fromBase64 = __commonJS({
  "node_modules/@smithy/util-base64/dist-cjs/fromBase64.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.fromBase64 = void 0;
    var util_buffer_from_1 = require_dist_cjs23();
    var BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;
    var fromBase642 = (input) => {
      if (input.length * 3 % 4 !== 0) {
        throw new TypeError(`Incorrect padding on base64 string.`);
      }
      if (!BASE64_REGEX.exec(input)) {
        throw new TypeError(`Invalid base64 string.`);
      }
      const buffer = (0, util_buffer_from_1.fromString)(input, "base64");
      return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    };
    exports2.fromBase64 = fromBase642;
  }
});

// node_modules/@smithy/util-utf8/dist-cjs/index.js
var require_dist_cjs24 = __commonJS({
  "node_modules/@smithy/util-utf8/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      fromUtf8: () => fromUtf8,
      toUint8Array: () => toUint8Array,
      toUtf8: () => toUtf8
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_util_buffer_from = require_dist_cjs23();
    var fromUtf8 = /* @__PURE__ */ __name((input) => {
      const buf = (0, import_util_buffer_from.fromString)(input, "utf8");
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength / Uint8Array.BYTES_PER_ELEMENT);
    }, "fromUtf8");
    var toUint8Array = /* @__PURE__ */ __name((data) => {
      if (typeof data === "string") {
        return fromUtf8(data);
      }
      if (ArrayBuffer.isView(data)) {
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength / Uint8Array.BYTES_PER_ELEMENT);
      }
      return new Uint8Array(data);
    }, "toUint8Array");
    var toUtf8 = /* @__PURE__ */ __name((input) => {
      if (typeof input === "string") {
        return input;
      }
      if (typeof input !== "object" || typeof input.byteOffset !== "number" || typeof input.byteLength !== "number") {
        throw new Error("@smithy/util-utf8: toUtf8 encoder function only accepts string | Uint8Array.");
      }
      return (0, import_util_buffer_from.fromArrayBuffer)(input.buffer, input.byteOffset, input.byteLength).toString("utf8");
    }, "toUtf8");
  }
});

// node_modules/@smithy/util-base64/dist-cjs/toBase64.js
var require_toBase64 = __commonJS({
  "node_modules/@smithy/util-base64/dist-cjs/toBase64.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.toBase64 = void 0;
    var util_buffer_from_1 = require_dist_cjs23();
    var util_utf8_1 = require_dist_cjs24();
    var toBase642 = (_input) => {
      let input;
      if (typeof _input === "string") {
        input = (0, util_utf8_1.fromUtf8)(_input);
      } else {
        input = _input;
      }
      if (typeof input !== "object" || typeof input.byteOffset !== "number" || typeof input.byteLength !== "number") {
        throw new Error("@smithy/util-base64: toBase64 encoder function only accepts string | Uint8Array.");
      }
      return (0, util_buffer_from_1.fromArrayBuffer)(input.buffer, input.byteOffset, input.byteLength).toString("base64");
    };
    exports2.toBase64 = toBase642;
  }
});

// node_modules/@smithy/util-base64/dist-cjs/index.js
var require_dist_cjs25 = __commonJS({
  "node_modules/@smithy/util-base64/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __reExport = (target, mod, secondTarget) => (__copyProps2(target, mod, "default"), secondTarget && __copyProps2(secondTarget, mod, "default"));
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    module2.exports = __toCommonJS2(src_exports);
    __reExport(src_exports, require_fromBase64(), module2.exports);
    __reExport(src_exports, require_toBase64(), module2.exports);
  }
});

// node_modules/@smithy/util-stream/dist-cjs/getAwsChunkedEncodingStream.js
var require_getAwsChunkedEncodingStream = __commonJS({
  "node_modules/@smithy/util-stream/dist-cjs/getAwsChunkedEncodingStream.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getAwsChunkedEncodingStream = void 0;
    var stream_1 = require("stream");
    var getAwsChunkedEncodingStream2 = (readableStream, options) => {
      const { base64Encoder, bodyLengthChecker, checksumAlgorithmFn, checksumLocationName, streamHasher } = options;
      const checksumRequired = base64Encoder !== void 0 && checksumAlgorithmFn !== void 0 && checksumLocationName !== void 0 && streamHasher !== void 0;
      const digest = checksumRequired ? streamHasher(checksumAlgorithmFn, readableStream) : void 0;
      const awsChunkedEncodingStream = new stream_1.Readable({ read: () => {
      } });
      readableStream.on("data", (data) => {
        const length = bodyLengthChecker(data) || 0;
        awsChunkedEncodingStream.push(`${length.toString(16)}\r
`);
        awsChunkedEncodingStream.push(data);
        awsChunkedEncodingStream.push("\r\n");
      });
      readableStream.on("end", async () => {
        awsChunkedEncodingStream.push(`0\r
`);
        if (checksumRequired) {
          const checksum = base64Encoder(await digest);
          awsChunkedEncodingStream.push(`${checksumLocationName}:${checksum}\r
`);
          awsChunkedEncodingStream.push(`\r
`);
        }
        awsChunkedEncodingStream.push(null);
      });
      return awsChunkedEncodingStream;
    };
    exports2.getAwsChunkedEncodingStream = getAwsChunkedEncodingStream2;
  }
});

// node_modules/@smithy/util-uri-escape/dist-cjs/index.js
var require_dist_cjs26 = __commonJS({
  "node_modules/@smithy/util-uri-escape/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      escapeUri: () => escapeUri,
      escapeUriPath: () => escapeUriPath
    });
    module2.exports = __toCommonJS2(src_exports);
    var escapeUri = /* @__PURE__ */ __name((uri) => (
      // AWS percent-encodes some extra non-standard characters in a URI
      encodeURIComponent(uri).replace(/[!'()*]/g, hexEncode)
    ), "escapeUri");
    var hexEncode = /* @__PURE__ */ __name((c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`, "hexEncode");
    var escapeUriPath = /* @__PURE__ */ __name((uri) => uri.split("/").map(escapeUri).join("/"), "escapeUriPath");
  }
});

// node_modules/@smithy/querystring-builder/dist-cjs/index.js
var require_dist_cjs27 = __commonJS({
  "node_modules/@smithy/querystring-builder/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      buildQueryString: () => buildQueryString
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_util_uri_escape = require_dist_cjs26();
    function buildQueryString(query2) {
      const parts = [];
      for (let key of Object.keys(query2).sort()) {
        const value = query2[key];
        key = (0, import_util_uri_escape.escapeUri)(key);
        if (Array.isArray(value)) {
          for (let i = 0, iLen = value.length; i < iLen; i++) {
            parts.push(`${key}=${(0, import_util_uri_escape.escapeUri)(value[i])}`);
          }
        } else {
          let qsEntry = key;
          if (value || typeof value === "string") {
            qsEntry += `=${(0, import_util_uri_escape.escapeUri)(value)}`;
          }
          parts.push(qsEntry);
        }
      }
      return parts.join("&");
    }
    __name(buildQueryString, "buildQueryString");
  }
});

// node_modules/@smithy/node-http-handler/dist-cjs/index.js
var require_dist_cjs28 = __commonJS({
  "node_modules/@smithy/node-http-handler/dist-cjs/index.js"(exports2, module2) {
    var __create2 = Object.create;
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf2 = Object.getPrototypeOf;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      DEFAULT_REQUEST_TIMEOUT: () => DEFAULT_REQUEST_TIMEOUT,
      NodeHttp2Handler: () => NodeHttp2Handler,
      NodeHttpHandler: () => NodeHttpHandler,
      streamCollector: () => streamCollector
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_protocol_http8 = require_dist_cjs2();
    var import_querystring_builder = require_dist_cjs27();
    var import_http = require("http");
    var import_https = require("https");
    var NODEJS_TIMEOUT_ERROR_CODES = ["ECONNRESET", "EPIPE", "ETIMEDOUT"];
    var getTransformedHeaders = /* @__PURE__ */ __name((headers) => {
      const transformedHeaders = {};
      for (const name of Object.keys(headers)) {
        const headerValues = headers[name];
        transformedHeaders[name] = Array.isArray(headerValues) ? headerValues.join(",") : headerValues;
      }
      return transformedHeaders;
    }, "getTransformedHeaders");
    var setConnectionTimeout = /* @__PURE__ */ __name((request, reject, timeoutInMs = 0) => {
      if (!timeoutInMs) {
        return;
      }
      const timeoutId = setTimeout(() => {
        request.destroy();
        reject(
          Object.assign(new Error(`Socket timed out without establishing a connection within ${timeoutInMs} ms`), {
            name: "TimeoutError"
          })
        );
      }, timeoutInMs);
      request.on("socket", (socket) => {
        if (socket.connecting) {
          socket.on("connect", () => {
            clearTimeout(timeoutId);
          });
        } else {
          clearTimeout(timeoutId);
        }
      });
    }, "setConnectionTimeout");
    var setSocketKeepAlive = /* @__PURE__ */ __name((request, { keepAlive, keepAliveMsecs }) => {
      if (keepAlive !== true) {
        return;
      }
      request.on("socket", (socket) => {
        socket.setKeepAlive(keepAlive, keepAliveMsecs || 0);
      });
    }, "setSocketKeepAlive");
    var setSocketTimeout = /* @__PURE__ */ __name((request, reject, timeoutInMs = 0) => {
      request.setTimeout(timeoutInMs, () => {
        request.destroy();
        reject(Object.assign(new Error(`Connection timed out after ${timeoutInMs} ms`), { name: "TimeoutError" }));
      });
    }, "setSocketTimeout");
    var import_stream = require("stream");
    var MIN_WAIT_TIME = 1e3;
    async function writeRequestBody(httpRequest, request, maxContinueTimeoutMs = MIN_WAIT_TIME) {
      const headers = request.headers ?? {};
      const expect = headers["Expect"] || headers["expect"];
      let timeoutId = -1;
      let hasError = false;
      if (expect === "100-continue") {
        await Promise.race([
          new Promise((resolve) => {
            timeoutId = Number(setTimeout(resolve, Math.max(MIN_WAIT_TIME, maxContinueTimeoutMs)));
          }),
          new Promise((resolve) => {
            httpRequest.on("continue", () => {
              clearTimeout(timeoutId);
              resolve();
            });
            httpRequest.on("error", () => {
              hasError = true;
              clearTimeout(timeoutId);
              resolve();
            });
          })
        ]);
      }
      if (!hasError) {
        writeBody(httpRequest, request.body);
      }
    }
    __name(writeRequestBody, "writeRequestBody");
    function writeBody(httpRequest, body) {
      if (body instanceof import_stream.Readable) {
        body.pipe(httpRequest);
        return;
      }
      if (body) {
        if (Buffer.isBuffer(body) || typeof body === "string") {
          httpRequest.end(body);
          return;
        }
        const uint8 = body;
        if (typeof uint8 === "object" && uint8.buffer && typeof uint8.byteOffset === "number" && typeof uint8.byteLength === "number") {
          httpRequest.end(Buffer.from(uint8.buffer, uint8.byteOffset, uint8.byteLength));
          return;
        }
        httpRequest.end(Buffer.from(body));
        return;
      }
      httpRequest.end();
    }
    __name(writeBody, "writeBody");
    var DEFAULT_REQUEST_TIMEOUT = 0;
    var _NodeHttpHandler = class _NodeHttpHandler2 {
      constructor(options) {
        this.socketWarningTimestamp = 0;
        this.metadata = { handlerProtocol: "http/1.1" };
        this.configProvider = new Promise((resolve, reject) => {
          if (typeof options === "function") {
            options().then((_options) => {
              resolve(this.resolveDefaultConfig(_options));
            }).catch(reject);
          } else {
            resolve(this.resolveDefaultConfig(options));
          }
        });
      }
      /**
       * @returns the input if it is an HttpHandler of any class,
       * or instantiates a new instance of this handler.
       */
      static create(instanceOrOptions) {
        if (typeof (instanceOrOptions == null ? void 0 : instanceOrOptions.handle) === "function") {
          return instanceOrOptions;
        }
        return new _NodeHttpHandler2(instanceOrOptions);
      }
      /**
       * @internal
       *
       * @param agent - http(s) agent in use by the NodeHttpHandler instance.
       * @param socketWarningTimestamp - last socket usage check timestamp.
       * @param logger - channel for the warning.
       * @returns timestamp of last emitted warning.
       */
      static checkSocketUsage(agent, socketWarningTimestamp, logger = console) {
        var _a, _b, _c;
        const { sockets, requests, maxSockets } = agent;
        if (typeof maxSockets !== "number" || maxSockets === Infinity) {
          return socketWarningTimestamp;
        }
        const interval = 15e3;
        if (Date.now() - interval < socketWarningTimestamp) {
          return socketWarningTimestamp;
        }
        if (sockets && requests) {
          for (const origin in sockets) {
            const socketsInUse = ((_a = sockets[origin]) == null ? void 0 : _a.length) ?? 0;
            const requestsEnqueued = ((_b = requests[origin]) == null ? void 0 : _b.length) ?? 0;
            if (socketsInUse >= maxSockets && requestsEnqueued >= 2 * maxSockets) {
              (_c = logger == null ? void 0 : logger.warn) == null ? void 0 : _c.call(
                logger,
                `@smithy/node-http-handler:WARN - socket usage at capacity=${socketsInUse} and ${requestsEnqueued} additional requests are enqueued.
See https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/node-configuring-maxsockets.html
or increase socketAcquisitionWarningTimeout=(millis) in the NodeHttpHandler config.`
              );
              return Date.now();
            }
          }
        }
        return socketWarningTimestamp;
      }
      resolveDefaultConfig(options) {
        const { requestTimeout, connectionTimeout, socketTimeout, httpAgent, httpsAgent } = options || {};
        const keepAlive = true;
        const maxSockets = 50;
        return {
          connectionTimeout,
          requestTimeout: requestTimeout ?? socketTimeout,
          httpAgent: (() => {
            if (httpAgent instanceof import_http.Agent || typeof (httpAgent == null ? void 0 : httpAgent.destroy) === "function") {
              return httpAgent;
            }
            return new import_http.Agent({ keepAlive, maxSockets, ...httpAgent });
          })(),
          httpsAgent: (() => {
            if (httpsAgent instanceof import_https.Agent || typeof (httpsAgent == null ? void 0 : httpsAgent.destroy) === "function") {
              return httpsAgent;
            }
            return new import_https.Agent({ keepAlive, maxSockets, ...httpsAgent });
          })(),
          logger: console
        };
      }
      destroy() {
        var _a, _b, _c, _d;
        (_b = (_a = this.config) == null ? void 0 : _a.httpAgent) == null ? void 0 : _b.destroy();
        (_d = (_c = this.config) == null ? void 0 : _c.httpsAgent) == null ? void 0 : _d.destroy();
      }
      async handle(request, { abortSignal } = {}) {
        if (!this.config) {
          this.config = await this.configProvider;
        }
        let socketCheckTimeoutId;
        return new Promise((_resolve, _reject) => {
          let writeRequestBodyPromise = void 0;
          const resolve = /* @__PURE__ */ __name(async (arg) => {
            await writeRequestBodyPromise;
            clearTimeout(socketCheckTimeoutId);
            _resolve(arg);
          }, "resolve");
          const reject = /* @__PURE__ */ __name(async (arg) => {
            await writeRequestBodyPromise;
            clearTimeout(socketCheckTimeoutId);
            _reject(arg);
          }, "reject");
          if (!this.config) {
            throw new Error("Node HTTP request handler config is not resolved");
          }
          if (abortSignal == null ? void 0 : abortSignal.aborted) {
            const abortError = new Error("Request aborted");
            abortError.name = "AbortError";
            reject(abortError);
            return;
          }
          const isSSL = request.protocol === "https:";
          const agent = isSSL ? this.config.httpsAgent : this.config.httpAgent;
          socketCheckTimeoutId = setTimeout(
            () => {
              this.socketWarningTimestamp = _NodeHttpHandler2.checkSocketUsage(
                agent,
                this.socketWarningTimestamp,
                this.config.logger
              );
            },
            this.config.socketAcquisitionWarningTimeout ?? (this.config.requestTimeout ?? 2e3) + (this.config.connectionTimeout ?? 1e3)
          );
          const queryString = (0, import_querystring_builder.buildQueryString)(request.query || {});
          let auth = void 0;
          if (request.username != null || request.password != null) {
            const username = request.username ?? "";
            const password = request.password ?? "";
            auth = `${username}:${password}`;
          }
          let path = request.path;
          if (queryString) {
            path += `?${queryString}`;
          }
          if (request.fragment) {
            path += `#${request.fragment}`;
          }
          const nodeHttpsOptions = {
            headers: request.headers,
            host: request.hostname,
            method: request.method,
            path,
            port: request.port,
            agent,
            auth
          };
          const requestFunc = isSSL ? import_https.request : import_http.request;
          const req = requestFunc(nodeHttpsOptions, (res) => {
            const httpResponse = new import_protocol_http8.HttpResponse({
              statusCode: res.statusCode || -1,
              reason: res.statusMessage,
              headers: getTransformedHeaders(res.headers),
              body: res
            });
            resolve({ response: httpResponse });
          });
          req.on("error", (err) => {
            if (NODEJS_TIMEOUT_ERROR_CODES.includes(err.code)) {
              reject(Object.assign(err, { name: "TimeoutError" }));
            } else {
              reject(err);
            }
          });
          setConnectionTimeout(req, reject, this.config.connectionTimeout);
          setSocketTimeout(req, reject, this.config.requestTimeout);
          if (abortSignal) {
            const onAbort = /* @__PURE__ */ __name(() => {
              req.destroy();
              const abortError = new Error("Request aborted");
              abortError.name = "AbortError";
              reject(abortError);
            }, "onAbort");
            if (typeof abortSignal.addEventListener === "function") {
              const signal = abortSignal;
              signal.addEventListener("abort", onAbort, { once: true });
              req.once("close", () => signal.removeEventListener("abort", onAbort));
            } else {
              abortSignal.onabort = onAbort;
            }
          }
          const httpAgent = nodeHttpsOptions.agent;
          if (typeof httpAgent === "object" && "keepAlive" in httpAgent) {
            setSocketKeepAlive(req, {
              // @ts-expect-error keepAlive is not public on httpAgent.
              keepAlive: httpAgent.keepAlive,
              // @ts-expect-error keepAliveMsecs is not public on httpAgent.
              keepAliveMsecs: httpAgent.keepAliveMsecs
            });
          }
          writeRequestBodyPromise = writeRequestBody(req, request, this.config.requestTimeout).catch((e) => {
            clearTimeout(socketCheckTimeoutId);
            return _reject(e);
          });
        });
      }
      updateHttpClientConfig(key, value) {
        this.config = void 0;
        this.configProvider = this.configProvider.then((config) => {
          return {
            ...config,
            [key]: value
          };
        });
      }
      httpHandlerConfigs() {
        return this.config ?? {};
      }
    };
    __name(_NodeHttpHandler, "NodeHttpHandler");
    var NodeHttpHandler = _NodeHttpHandler;
    var import_http22 = require("http2");
    var import_http2 = __toESM2(require("http2"));
    var _NodeHttp2ConnectionPool = class _NodeHttp2ConnectionPool {
      constructor(sessions) {
        this.sessions = [];
        this.sessions = sessions ?? [];
      }
      poll() {
        if (this.sessions.length > 0) {
          return this.sessions.shift();
        }
      }
      offerLast(session) {
        this.sessions.push(session);
      }
      contains(session) {
        return this.sessions.includes(session);
      }
      remove(session) {
        this.sessions = this.sessions.filter((s) => s !== session);
      }
      [Symbol.iterator]() {
        return this.sessions[Symbol.iterator]();
      }
      destroy(connection) {
        for (const session of this.sessions) {
          if (session === connection) {
            if (!session.destroyed) {
              session.destroy();
            }
          }
        }
      }
    };
    __name(_NodeHttp2ConnectionPool, "NodeHttp2ConnectionPool");
    var NodeHttp2ConnectionPool = _NodeHttp2ConnectionPool;
    var _NodeHttp2ConnectionManager = class _NodeHttp2ConnectionManager {
      constructor(config) {
        this.sessionCache = /* @__PURE__ */ new Map();
        this.config = config;
        if (this.config.maxConcurrency && this.config.maxConcurrency <= 0) {
          throw new RangeError("maxConcurrency must be greater than zero.");
        }
      }
      lease(requestContext, connectionConfiguration) {
        const url = this.getUrlString(requestContext);
        const existingPool = this.sessionCache.get(url);
        if (existingPool) {
          const existingSession = existingPool.poll();
          if (existingSession && !this.config.disableConcurrency) {
            return existingSession;
          }
        }
        const session = import_http2.default.connect(url);
        if (this.config.maxConcurrency) {
          session.settings({ maxConcurrentStreams: this.config.maxConcurrency }, (err) => {
            if (err) {
              throw new Error(
                "Fail to set maxConcurrentStreams to " + this.config.maxConcurrency + "when creating new session for " + requestContext.destination.toString()
              );
            }
          });
        }
        session.unref();
        const destroySessionCb = /* @__PURE__ */ __name(() => {
          session.destroy();
          this.deleteSession(url, session);
        }, "destroySessionCb");
        session.on("goaway", destroySessionCb);
        session.on("error", destroySessionCb);
        session.on("frameError", destroySessionCb);
        session.on("close", () => this.deleteSession(url, session));
        if (connectionConfiguration.requestTimeout) {
          session.setTimeout(connectionConfiguration.requestTimeout, destroySessionCb);
        }
        const connectionPool = this.sessionCache.get(url) || new NodeHttp2ConnectionPool();
        connectionPool.offerLast(session);
        this.sessionCache.set(url, connectionPool);
        return session;
      }
      /**
       * Delete a session from the connection pool.
       * @param authority The authority of the session to delete.
       * @param session The session to delete.
       */
      deleteSession(authority, session) {
        const existingConnectionPool = this.sessionCache.get(authority);
        if (!existingConnectionPool) {
          return;
        }
        if (!existingConnectionPool.contains(session)) {
          return;
        }
        existingConnectionPool.remove(session);
        this.sessionCache.set(authority, existingConnectionPool);
      }
      release(requestContext, session) {
        var _a;
        const cacheKey = this.getUrlString(requestContext);
        (_a = this.sessionCache.get(cacheKey)) == null ? void 0 : _a.offerLast(session);
      }
      destroy() {
        for (const [key, connectionPool] of this.sessionCache) {
          for (const session of connectionPool) {
            if (!session.destroyed) {
              session.destroy();
            }
            connectionPool.remove(session);
          }
          this.sessionCache.delete(key);
        }
      }
      setMaxConcurrentStreams(maxConcurrentStreams) {
        if (this.config.maxConcurrency && this.config.maxConcurrency <= 0) {
          throw new RangeError("maxConcurrentStreams must be greater than zero.");
        }
        this.config.maxConcurrency = maxConcurrentStreams;
      }
      setDisableConcurrentStreams(disableConcurrentStreams) {
        this.config.disableConcurrency = disableConcurrentStreams;
      }
      getUrlString(request) {
        return request.destination.toString();
      }
    };
    __name(_NodeHttp2ConnectionManager, "NodeHttp2ConnectionManager");
    var NodeHttp2ConnectionManager = _NodeHttp2ConnectionManager;
    var _NodeHttp2Handler = class _NodeHttp2Handler2 {
      constructor(options) {
        this.metadata = { handlerProtocol: "h2" };
        this.connectionManager = new NodeHttp2ConnectionManager({});
        this.configProvider = new Promise((resolve, reject) => {
          if (typeof options === "function") {
            options().then((opts) => {
              resolve(opts || {});
            }).catch(reject);
          } else {
            resolve(options || {});
          }
        });
      }
      /**
       * @returns the input if it is an HttpHandler of any class,
       * or instantiates a new instance of this handler.
       */
      static create(instanceOrOptions) {
        if (typeof (instanceOrOptions == null ? void 0 : instanceOrOptions.handle) === "function") {
          return instanceOrOptions;
        }
        return new _NodeHttp2Handler2(instanceOrOptions);
      }
      destroy() {
        this.connectionManager.destroy();
      }
      async handle(request, { abortSignal } = {}) {
        if (!this.config) {
          this.config = await this.configProvider;
          this.connectionManager.setDisableConcurrentStreams(this.config.disableConcurrentStreams || false);
          if (this.config.maxConcurrentStreams) {
            this.connectionManager.setMaxConcurrentStreams(this.config.maxConcurrentStreams);
          }
        }
        const { requestTimeout, disableConcurrentStreams } = this.config;
        return new Promise((_resolve, _reject) => {
          var _a;
          let fulfilled = false;
          let writeRequestBodyPromise = void 0;
          const resolve = /* @__PURE__ */ __name(async (arg) => {
            await writeRequestBodyPromise;
            _resolve(arg);
          }, "resolve");
          const reject = /* @__PURE__ */ __name(async (arg) => {
            await writeRequestBodyPromise;
            _reject(arg);
          }, "reject");
          if (abortSignal == null ? void 0 : abortSignal.aborted) {
            fulfilled = true;
            const abortError = new Error("Request aborted");
            abortError.name = "AbortError";
            reject(abortError);
            return;
          }
          const { hostname, method, port, protocol, query: query2 } = request;
          let auth = "";
          if (request.username != null || request.password != null) {
            const username = request.username ?? "";
            const password = request.password ?? "";
            auth = `${username}:${password}@`;
          }
          const authority = `${protocol}//${auth}${hostname}${port ? `:${port}` : ""}`;
          const requestContext = { destination: new URL(authority) };
          const session = this.connectionManager.lease(requestContext, {
            requestTimeout: (_a = this.config) == null ? void 0 : _a.sessionTimeout,
            disableConcurrentStreams: disableConcurrentStreams || false
          });
          const rejectWithDestroy = /* @__PURE__ */ __name((err) => {
            if (disableConcurrentStreams) {
              this.destroySession(session);
            }
            fulfilled = true;
            reject(err);
          }, "rejectWithDestroy");
          const queryString = (0, import_querystring_builder.buildQueryString)(query2 || {});
          let path = request.path;
          if (queryString) {
            path += `?${queryString}`;
          }
          if (request.fragment) {
            path += `#${request.fragment}`;
          }
          const req = session.request({
            ...request.headers,
            [import_http22.constants.HTTP2_HEADER_PATH]: path,
            [import_http22.constants.HTTP2_HEADER_METHOD]: method
          });
          session.ref();
          req.on("response", (headers) => {
            const httpResponse = new import_protocol_http8.HttpResponse({
              statusCode: headers[":status"] || -1,
              headers: getTransformedHeaders(headers),
              body: req
            });
            fulfilled = true;
            resolve({ response: httpResponse });
            if (disableConcurrentStreams) {
              session.close();
              this.connectionManager.deleteSession(authority, session);
            }
          });
          if (requestTimeout) {
            req.setTimeout(requestTimeout, () => {
              req.close();
              const timeoutError = new Error(`Stream timed out because of no activity for ${requestTimeout} ms`);
              timeoutError.name = "TimeoutError";
              rejectWithDestroy(timeoutError);
            });
          }
          if (abortSignal) {
            const onAbort = /* @__PURE__ */ __name(() => {
              req.close();
              const abortError = new Error("Request aborted");
              abortError.name = "AbortError";
              rejectWithDestroy(abortError);
            }, "onAbort");
            if (typeof abortSignal.addEventListener === "function") {
              const signal = abortSignal;
              signal.addEventListener("abort", onAbort, { once: true });
              req.once("close", () => signal.removeEventListener("abort", onAbort));
            } else {
              abortSignal.onabort = onAbort;
            }
          }
          req.on("frameError", (type, code, id) => {
            rejectWithDestroy(new Error(`Frame type id ${type} in stream id ${id} has failed with code ${code}.`));
          });
          req.on("error", rejectWithDestroy);
          req.on("aborted", () => {
            rejectWithDestroy(
              new Error(`HTTP/2 stream is abnormally aborted in mid-communication with result code ${req.rstCode}.`)
            );
          });
          req.on("close", () => {
            session.unref();
            if (disableConcurrentStreams) {
              session.destroy();
            }
            if (!fulfilled) {
              rejectWithDestroy(new Error("Unexpected error: http2 request did not get a response"));
            }
          });
          writeRequestBodyPromise = writeRequestBody(req, request, requestTimeout);
        });
      }
      updateHttpClientConfig(key, value) {
        this.config = void 0;
        this.configProvider = this.configProvider.then((config) => {
          return {
            ...config,
            [key]: value
          };
        });
      }
      httpHandlerConfigs() {
        return this.config ?? {};
      }
      /**
       * Destroys a session.
       * @param session The session to destroy.
       */
      destroySession(session) {
        if (!session.destroyed) {
          session.destroy();
        }
      }
    };
    __name(_NodeHttp2Handler, "NodeHttp2Handler");
    var NodeHttp2Handler = _NodeHttp2Handler;
    var _Collector = class _Collector extends import_stream.Writable {
      constructor() {
        super(...arguments);
        this.bufferedBytes = [];
      }
      _write(chunk, encoding, callback) {
        this.bufferedBytes.push(chunk);
        callback();
      }
    };
    __name(_Collector, "Collector");
    var Collector = _Collector;
    var streamCollector = /* @__PURE__ */ __name((stream) => {
      if (isReadableStreamInstance(stream)) {
        return collectReadableStream(stream);
      }
      return new Promise((resolve, reject) => {
        const collector = new Collector();
        stream.pipe(collector);
        stream.on("error", (err) => {
          collector.end();
          reject(err);
        });
        collector.on("error", reject);
        collector.on("finish", function() {
          const bytes = new Uint8Array(Buffer.concat(this.bufferedBytes));
          resolve(bytes);
        });
      });
    }, "streamCollector");
    var isReadableStreamInstance = /* @__PURE__ */ __name((stream) => typeof ReadableStream === "function" && stream instanceof ReadableStream, "isReadableStreamInstance");
    async function collectReadableStream(stream) {
      const chunks = [];
      const reader = stream.getReader();
      let isDone = false;
      let length = 0;
      while (!isDone) {
        const { done, value } = await reader.read();
        if (value) {
          chunks.push(value);
          length += value.length;
        }
        isDone = done;
      }
      const collected = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) {
        collected.set(chunk, offset);
        offset += chunk.length;
      }
      return collected;
    }
    __name(collectReadableStream, "collectReadableStream");
  }
});

// node_modules/@smithy/fetch-http-handler/dist-cjs/index.js
var require_dist_cjs29 = __commonJS({
  "node_modules/@smithy/fetch-http-handler/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      FetchHttpHandler: () => FetchHttpHandler,
      keepAliveSupport: () => keepAliveSupport,
      streamCollector: () => streamCollector
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_protocol_http8 = require_dist_cjs2();
    var import_querystring_builder = require_dist_cjs27();
    function requestTimeout(timeoutInMs = 0) {
      return new Promise((resolve, reject) => {
        if (timeoutInMs) {
          setTimeout(() => {
            const timeoutError = new Error(`Request did not complete within ${timeoutInMs} ms`);
            timeoutError.name = "TimeoutError";
            reject(timeoutError);
          }, timeoutInMs);
        }
      });
    }
    __name(requestTimeout, "requestTimeout");
    var keepAliveSupport = {
      supported: void 0
    };
    var _FetchHttpHandler = class _FetchHttpHandler2 {
      /**
       * @returns the input if it is an HttpHandler of any class,
       * or instantiates a new instance of this handler.
       */
      static create(instanceOrOptions) {
        if (typeof (instanceOrOptions == null ? void 0 : instanceOrOptions.handle) === "function") {
          return instanceOrOptions;
        }
        return new _FetchHttpHandler2(instanceOrOptions);
      }
      constructor(options) {
        if (typeof options === "function") {
          this.configProvider = options().then((opts) => opts || {});
        } else {
          this.config = options ?? {};
          this.configProvider = Promise.resolve(this.config);
        }
        if (keepAliveSupport.supported === void 0) {
          keepAliveSupport.supported = Boolean(
            typeof Request !== "undefined" && "keepalive" in new Request("https://[::1]")
          );
        }
      }
      destroy() {
      }
      async handle(request, { abortSignal } = {}) {
        if (!this.config) {
          this.config = await this.configProvider;
        }
        const requestTimeoutInMs = this.config.requestTimeout;
        const keepAlive = this.config.keepAlive === true;
        const credentials = this.config.credentials;
        if (abortSignal == null ? void 0 : abortSignal.aborted) {
          const abortError = new Error("Request aborted");
          abortError.name = "AbortError";
          return Promise.reject(abortError);
        }
        let path = request.path;
        const queryString = (0, import_querystring_builder.buildQueryString)(request.query || {});
        if (queryString) {
          path += `?${queryString}`;
        }
        if (request.fragment) {
          path += `#${request.fragment}`;
        }
        let auth = "";
        if (request.username != null || request.password != null) {
          const username = request.username ?? "";
          const password = request.password ?? "";
          auth = `${username}:${password}@`;
        }
        const { port, method } = request;
        const url = `${request.protocol}//${auth}${request.hostname}${port ? `:${port}` : ""}${path}`;
        const body = method === "GET" || method === "HEAD" ? void 0 : request.body;
        const requestOptions = {
          body,
          headers: new Headers(request.headers),
          method,
          credentials
        };
        if (body) {
          requestOptions.duplex = "half";
        }
        if (typeof AbortController !== "undefined") {
          requestOptions.signal = abortSignal;
        }
        if (keepAliveSupport.supported) {
          requestOptions.keepalive = keepAlive;
        }
        let removeSignalEventListener = /* @__PURE__ */ __name(() => {
        }, "removeSignalEventListener");
        const fetchRequest = new Request(url, requestOptions);
        const raceOfPromises = [
          fetch(fetchRequest).then((response) => {
            const fetchHeaders = response.headers;
            const transformedHeaders = {};
            for (const pair of fetchHeaders.entries()) {
              transformedHeaders[pair[0]] = pair[1];
            }
            const hasReadableStream = response.body != void 0;
            if (!hasReadableStream) {
              return response.blob().then((body2) => ({
                response: new import_protocol_http8.HttpResponse({
                  headers: transformedHeaders,
                  reason: response.statusText,
                  statusCode: response.status,
                  body: body2
                })
              }));
            }
            return {
              response: new import_protocol_http8.HttpResponse({
                headers: transformedHeaders,
                reason: response.statusText,
                statusCode: response.status,
                body: response.body
              })
            };
          }),
          requestTimeout(requestTimeoutInMs)
        ];
        if (abortSignal) {
          raceOfPromises.push(
            new Promise((resolve, reject) => {
              const onAbort = /* @__PURE__ */ __name(() => {
                const abortError = new Error("Request aborted");
                abortError.name = "AbortError";
                reject(abortError);
              }, "onAbort");
              if (typeof abortSignal.addEventListener === "function") {
                const signal = abortSignal;
                signal.addEventListener("abort", onAbort, { once: true });
                removeSignalEventListener = /* @__PURE__ */ __name(() => signal.removeEventListener("abort", onAbort), "removeSignalEventListener");
              } else {
                abortSignal.onabort = onAbort;
              }
            })
          );
        }
        return Promise.race(raceOfPromises).finally(removeSignalEventListener);
      }
      updateHttpClientConfig(key, value) {
        this.config = void 0;
        this.configProvider = this.configProvider.then((config) => {
          config[key] = value;
          return config;
        });
      }
      httpHandlerConfigs() {
        return this.config ?? {};
      }
    };
    __name(_FetchHttpHandler, "FetchHttpHandler");
    var FetchHttpHandler = _FetchHttpHandler;
    var import_util_base64 = require_dist_cjs25();
    var streamCollector = /* @__PURE__ */ __name((stream) => {
      if (typeof Blob === "function" && stream instanceof Blob) {
        return collectBlob(stream);
      }
      return collectStream(stream);
    }, "streamCollector");
    async function collectBlob(blob) {
      const base64 = await readToBase64(blob);
      const arrayBuffer = (0, import_util_base64.fromBase64)(base64);
      return new Uint8Array(arrayBuffer);
    }
    __name(collectBlob, "collectBlob");
    async function collectStream(stream) {
      const chunks = [];
      const reader = stream.getReader();
      let isDone = false;
      let length = 0;
      while (!isDone) {
        const { done, value } = await reader.read();
        if (value) {
          chunks.push(value);
          length += value.length;
        }
        isDone = done;
      }
      const collected = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) {
        collected.set(chunk, offset);
        offset += chunk.length;
      }
      return collected;
    }
    __name(collectStream, "collectStream");
    function readToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.readyState !== 2) {
            return reject(new Error("Reader aborted too early"));
          }
          const result = reader.result ?? "";
          const commaIndex = result.indexOf(",");
          const dataOffset = commaIndex > -1 ? commaIndex + 1 : result.length;
          resolve(result.substring(dataOffset));
        };
        reader.onabort = () => reject(new Error("Read aborted"));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    }
    __name(readToBase64, "readToBase64");
  }
});

// node_modules/@smithy/util-hex-encoding/dist-cjs/index.js
var require_dist_cjs30 = __commonJS({
  "node_modules/@smithy/util-hex-encoding/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      fromHex: () => fromHex,
      toHex: () => toHex
    });
    module2.exports = __toCommonJS2(src_exports);
    var SHORT_TO_HEX = {};
    var HEX_TO_SHORT = {};
    for (let i = 0; i < 256; i++) {
      let encodedByte = i.toString(16).toLowerCase();
      if (encodedByte.length === 1) {
        encodedByte = `0${encodedByte}`;
      }
      SHORT_TO_HEX[i] = encodedByte;
      HEX_TO_SHORT[encodedByte] = i;
    }
    function fromHex(encoded) {
      if (encoded.length % 2 !== 0) {
        throw new Error("Hex encoded strings must have an even number length");
      }
      const out = new Uint8Array(encoded.length / 2);
      for (let i = 0; i < encoded.length; i += 2) {
        const encodedByte = encoded.slice(i, i + 2).toLowerCase();
        if (encodedByte in HEX_TO_SHORT) {
          out[i / 2] = HEX_TO_SHORT[encodedByte];
        } else {
          throw new Error(`Cannot decode unrecognized sequence ${encodedByte} as hexadecimal`);
        }
      }
      return out;
    }
    __name(fromHex, "fromHex");
    function toHex(bytes) {
      let out = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        out += SHORT_TO_HEX[bytes[i]];
      }
      return out;
    }
    __name(toHex, "toHex");
  }
});

// node_modules/@smithy/util-stream/dist-cjs/stream-type-check.js
var require_stream_type_check = __commonJS({
  "node_modules/@smithy/util-stream/dist-cjs/stream-type-check.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isReadableStream = void 0;
    var isReadableStream2 = (stream) => {
      var _a;
      return typeof ReadableStream === "function" && (((_a = stream === null || stream === void 0 ? void 0 : stream.constructor) === null || _a === void 0 ? void 0 : _a.name) === ReadableStream.name || stream instanceof ReadableStream);
    };
    exports2.isReadableStream = isReadableStream2;
  }
});

// node_modules/@smithy/util-stream/dist-cjs/sdk-stream-mixin.browser.js
var require_sdk_stream_mixin_browser = __commonJS({
  "node_modules/@smithy/util-stream/dist-cjs/sdk-stream-mixin.browser.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.sdkStreamMixin = void 0;
    var fetch_http_handler_1 = require_dist_cjs29();
    var util_base64_1 = require_dist_cjs25();
    var util_hex_encoding_1 = require_dist_cjs30();
    var util_utf8_1 = require_dist_cjs24();
    var stream_type_check_1 = require_stream_type_check();
    var ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED = "The stream has already been transformed.";
    var sdkStreamMixin2 = (stream) => {
      var _a, _b;
      if (!isBlobInstance(stream) && !(0, stream_type_check_1.isReadableStream)(stream)) {
        const name = ((_b = (_a = stream === null || stream === void 0 ? void 0 : stream.__proto__) === null || _a === void 0 ? void 0 : _a.constructor) === null || _b === void 0 ? void 0 : _b.name) || stream;
        throw new Error(`Unexpected stream implementation, expect Blob or ReadableStream, got ${name}`);
      }
      let transformed = false;
      const transformToByteArray = async () => {
        if (transformed) {
          throw new Error(ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED);
        }
        transformed = true;
        return await (0, fetch_http_handler_1.streamCollector)(stream);
      };
      const blobToWebStream = (blob) => {
        if (typeof blob.stream !== "function") {
          throw new Error("Cannot transform payload Blob to web stream. Please make sure the Blob.stream() is polyfilled.\nIf you are using React Native, this API is not yet supported, see: https://react-native.canny.io/feature-requests/p/fetch-streaming-body");
        }
        return blob.stream();
      };
      return Object.assign(stream, {
        transformToByteArray,
        transformToString: async (encoding) => {
          const buf = await transformToByteArray();
          if (encoding === "base64") {
            return (0, util_base64_1.toBase64)(buf);
          } else if (encoding === "hex") {
            return (0, util_hex_encoding_1.toHex)(buf);
          } else if (encoding === void 0 || encoding === "utf8" || encoding === "utf-8") {
            return (0, util_utf8_1.toUtf8)(buf);
          } else if (typeof TextDecoder === "function") {
            return new TextDecoder(encoding).decode(buf);
          } else {
            throw new Error("TextDecoder is not available, please make sure polyfill is provided.");
          }
        },
        transformToWebStream: () => {
          if (transformed) {
            throw new Error(ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED);
          }
          transformed = true;
          if (isBlobInstance(stream)) {
            return blobToWebStream(stream);
          } else if ((0, stream_type_check_1.isReadableStream)(stream)) {
            return stream;
          } else {
            throw new Error(`Cannot transform payload to web stream, got ${stream}`);
          }
        }
      });
    };
    exports2.sdkStreamMixin = sdkStreamMixin2;
    var isBlobInstance = (stream) => typeof Blob === "function" && stream instanceof Blob;
  }
});

// node_modules/@smithy/util-stream/dist-cjs/sdk-stream-mixin.js
var require_sdk_stream_mixin = __commonJS({
  "node_modules/@smithy/util-stream/dist-cjs/sdk-stream-mixin.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.sdkStreamMixin = void 0;
    var node_http_handler_1 = require_dist_cjs28();
    var util_buffer_from_1 = require_dist_cjs23();
    var stream_1 = require("stream");
    var util_1 = require("util");
    var sdk_stream_mixin_browser_1 = require_sdk_stream_mixin_browser();
    var ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED = "The stream has already been transformed.";
    var sdkStreamMixin2 = (stream) => {
      var _a, _b;
      if (!(stream instanceof stream_1.Readable)) {
        try {
          return (0, sdk_stream_mixin_browser_1.sdkStreamMixin)(stream);
        } catch (e) {
          const name = ((_b = (_a = stream === null || stream === void 0 ? void 0 : stream.__proto__) === null || _a === void 0 ? void 0 : _a.constructor) === null || _b === void 0 ? void 0 : _b.name) || stream;
          throw new Error(`Unexpected stream implementation, expect Stream.Readable instance, got ${name}`);
        }
      }
      let transformed = false;
      const transformToByteArray = async () => {
        if (transformed) {
          throw new Error(ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED);
        }
        transformed = true;
        return await (0, node_http_handler_1.streamCollector)(stream);
      };
      return Object.assign(stream, {
        transformToByteArray,
        transformToString: async (encoding) => {
          const buf = await transformToByteArray();
          if (encoding === void 0 || Buffer.isEncoding(encoding)) {
            return (0, util_buffer_from_1.fromArrayBuffer)(buf.buffer, buf.byteOffset, buf.byteLength).toString(encoding);
          } else {
            const decoder = new util_1.TextDecoder(encoding);
            return decoder.decode(buf);
          }
        },
        transformToWebStream: () => {
          if (transformed) {
            throw new Error(ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED);
          }
          if (stream.readableFlowing !== null) {
            throw new Error("The stream has been consumed by other callbacks.");
          }
          if (typeof stream_1.Readable.toWeb !== "function") {
            throw new Error("Readable.toWeb() is not supported. Please make sure you are using Node.js >= 17.0.0, or polyfill is available.");
          }
          transformed = true;
          return stream_1.Readable.toWeb(stream);
        }
      });
    };
    exports2.sdkStreamMixin = sdkStreamMixin2;
  }
});

// node_modules/@smithy/util-stream/dist-cjs/splitStream.browser.js
var require_splitStream_browser = __commonJS({
  "node_modules/@smithy/util-stream/dist-cjs/splitStream.browser.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.splitStream = void 0;
    async function splitStream2(stream) {
      if (typeof stream.stream === "function") {
        stream = stream.stream();
      }
      const readableStream = stream;
      return readableStream.tee();
    }
    exports2.splitStream = splitStream2;
  }
});

// node_modules/@smithy/util-stream/dist-cjs/splitStream.js
var require_splitStream = __commonJS({
  "node_modules/@smithy/util-stream/dist-cjs/splitStream.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.splitStream = void 0;
    var stream_1 = require("stream");
    var splitStream_browser_1 = require_splitStream_browser();
    var stream_type_check_1 = require_stream_type_check();
    async function splitStream2(stream) {
      if ((0, stream_type_check_1.isReadableStream)(stream)) {
        return (0, splitStream_browser_1.splitStream)(stream);
      }
      const stream1 = new stream_1.PassThrough();
      const stream2 = new stream_1.PassThrough();
      stream.pipe(stream1);
      stream.pipe(stream2);
      return [stream1, stream2];
    }
    exports2.splitStream = splitStream2;
  }
});

// node_modules/@smithy/util-stream/dist-cjs/headStream.browser.js
var require_headStream_browser = __commonJS({
  "node_modules/@smithy/util-stream/dist-cjs/headStream.browser.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.headStream = void 0;
    async function headStream2(stream, bytes) {
      var _a;
      let byteLengthCounter = 0;
      const chunks = [];
      const reader = stream.getReader();
      let isDone = false;
      while (!isDone) {
        const { done, value } = await reader.read();
        if (value) {
          chunks.push(value);
          byteLengthCounter += (_a = value === null || value === void 0 ? void 0 : value.byteLength) !== null && _a !== void 0 ? _a : 0;
        }
        if (byteLengthCounter >= bytes) {
          break;
        }
        isDone = done;
      }
      reader.releaseLock();
      const collected = new Uint8Array(Math.min(bytes, byteLengthCounter));
      let offset = 0;
      for (const chunk of chunks) {
        if (chunk.byteLength > collected.byteLength - offset) {
          collected.set(chunk.subarray(0, collected.byteLength - offset), offset);
          break;
        } else {
          collected.set(chunk, offset);
        }
        offset += chunk.length;
      }
      return collected;
    }
    exports2.headStream = headStream2;
  }
});

// node_modules/@smithy/util-stream/dist-cjs/headStream.js
var require_headStream = __commonJS({
  "node_modules/@smithy/util-stream/dist-cjs/headStream.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.headStream = void 0;
    var stream_1 = require("stream");
    var headStream_browser_1 = require_headStream_browser();
    var stream_type_check_1 = require_stream_type_check();
    var headStream2 = (stream, bytes) => {
      if ((0, stream_type_check_1.isReadableStream)(stream)) {
        return (0, headStream_browser_1.headStream)(stream, bytes);
      }
      return new Promise((resolve, reject) => {
        const collector = new Collector();
        collector.limit = bytes;
        stream.pipe(collector);
        stream.on("error", (err) => {
          collector.end();
          reject(err);
        });
        collector.on("error", reject);
        collector.on("finish", function() {
          const bytes2 = new Uint8Array(Buffer.concat(this.buffers));
          resolve(bytes2);
        });
      });
    };
    exports2.headStream = headStream2;
    var Collector = class extends stream_1.Writable {
      constructor() {
        super(...arguments);
        this.buffers = [];
        this.limit = Infinity;
        this.bytesBuffered = 0;
      }
      _write(chunk, encoding, callback) {
        var _a;
        this.buffers.push(chunk);
        this.bytesBuffered += (_a = chunk.byteLength) !== null && _a !== void 0 ? _a : 0;
        if (this.bytesBuffered >= this.limit) {
          const excess = this.bytesBuffered - this.limit;
          const tailBuffer = this.buffers[this.buffers.length - 1];
          this.buffers[this.buffers.length - 1] = tailBuffer.subarray(0, tailBuffer.byteLength - excess);
          this.emit("finish");
        }
        callback();
      }
    };
  }
});

// node_modules/@smithy/util-stream/dist-cjs/index.js
var require_dist_cjs31 = __commonJS({
  "node_modules/@smithy/util-stream/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __reExport = (target, mod, secondTarget) => (__copyProps2(target, mod, "default"), secondTarget && __copyProps2(secondTarget, mod, "default"));
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      Uint8ArrayBlobAdapter: () => Uint8ArrayBlobAdapter
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_util_base64 = require_dist_cjs25();
    var import_util_utf8 = require_dist_cjs24();
    function transformToString(payload, encoding = "utf-8") {
      if (encoding === "base64") {
        return (0, import_util_base64.toBase64)(payload);
      }
      return (0, import_util_utf8.toUtf8)(payload);
    }
    __name(transformToString, "transformToString");
    function transformFromString(str, encoding) {
      if (encoding === "base64") {
        return Uint8ArrayBlobAdapter.mutate((0, import_util_base64.fromBase64)(str));
      }
      return Uint8ArrayBlobAdapter.mutate((0, import_util_utf8.fromUtf8)(str));
    }
    __name(transformFromString, "transformFromString");
    var _Uint8ArrayBlobAdapter = class _Uint8ArrayBlobAdapter2 extends Uint8Array {
      /**
       * @param source - such as a string or Stream.
       * @returns a new Uint8ArrayBlobAdapter extending Uint8Array.
       */
      static fromString(source, encoding = "utf-8") {
        switch (typeof source) {
          case "string":
            return transformFromString(source, encoding);
          default:
            throw new Error(`Unsupported conversion from ${typeof source} to Uint8ArrayBlobAdapter.`);
        }
      }
      /**
       * @param source - Uint8Array to be mutated.
       * @returns the same Uint8Array but with prototype switched to Uint8ArrayBlobAdapter.
       */
      static mutate(source) {
        Object.setPrototypeOf(source, _Uint8ArrayBlobAdapter2.prototype);
        return source;
      }
      /**
       * @param encoding - default 'utf-8'.
       * @returns the blob as string.
       */
      transformToString(encoding = "utf-8") {
        return transformToString(this, encoding);
      }
    };
    __name(_Uint8ArrayBlobAdapter, "Uint8ArrayBlobAdapter");
    var Uint8ArrayBlobAdapter = _Uint8ArrayBlobAdapter;
    __reExport(src_exports, require_getAwsChunkedEncodingStream(), module2.exports);
    __reExport(src_exports, require_sdk_stream_mixin(), module2.exports);
    __reExport(src_exports, require_splitStream(), module2.exports);
    __reExport(src_exports, require_headStream(), module2.exports);
    __reExport(src_exports, require_stream_type_check(), module2.exports);
  }
});

// node_modules/@smithy/smithy-client/dist-cjs/index.js
var require_dist_cjs32 = __commonJS({
  "node_modules/@smithy/smithy-client/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      Client: () => Client2,
      Command: () => Command,
      LazyJsonString: () => LazyJsonString,
      NoOpLogger: () => NoOpLogger,
      SENSITIVE_STRING: () => SENSITIVE_STRING,
      ServiceException: () => ServiceException,
      StringWrapper: () => StringWrapper,
      _json: () => _json,
      collectBody: () => collectBody2,
      convertMap: () => convertMap,
      createAggregatedClient: () => createAggregatedClient,
      dateToUtcString: () => dateToUtcString,
      decorateServiceException: () => decorateServiceException,
      emitWarningIfUnsupportedVersion: () => emitWarningIfUnsupportedVersion2,
      expectBoolean: () => expectBoolean,
      expectByte: () => expectByte,
      expectFloat32: () => expectFloat32,
      expectInt: () => expectInt,
      expectInt32: () => expectInt32,
      expectLong: () => expectLong,
      expectNonNull: () => expectNonNull,
      expectNumber: () => expectNumber,
      expectObject: () => expectObject,
      expectShort: () => expectShort,
      expectString: () => expectString,
      expectUnion: () => expectUnion2,
      extendedEncodeURIComponent: () => extendedEncodeURIComponent,
      getArrayIfSingleItem: () => getArrayIfSingleItem,
      getDefaultClientConfiguration: () => getDefaultClientConfiguration,
      getDefaultExtensionConfiguration: () => getDefaultExtensionConfiguration,
      getValueFromTextNode: () => getValueFromTextNode2,
      handleFloat: () => handleFloat,
      limitedParseDouble: () => limitedParseDouble,
      limitedParseFloat: () => limitedParseFloat,
      limitedParseFloat32: () => limitedParseFloat32,
      loadConfigsForDefaultMode: () => loadConfigsForDefaultMode,
      logger: () => logger,
      map: () => map,
      parseBoolean: () => parseBoolean,
      parseEpochTimestamp: () => parseEpochTimestamp,
      parseRfc3339DateTime: () => parseRfc3339DateTime,
      parseRfc3339DateTimeWithOffset: () => parseRfc3339DateTimeWithOffset,
      parseRfc7231DateTime: () => parseRfc7231DateTime,
      resolveDefaultRuntimeConfig: () => resolveDefaultRuntimeConfig,
      resolvedPath: () => resolvedPath2,
      serializeDateTime: () => serializeDateTime,
      serializeFloat: () => serializeFloat,
      splitEvery: () => splitEvery,
      strictParseByte: () => strictParseByte,
      strictParseDouble: () => strictParseDouble,
      strictParseFloat: () => strictParseFloat,
      strictParseFloat32: () => strictParseFloat32,
      strictParseInt: () => strictParseInt,
      strictParseInt32: () => strictParseInt32,
      strictParseLong: () => strictParseLong,
      strictParseShort: () => strictParseShort,
      take: () => take,
      throwDefaultError: () => throwDefaultError,
      withBaseException: () => withBaseException
    });
    module2.exports = __toCommonJS2(src_exports);
    var _NoOpLogger = class _NoOpLogger {
      trace() {
      }
      debug() {
      }
      info() {
      }
      warn() {
      }
      error() {
      }
    };
    __name(_NoOpLogger, "NoOpLogger");
    var NoOpLogger = _NoOpLogger;
    var import_middleware_stack = require_dist_cjs21();
    var _Client = class _Client {
      constructor(config) {
        this.middlewareStack = (0, import_middleware_stack.constructStack)();
        this.config = config;
      }
      send(command, optionsOrCb, cb) {
        const options = typeof optionsOrCb !== "function" ? optionsOrCb : void 0;
        const callback = typeof optionsOrCb === "function" ? optionsOrCb : cb;
        const handler = command.resolveMiddleware(this.middlewareStack, this.config, options);
        if (callback) {
          handler(command).then(
            (result) => callback(null, result.output),
            (err) => callback(err)
          ).catch(
            // prevent any errors thrown in the callback from triggering an
            // unhandled promise rejection
            () => {
            }
          );
        } else {
          return handler(command).then((result) => result.output);
        }
      }
      destroy() {
        if (this.config.requestHandler.destroy)
          this.config.requestHandler.destroy();
      }
    };
    __name(_Client, "Client");
    var Client2 = _Client;
    var import_util_stream = require_dist_cjs31();
    var collectBody2 = /* @__PURE__ */ __name(async (streamBody = new Uint8Array(), context) => {
      if (streamBody instanceof Uint8Array) {
        return import_util_stream.Uint8ArrayBlobAdapter.mutate(streamBody);
      }
      if (!streamBody) {
        return import_util_stream.Uint8ArrayBlobAdapter.mutate(new Uint8Array());
      }
      const fromContext = context.streamCollector(streamBody);
      return import_util_stream.Uint8ArrayBlobAdapter.mutate(await fromContext);
    }, "collectBody");
    var import_types5 = require_dist_cjs();
    var _Command = class _Command {
      constructor() {
        this.middlewareStack = (0, import_middleware_stack.constructStack)();
      }
      /**
       * Factory for Command ClassBuilder.
       * @internal
       */
      static classBuilder() {
        return new ClassBuilder();
      }
      /**
       * @internal
       */
      resolveMiddlewareWithContext(clientStack, configuration, options, {
        middlewareFn,
        clientName,
        commandName,
        inputFilterSensitiveLog,
        outputFilterSensitiveLog,
        smithyContext,
        additionalContext,
        CommandCtor
      }) {
        for (const mw of middlewareFn.bind(this)(CommandCtor, clientStack, configuration, options)) {
          this.middlewareStack.use(mw);
        }
        const stack = clientStack.concat(this.middlewareStack);
        const { logger: logger2 } = configuration;
        const handlerExecutionContext = {
          logger: logger2,
          clientName,
          commandName,
          inputFilterSensitiveLog,
          outputFilterSensitiveLog,
          [import_types5.SMITHY_CONTEXT_KEY]: {
            commandInstance: this,
            ...smithyContext
          },
          ...additionalContext
        };
        const { requestHandler } = configuration;
        return stack.resolve(
          (request) => requestHandler.handle(request.request, options || {}),
          handlerExecutionContext
        );
      }
    };
    __name(_Command, "Command");
    var Command = _Command;
    var _ClassBuilder = class _ClassBuilder {
      constructor() {
        this._init = () => {
        };
        this._ep = {};
        this._middlewareFn = () => [];
        this._commandName = "";
        this._clientName = "";
        this._additionalContext = {};
        this._smithyContext = {};
        this._inputFilterSensitiveLog = (_) => _;
        this._outputFilterSensitiveLog = (_) => _;
        this._serializer = null;
        this._deserializer = null;
      }
      /**
       * Optional init callback.
       */
      init(cb) {
        this._init = cb;
      }
      /**
       * Set the endpoint parameter instructions.
       */
      ep(endpointParameterInstructions) {
        this._ep = endpointParameterInstructions;
        return this;
      }
      /**
       * Add any number of middleware.
       */
      m(middlewareSupplier) {
        this._middlewareFn = middlewareSupplier;
        return this;
      }
      /**
       * Set the initial handler execution context Smithy field.
       */
      s(service, operation, smithyContext = {}) {
        this._smithyContext = {
          service,
          operation,
          ...smithyContext
        };
        return this;
      }
      /**
       * Set the initial handler execution context.
       */
      c(additionalContext = {}) {
        this._additionalContext = additionalContext;
        return this;
      }
      /**
       * Set constant string identifiers for the operation.
       */
      n(clientName, commandName) {
        this._clientName = clientName;
        this._commandName = commandName;
        return this;
      }
      /**
       * Set the input and output sensistive log filters.
       */
      f(inputFilter = (_) => _, outputFilter = (_) => _) {
        this._inputFilterSensitiveLog = inputFilter;
        this._outputFilterSensitiveLog = outputFilter;
        return this;
      }
      /**
       * Sets the serializer.
       */
      ser(serializer) {
        this._serializer = serializer;
        return this;
      }
      /**
       * Sets the deserializer.
       */
      de(deserializer) {
        this._deserializer = deserializer;
        return this;
      }
      /**
       * @returns a Command class with the classBuilder properties.
       */
      build() {
        var _a;
        const closure = this;
        let CommandRef;
        return CommandRef = (_a = class extends Command {
          /**
           * @public
           */
          constructor(...[input]) {
            super();
            this.serialize = closure._serializer;
            this.deserialize = closure._deserializer;
            this.input = input ?? {};
            closure._init(this);
          }
          /**
           * @public
           */
          static getEndpointParameterInstructions() {
            return closure._ep;
          }
          /**
           * @internal
           */
          resolveMiddleware(stack, configuration, options) {
            return this.resolveMiddlewareWithContext(stack, configuration, options, {
              CommandCtor: CommandRef,
              middlewareFn: closure._middlewareFn,
              clientName: closure._clientName,
              commandName: closure._commandName,
              inputFilterSensitiveLog: closure._inputFilterSensitiveLog,
              outputFilterSensitiveLog: closure._outputFilterSensitiveLog,
              smithyContext: closure._smithyContext,
              additionalContext: closure._additionalContext
            });
          }
        }, __name(_a, "CommandRef"), _a);
      }
    };
    __name(_ClassBuilder, "ClassBuilder");
    var ClassBuilder = _ClassBuilder;
    var SENSITIVE_STRING = "***SensitiveInformation***";
    var createAggregatedClient = /* @__PURE__ */ __name((commands, Client22) => {
      for (const command of Object.keys(commands)) {
        const CommandCtor = commands[command];
        const methodImpl = /* @__PURE__ */ __name(async function(args, optionsOrCb, cb) {
          const command2 = new CommandCtor(args);
          if (typeof optionsOrCb === "function") {
            this.send(command2, optionsOrCb);
          } else if (typeof cb === "function") {
            if (typeof optionsOrCb !== "object")
              throw new Error(`Expected http options but got ${typeof optionsOrCb}`);
            this.send(command2, optionsOrCb || {}, cb);
          } else {
            return this.send(command2, optionsOrCb);
          }
        }, "methodImpl");
        const methodName = (command[0].toLowerCase() + command.slice(1)).replace(/Command$/, "");
        Client22.prototype[methodName] = methodImpl;
      }
    }, "createAggregatedClient");
    var parseBoolean = /* @__PURE__ */ __name((value) => {
      switch (value) {
        case "true":
          return true;
        case "false":
          return false;
        default:
          throw new Error(`Unable to parse boolean value "${value}"`);
      }
    }, "parseBoolean");
    var expectBoolean = /* @__PURE__ */ __name((value) => {
      if (value === null || value === void 0) {
        return void 0;
      }
      if (typeof value === "number") {
        if (value === 0 || value === 1) {
          logger.warn(stackTraceWarning(`Expected boolean, got ${typeof value}: ${value}`));
        }
        if (value === 0) {
          return false;
        }
        if (value === 1) {
          return true;
        }
      }
      if (typeof value === "string") {
        const lower = value.toLowerCase();
        if (lower === "false" || lower === "true") {
          logger.warn(stackTraceWarning(`Expected boolean, got ${typeof value}: ${value}`));
        }
        if (lower === "false") {
          return false;
        }
        if (lower === "true") {
          return true;
        }
      }
      if (typeof value === "boolean") {
        return value;
      }
      throw new TypeError(`Expected boolean, got ${typeof value}: ${value}`);
    }, "expectBoolean");
    var expectNumber = /* @__PURE__ */ __name((value) => {
      if (value === null || value === void 0) {
        return void 0;
      }
      if (typeof value === "string") {
        const parsed = parseFloat(value);
        if (!Number.isNaN(parsed)) {
          if (String(parsed) !== String(value)) {
            logger.warn(stackTraceWarning(`Expected number but observed string: ${value}`));
          }
          return parsed;
        }
      }
      if (typeof value === "number") {
        return value;
      }
      throw new TypeError(`Expected number, got ${typeof value}: ${value}`);
    }, "expectNumber");
    var MAX_FLOAT = Math.ceil(2 ** 127 * (2 - 2 ** -23));
    var expectFloat32 = /* @__PURE__ */ __name((value) => {
      const expected = expectNumber(value);
      if (expected !== void 0 && !Number.isNaN(expected) && expected !== Infinity && expected !== -Infinity) {
        if (Math.abs(expected) > MAX_FLOAT) {
          throw new TypeError(`Expected 32-bit float, got ${value}`);
        }
      }
      return expected;
    }, "expectFloat32");
    var expectLong = /* @__PURE__ */ __name((value) => {
      if (value === null || value === void 0) {
        return void 0;
      }
      if (Number.isInteger(value) && !Number.isNaN(value)) {
        return value;
      }
      throw new TypeError(`Expected integer, got ${typeof value}: ${value}`);
    }, "expectLong");
    var expectInt = expectLong;
    var expectInt32 = /* @__PURE__ */ __name((value) => expectSizedInt(value, 32), "expectInt32");
    var expectShort = /* @__PURE__ */ __name((value) => expectSizedInt(value, 16), "expectShort");
    var expectByte = /* @__PURE__ */ __name((value) => expectSizedInt(value, 8), "expectByte");
    var expectSizedInt = /* @__PURE__ */ __name((value, size) => {
      const expected = expectLong(value);
      if (expected !== void 0 && castInt(expected, size) !== expected) {
        throw new TypeError(`Expected ${size}-bit integer, got ${value}`);
      }
      return expected;
    }, "expectSizedInt");
    var castInt = /* @__PURE__ */ __name((value, size) => {
      switch (size) {
        case 32:
          return Int32Array.of(value)[0];
        case 16:
          return Int16Array.of(value)[0];
        case 8:
          return Int8Array.of(value)[0];
      }
    }, "castInt");
    var expectNonNull = /* @__PURE__ */ __name((value, location) => {
      if (value === null || value === void 0) {
        if (location) {
          throw new TypeError(`Expected a non-null value for ${location}`);
        }
        throw new TypeError("Expected a non-null value");
      }
      return value;
    }, "expectNonNull");
    var expectObject = /* @__PURE__ */ __name((value) => {
      if (value === null || value === void 0) {
        return void 0;
      }
      if (typeof value === "object" && !Array.isArray(value)) {
        return value;
      }
      const receivedType = Array.isArray(value) ? "array" : typeof value;
      throw new TypeError(`Expected object, got ${receivedType}: ${value}`);
    }, "expectObject");
    var expectString = /* @__PURE__ */ __name((value) => {
      if (value === null || value === void 0) {
        return void 0;
      }
      if (typeof value === "string") {
        return value;
      }
      if (["boolean", "number", "bigint"].includes(typeof value)) {
        logger.warn(stackTraceWarning(`Expected string, got ${typeof value}: ${value}`));
        return String(value);
      }
      throw new TypeError(`Expected string, got ${typeof value}: ${value}`);
    }, "expectString");
    var expectUnion2 = /* @__PURE__ */ __name((value) => {
      if (value === null || value === void 0) {
        return void 0;
      }
      const asObject = expectObject(value);
      const setKeys = Object.entries(asObject).filter(([, v]) => v != null).map(([k]) => k);
      if (setKeys.length === 0) {
        throw new TypeError(`Unions must have exactly one non-null member. None were found.`);
      }
      if (setKeys.length > 1) {
        throw new TypeError(`Unions must have exactly one non-null member. Keys ${setKeys} were not null.`);
      }
      return asObject;
    }, "expectUnion");
    var strictParseDouble = /* @__PURE__ */ __name((value) => {
      if (typeof value == "string") {
        return expectNumber(parseNumber(value));
      }
      return expectNumber(value);
    }, "strictParseDouble");
    var strictParseFloat = strictParseDouble;
    var strictParseFloat32 = /* @__PURE__ */ __name((value) => {
      if (typeof value == "string") {
        return expectFloat32(parseNumber(value));
      }
      return expectFloat32(value);
    }, "strictParseFloat32");
    var NUMBER_REGEX = /(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)|(-?Infinity)|(NaN)/g;
    var parseNumber = /* @__PURE__ */ __name((value) => {
      const matches = value.match(NUMBER_REGEX);
      if (matches === null || matches[0].length !== value.length) {
        throw new TypeError(`Expected real number, got implicit NaN`);
      }
      return parseFloat(value);
    }, "parseNumber");
    var limitedParseDouble = /* @__PURE__ */ __name((value) => {
      if (typeof value == "string") {
        return parseFloatString(value);
      }
      return expectNumber(value);
    }, "limitedParseDouble");
    var handleFloat = limitedParseDouble;
    var limitedParseFloat = limitedParseDouble;
    var limitedParseFloat32 = /* @__PURE__ */ __name((value) => {
      if (typeof value == "string") {
        return parseFloatString(value);
      }
      return expectFloat32(value);
    }, "limitedParseFloat32");
    var parseFloatString = /* @__PURE__ */ __name((value) => {
      switch (value) {
        case "NaN":
          return NaN;
        case "Infinity":
          return Infinity;
        case "-Infinity":
          return -Infinity;
        default:
          throw new Error(`Unable to parse float value: ${value}`);
      }
    }, "parseFloatString");
    var strictParseLong = /* @__PURE__ */ __name((value) => {
      if (typeof value === "string") {
        return expectLong(parseNumber(value));
      }
      return expectLong(value);
    }, "strictParseLong");
    var strictParseInt = strictParseLong;
    var strictParseInt32 = /* @__PURE__ */ __name((value) => {
      if (typeof value === "string") {
        return expectInt32(parseNumber(value));
      }
      return expectInt32(value);
    }, "strictParseInt32");
    var strictParseShort = /* @__PURE__ */ __name((value) => {
      if (typeof value === "string") {
        return expectShort(parseNumber(value));
      }
      return expectShort(value);
    }, "strictParseShort");
    var strictParseByte = /* @__PURE__ */ __name((value) => {
      if (typeof value === "string") {
        return expectByte(parseNumber(value));
      }
      return expectByte(value);
    }, "strictParseByte");
    var stackTraceWarning = /* @__PURE__ */ __name((message) => {
      return String(new TypeError(message).stack || message).split("\n").slice(0, 5).filter((s) => !s.includes("stackTraceWarning")).join("\n");
    }, "stackTraceWarning");
    var logger = {
      warn: console.warn
    };
    var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    function dateToUtcString(date) {
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const dayOfWeek = date.getUTCDay();
      const dayOfMonthInt = date.getUTCDate();
      const hoursInt = date.getUTCHours();
      const minutesInt = date.getUTCMinutes();
      const secondsInt = date.getUTCSeconds();
      const dayOfMonthString = dayOfMonthInt < 10 ? `0${dayOfMonthInt}` : `${dayOfMonthInt}`;
      const hoursString = hoursInt < 10 ? `0${hoursInt}` : `${hoursInt}`;
      const minutesString = minutesInt < 10 ? `0${minutesInt}` : `${minutesInt}`;
      const secondsString = secondsInt < 10 ? `0${secondsInt}` : `${secondsInt}`;
      return `${DAYS[dayOfWeek]}, ${dayOfMonthString} ${MONTHS[month]} ${year} ${hoursString}:${minutesString}:${secondsString} GMT`;
    }
    __name(dateToUtcString, "dateToUtcString");
    var RFC3339 = new RegExp(/^(\d{4})-(\d{2})-(\d{2})[tT](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?[zZ]$/);
    var parseRfc3339DateTime = /* @__PURE__ */ __name((value) => {
      if (value === null || value === void 0) {
        return void 0;
      }
      if (typeof value !== "string") {
        throw new TypeError("RFC-3339 date-times must be expressed as strings");
      }
      const match = RFC3339.exec(value);
      if (!match) {
        throw new TypeError("Invalid RFC-3339 date-time value");
      }
      const [_, yearStr, monthStr, dayStr, hours, minutes, seconds, fractionalMilliseconds] = match;
      const year = strictParseShort(stripLeadingZeroes(yearStr));
      const month = parseDateValue(monthStr, "month", 1, 12);
      const day = parseDateValue(dayStr, "day", 1, 31);
      return buildDate(year, month, day, { hours, minutes, seconds, fractionalMilliseconds });
    }, "parseRfc3339DateTime");
    var RFC3339_WITH_OFFSET = new RegExp(
      /^(\d{4})-(\d{2})-(\d{2})[tT](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(([-+]\d{2}\:\d{2})|[zZ])$/
    );
    var parseRfc3339DateTimeWithOffset = /* @__PURE__ */ __name((value) => {
      if (value === null || value === void 0) {
        return void 0;
      }
      if (typeof value !== "string") {
        throw new TypeError("RFC-3339 date-times must be expressed as strings");
      }
      const match = RFC3339_WITH_OFFSET.exec(value);
      if (!match) {
        throw new TypeError("Invalid RFC-3339 date-time value");
      }
      const [_, yearStr, monthStr, dayStr, hours, minutes, seconds, fractionalMilliseconds, offsetStr] = match;
      const year = strictParseShort(stripLeadingZeroes(yearStr));
      const month = parseDateValue(monthStr, "month", 1, 12);
      const day = parseDateValue(dayStr, "day", 1, 31);
      const date = buildDate(year, month, day, { hours, minutes, seconds, fractionalMilliseconds });
      if (offsetStr.toUpperCase() != "Z") {
        date.setTime(date.getTime() - parseOffsetToMilliseconds(offsetStr));
      }
      return date;
    }, "parseRfc3339DateTimeWithOffset");
    var IMF_FIXDATE = new RegExp(
      /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d{2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d{1,2}):(\d{2}):(\d{2})(?:\.(\d+))? GMT$/
    );
    var RFC_850_DATE = new RegExp(
      /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\d{2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{2}) (\d{1,2}):(\d{2}):(\d{2})(?:\.(\d+))? GMT$/
    );
    var ASC_TIME = new RegExp(
      /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( [1-9]|\d{2}) (\d{1,2}):(\d{2}):(\d{2})(?:\.(\d+))? (\d{4})$/
    );
    var parseRfc7231DateTime = /* @__PURE__ */ __name((value) => {
      if (value === null || value === void 0) {
        return void 0;
      }
      if (typeof value !== "string") {
        throw new TypeError("RFC-7231 date-times must be expressed as strings");
      }
      let match = IMF_FIXDATE.exec(value);
      if (match) {
        const [_, dayStr, monthStr, yearStr, hours, minutes, seconds, fractionalMilliseconds] = match;
        return buildDate(
          strictParseShort(stripLeadingZeroes(yearStr)),
          parseMonthByShortName(monthStr),
          parseDateValue(dayStr, "day", 1, 31),
          { hours, minutes, seconds, fractionalMilliseconds }
        );
      }
      match = RFC_850_DATE.exec(value);
      if (match) {
        const [_, dayStr, monthStr, yearStr, hours, minutes, seconds, fractionalMilliseconds] = match;
        return adjustRfc850Year(
          buildDate(parseTwoDigitYear(yearStr), parseMonthByShortName(monthStr), parseDateValue(dayStr, "day", 1, 31), {
            hours,
            minutes,
            seconds,
            fractionalMilliseconds
          })
        );
      }
      match = ASC_TIME.exec(value);
      if (match) {
        const [_, monthStr, dayStr, hours, minutes, seconds, fractionalMilliseconds, yearStr] = match;
        return buildDate(
          strictParseShort(stripLeadingZeroes(yearStr)),
          parseMonthByShortName(monthStr),
          parseDateValue(dayStr.trimLeft(), "day", 1, 31),
          { hours, minutes, seconds, fractionalMilliseconds }
        );
      }
      throw new TypeError("Invalid RFC-7231 date-time value");
    }, "parseRfc7231DateTime");
    var parseEpochTimestamp = /* @__PURE__ */ __name((value) => {
      if (value === null || value === void 0) {
        return void 0;
      }
      let valueAsDouble;
      if (typeof value === "number") {
        valueAsDouble = value;
      } else if (typeof value === "string") {
        valueAsDouble = strictParseDouble(value);
      } else if (typeof value === "object" && value.tag === 1) {
        valueAsDouble = value.value;
      } else {
        throw new TypeError("Epoch timestamps must be expressed as floating point numbers or their string representation");
      }
      if (Number.isNaN(valueAsDouble) || valueAsDouble === Infinity || valueAsDouble === -Infinity) {
        throw new TypeError("Epoch timestamps must be valid, non-Infinite, non-NaN numerics");
      }
      return new Date(Math.round(valueAsDouble * 1e3));
    }, "parseEpochTimestamp");
    var buildDate = /* @__PURE__ */ __name((year, month, day, time) => {
      const adjustedMonth = month - 1;
      validateDayOfMonth(year, adjustedMonth, day);
      return new Date(
        Date.UTC(
          year,
          adjustedMonth,
          day,
          parseDateValue(time.hours, "hour", 0, 23),
          parseDateValue(time.minutes, "minute", 0, 59),
          // seconds can go up to 60 for leap seconds
          parseDateValue(time.seconds, "seconds", 0, 60),
          parseMilliseconds(time.fractionalMilliseconds)
        )
      );
    }, "buildDate");
    var parseTwoDigitYear = /* @__PURE__ */ __name((value) => {
      const thisYear = (/* @__PURE__ */ new Date()).getUTCFullYear();
      const valueInThisCentury = Math.floor(thisYear / 100) * 100 + strictParseShort(stripLeadingZeroes(value));
      if (valueInThisCentury < thisYear) {
        return valueInThisCentury + 100;
      }
      return valueInThisCentury;
    }, "parseTwoDigitYear");
    var FIFTY_YEARS_IN_MILLIS = 50 * 365 * 24 * 60 * 60 * 1e3;
    var adjustRfc850Year = /* @__PURE__ */ __name((input) => {
      if (input.getTime() - (/* @__PURE__ */ new Date()).getTime() > FIFTY_YEARS_IN_MILLIS) {
        return new Date(
          Date.UTC(
            input.getUTCFullYear() - 100,
            input.getUTCMonth(),
            input.getUTCDate(),
            input.getUTCHours(),
            input.getUTCMinutes(),
            input.getUTCSeconds(),
            input.getUTCMilliseconds()
          )
        );
      }
      return input;
    }, "adjustRfc850Year");
    var parseMonthByShortName = /* @__PURE__ */ __name((value) => {
      const monthIdx = MONTHS.indexOf(value);
      if (monthIdx < 0) {
        throw new TypeError(`Invalid month: ${value}`);
      }
      return monthIdx + 1;
    }, "parseMonthByShortName");
    var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var validateDayOfMonth = /* @__PURE__ */ __name((year, month, day) => {
      let maxDays = DAYS_IN_MONTH[month];
      if (month === 1 && isLeapYear(year)) {
        maxDays = 29;
      }
      if (day > maxDays) {
        throw new TypeError(`Invalid day for ${MONTHS[month]} in ${year}: ${day}`);
      }
    }, "validateDayOfMonth");
    var isLeapYear = /* @__PURE__ */ __name((year) => {
      return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }, "isLeapYear");
    var parseDateValue = /* @__PURE__ */ __name((value, type, lower, upper) => {
      const dateVal = strictParseByte(stripLeadingZeroes(value));
      if (dateVal < lower || dateVal > upper) {
        throw new TypeError(`${type} must be between ${lower} and ${upper}, inclusive`);
      }
      return dateVal;
    }, "parseDateValue");
    var parseMilliseconds = /* @__PURE__ */ __name((value) => {
      if (value === null || value === void 0) {
        return 0;
      }
      return strictParseFloat32("0." + value) * 1e3;
    }, "parseMilliseconds");
    var parseOffsetToMilliseconds = /* @__PURE__ */ __name((value) => {
      const directionStr = value[0];
      let direction = 1;
      if (directionStr == "+") {
        direction = 1;
      } else if (directionStr == "-") {
        direction = -1;
      } else {
        throw new TypeError(`Offset direction, ${directionStr}, must be "+" or "-"`);
      }
      const hour = Number(value.substring(1, 3));
      const minute = Number(value.substring(4, 6));
      return direction * (hour * 60 + minute) * 60 * 1e3;
    }, "parseOffsetToMilliseconds");
    var stripLeadingZeroes = /* @__PURE__ */ __name((value) => {
      let idx = 0;
      while (idx < value.length - 1 && value.charAt(idx) === "0") {
        idx++;
      }
      if (idx === 0) {
        return value;
      }
      return value.slice(idx);
    }, "stripLeadingZeroes");
    var _ServiceException = class _ServiceException2 extends Error {
      constructor(options) {
        super(options.message);
        Object.setPrototypeOf(this, _ServiceException2.prototype);
        this.name = options.name;
        this.$fault = options.$fault;
        this.$metadata = options.$metadata;
      }
    };
    __name(_ServiceException, "ServiceException");
    var ServiceException = _ServiceException;
    var decorateServiceException = /* @__PURE__ */ __name((exception, additions = {}) => {
      Object.entries(additions).filter(([, v]) => v !== void 0).forEach(([k, v]) => {
        if (exception[k] == void 0 || exception[k] === "") {
          exception[k] = v;
        }
      });
      const message = exception.message || exception.Message || "UnknownError";
      exception.message = message;
      delete exception.Message;
      return exception;
    }, "decorateServiceException");
    var throwDefaultError = /* @__PURE__ */ __name(({ output, parsedBody, exceptionCtor, errorCode }) => {
      const $metadata = deserializeMetadata(output);
      const statusCode = $metadata.httpStatusCode ? $metadata.httpStatusCode + "" : void 0;
      const response = new exceptionCtor({
        name: (parsedBody == null ? void 0 : parsedBody.code) || (parsedBody == null ? void 0 : parsedBody.Code) || errorCode || statusCode || "UnknownError",
        $fault: "client",
        $metadata
      });
      throw decorateServiceException(response, parsedBody);
    }, "throwDefaultError");
    var withBaseException = /* @__PURE__ */ __name((ExceptionCtor) => {
      return ({ output, parsedBody, errorCode }) => {
        throwDefaultError({ output, parsedBody, exceptionCtor: ExceptionCtor, errorCode });
      };
    }, "withBaseException");
    var deserializeMetadata = /* @__PURE__ */ __name((output) => ({
      httpStatusCode: output.statusCode,
      requestId: output.headers["x-amzn-requestid"] ?? output.headers["x-amzn-request-id"] ?? output.headers["x-amz-request-id"],
      extendedRequestId: output.headers["x-amz-id-2"],
      cfId: output.headers["x-amz-cf-id"]
    }), "deserializeMetadata");
    var loadConfigsForDefaultMode = /* @__PURE__ */ __name((mode) => {
      switch (mode) {
        case "standard":
          return {
            retryMode: "standard",
            connectionTimeout: 3100
          };
        case "in-region":
          return {
            retryMode: "standard",
            connectionTimeout: 1100
          };
        case "cross-region":
          return {
            retryMode: "standard",
            connectionTimeout: 3100
          };
        case "mobile":
          return {
            retryMode: "standard",
            connectionTimeout: 3e4
          };
        default:
          return {};
      }
    }, "loadConfigsForDefaultMode");
    var warningEmitted2 = false;
    var emitWarningIfUnsupportedVersion2 = /* @__PURE__ */ __name((version2) => {
      if (version2 && !warningEmitted2 && parseInt(version2.substring(1, version2.indexOf("."))) < 16) {
        warningEmitted2 = true;
      }
    }, "emitWarningIfUnsupportedVersion");
    var getChecksumConfiguration = /* @__PURE__ */ __name((runtimeConfig) => {
      const checksumAlgorithms = [];
      for (const id in import_types5.AlgorithmId) {
        const algorithmId = import_types5.AlgorithmId[id];
        if (runtimeConfig[algorithmId] === void 0) {
          continue;
        }
        checksumAlgorithms.push({
          algorithmId: () => algorithmId,
          checksumConstructor: () => runtimeConfig[algorithmId]
        });
      }
      return {
        _checksumAlgorithms: checksumAlgorithms,
        addChecksumAlgorithm(algo) {
          this._checksumAlgorithms.push(algo);
        },
        checksumAlgorithms() {
          return this._checksumAlgorithms;
        }
      };
    }, "getChecksumConfiguration");
    var resolveChecksumRuntimeConfig = /* @__PURE__ */ __name((clientConfig) => {
      const runtimeConfig = {};
      clientConfig.checksumAlgorithms().forEach((checksumAlgorithm) => {
        runtimeConfig[checksumAlgorithm.algorithmId()] = checksumAlgorithm.checksumConstructor();
      });
      return runtimeConfig;
    }, "resolveChecksumRuntimeConfig");
    var getRetryConfiguration = /* @__PURE__ */ __name((runtimeConfig) => {
      let _retryStrategy = runtimeConfig.retryStrategy;
      return {
        setRetryStrategy(retryStrategy) {
          _retryStrategy = retryStrategy;
        },
        retryStrategy() {
          return _retryStrategy;
        }
      };
    }, "getRetryConfiguration");
    var resolveRetryRuntimeConfig = /* @__PURE__ */ __name((retryStrategyConfiguration) => {
      const runtimeConfig = {};
      runtimeConfig.retryStrategy = retryStrategyConfiguration.retryStrategy();
      return runtimeConfig;
    }, "resolveRetryRuntimeConfig");
    var getDefaultExtensionConfiguration = /* @__PURE__ */ __name((runtimeConfig) => {
      return {
        ...getChecksumConfiguration(runtimeConfig),
        ...getRetryConfiguration(runtimeConfig)
      };
    }, "getDefaultExtensionConfiguration");
    var getDefaultClientConfiguration = getDefaultExtensionConfiguration;
    var resolveDefaultRuntimeConfig = /* @__PURE__ */ __name((config) => {
      return {
        ...resolveChecksumRuntimeConfig(config),
        ...resolveRetryRuntimeConfig(config)
      };
    }, "resolveDefaultRuntimeConfig");
    function extendedEncodeURIComponent(str) {
      return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
        return "%" + c.charCodeAt(0).toString(16).toUpperCase();
      });
    }
    __name(extendedEncodeURIComponent, "extendedEncodeURIComponent");
    var getArrayIfSingleItem = /* @__PURE__ */ __name((mayBeArray) => Array.isArray(mayBeArray) ? mayBeArray : [mayBeArray], "getArrayIfSingleItem");
    var getValueFromTextNode2 = /* @__PURE__ */ __name((obj) => {
      const textNodeName = "#text";
      for (const key in obj) {
        if (obj.hasOwnProperty(key) && obj[key][textNodeName] !== void 0) {
          obj[key] = obj[key][textNodeName];
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          obj[key] = getValueFromTextNode2(obj[key]);
        }
      }
      return obj;
    }, "getValueFromTextNode");
    var StringWrapper = /* @__PURE__ */ __name(function() {
      const Class = Object.getPrototypeOf(this).constructor;
      const Constructor = Function.bind.apply(String, [null, ...arguments]);
      const instance = new Constructor();
      Object.setPrototypeOf(instance, Class.prototype);
      return instance;
    }, "StringWrapper");
    StringWrapper.prototype = Object.create(String.prototype, {
      constructor: {
        value: StringWrapper,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    Object.setPrototypeOf(StringWrapper, String);
    var _LazyJsonString = class _LazyJsonString2 extends StringWrapper {
      deserializeJSON() {
        return JSON.parse(super.toString());
      }
      toJSON() {
        return super.toString();
      }
      static fromObject(object) {
        if (object instanceof _LazyJsonString2) {
          return object;
        } else if (object instanceof String || typeof object === "string") {
          return new _LazyJsonString2(object);
        }
        return new _LazyJsonString2(JSON.stringify(object));
      }
    };
    __name(_LazyJsonString, "LazyJsonString");
    var LazyJsonString = _LazyJsonString;
    function map(arg0, arg1, arg2) {
      let target;
      let filter;
      let instructions;
      if (typeof arg1 === "undefined" && typeof arg2 === "undefined") {
        target = {};
        instructions = arg0;
      } else {
        target = arg0;
        if (typeof arg1 === "function") {
          filter = arg1;
          instructions = arg2;
          return mapWithFilter(target, filter, instructions);
        } else {
          instructions = arg1;
        }
      }
      for (const key of Object.keys(instructions)) {
        if (!Array.isArray(instructions[key])) {
          target[key] = instructions[key];
          continue;
        }
        applyInstruction(target, null, instructions, key);
      }
      return target;
    }
    __name(map, "map");
    var convertMap = /* @__PURE__ */ __name((target) => {
      const output = {};
      for (const [k, v] of Object.entries(target || {})) {
        output[k] = [, v];
      }
      return output;
    }, "convertMap");
    var take = /* @__PURE__ */ __name((source, instructions) => {
      const out = {};
      for (const key in instructions) {
        applyInstruction(out, source, instructions, key);
      }
      return out;
    }, "take");
    var mapWithFilter = /* @__PURE__ */ __name((target, filter, instructions) => {
      return map(
        target,
        Object.entries(instructions).reduce(
          (_instructions, [key, value]) => {
            if (Array.isArray(value)) {
              _instructions[key] = value;
            } else {
              if (typeof value === "function") {
                _instructions[key] = [filter, value()];
              } else {
                _instructions[key] = [filter, value];
              }
            }
            return _instructions;
          },
          {}
        )
      );
    }, "mapWithFilter");
    var applyInstruction = /* @__PURE__ */ __name((target, source, instructions, targetKey) => {
      if (source !== null) {
        let instruction = instructions[targetKey];
        if (typeof instruction === "function") {
          instruction = [, instruction];
        }
        const [filter2 = nonNullish, valueFn = pass, sourceKey = targetKey] = instruction;
        if (typeof filter2 === "function" && filter2(source[sourceKey]) || typeof filter2 !== "function" && !!filter2) {
          target[targetKey] = valueFn(source[sourceKey]);
        }
        return;
      }
      let [filter, value] = instructions[targetKey];
      if (typeof value === "function") {
        let _value;
        const defaultFilterPassed = filter === void 0 && (_value = value()) != null;
        const customFilterPassed = typeof filter === "function" && !!filter(void 0) || typeof filter !== "function" && !!filter;
        if (defaultFilterPassed) {
          target[targetKey] = _value;
        } else if (customFilterPassed) {
          target[targetKey] = value();
        }
      } else {
        const defaultFilterPassed = filter === void 0 && value != null;
        const customFilterPassed = typeof filter === "function" && !!filter(value) || typeof filter !== "function" && !!filter;
        if (defaultFilterPassed || customFilterPassed) {
          target[targetKey] = value;
        }
      }
    }, "applyInstruction");
    var nonNullish = /* @__PURE__ */ __name((_) => _ != null, "nonNullish");
    var pass = /* @__PURE__ */ __name((_) => _, "pass");
    var resolvedPath2 = /* @__PURE__ */ __name((resolvedPath22, input, memberName, labelValueProvider, uriLabel, isGreedyLabel) => {
      if (input != null && input[memberName] !== void 0) {
        const labelValue = labelValueProvider();
        if (labelValue.length <= 0) {
          throw new Error("Empty value provided for input HTTP label: " + memberName + ".");
        }
        resolvedPath22 = resolvedPath22.replace(
          uriLabel,
          isGreedyLabel ? labelValue.split("/").map((segment) => extendedEncodeURIComponent(segment)).join("/") : extendedEncodeURIComponent(labelValue)
        );
      } else {
        throw new Error("No value provided for input HTTP label: " + memberName + ".");
      }
      return resolvedPath22;
    }, "resolvedPath");
    var serializeFloat = /* @__PURE__ */ __name((value) => {
      if (value !== value) {
        return "NaN";
      }
      switch (value) {
        case Infinity:
          return "Infinity";
        case -Infinity:
          return "-Infinity";
        default:
          return value;
      }
    }, "serializeFloat");
    var serializeDateTime = /* @__PURE__ */ __name((date) => date.toISOString().replace(".000Z", "Z"), "serializeDateTime");
    var _json = /* @__PURE__ */ __name((obj) => {
      if (obj == null) {
        return {};
      }
      if (Array.isArray(obj)) {
        return obj.filter((_) => _ != null).map(_json);
      }
      if (typeof obj === "object") {
        const target = {};
        for (const key of Object.keys(obj)) {
          if (obj[key] == null) {
            continue;
          }
          target[key] = _json(obj[key]);
        }
        return target;
      }
      return obj;
    }, "_json");
    function splitEvery(value, delimiter, numDelimiters) {
      if (numDelimiters <= 0 || !Number.isInteger(numDelimiters)) {
        throw new Error("Invalid number of delimiters (" + numDelimiters + ") for splitEvery.");
      }
      const segments = value.split(delimiter);
      if (numDelimiters === 1) {
        return segments;
      }
      const compoundSegments = [];
      let currentSegment = "";
      for (let i = 0; i < segments.length; i++) {
        if (currentSegment === "") {
          currentSegment = segments[i];
        } else {
          currentSegment += delimiter + segments[i];
        }
        if ((i + 1) % numDelimiters === 0) {
          compoundSegments.push(currentSegment);
          currentSegment = "";
        }
      }
      if (currentSegment !== "") {
        compoundSegments.push(currentSegment);
      }
      return compoundSegments;
    }
    __name(splitEvery, "splitEvery");
  }
});

// node_modules/@smithy/middleware-retry/dist-cjs/isStreamingPayload/isStreamingPayload.js
var require_isStreamingPayload = __commonJS({
  "node_modules/@smithy/middleware-retry/dist-cjs/isStreamingPayload/isStreamingPayload.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isStreamingPayload = void 0;
    var stream_1 = require("stream");
    var isStreamingPayload = (request) => (request === null || request === void 0 ? void 0 : request.body) instanceof stream_1.Readable || typeof ReadableStream !== "undefined" && (request === null || request === void 0 ? void 0 : request.body) instanceof ReadableStream;
    exports2.isStreamingPayload = isStreamingPayload;
  }
});

// node_modules/@smithy/middleware-retry/dist-cjs/index.js
var require_dist_cjs33 = __commonJS({
  "node_modules/@smithy/middleware-retry/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      AdaptiveRetryStrategy: () => AdaptiveRetryStrategy,
      CONFIG_MAX_ATTEMPTS: () => CONFIG_MAX_ATTEMPTS,
      CONFIG_RETRY_MODE: () => CONFIG_RETRY_MODE,
      ENV_MAX_ATTEMPTS: () => ENV_MAX_ATTEMPTS,
      ENV_RETRY_MODE: () => ENV_RETRY_MODE,
      NODE_MAX_ATTEMPT_CONFIG_OPTIONS: () => NODE_MAX_ATTEMPT_CONFIG_OPTIONS,
      NODE_RETRY_MODE_CONFIG_OPTIONS: () => NODE_RETRY_MODE_CONFIG_OPTIONS,
      StandardRetryStrategy: () => StandardRetryStrategy,
      defaultDelayDecider: () => defaultDelayDecider,
      defaultRetryDecider: () => defaultRetryDecider,
      getOmitRetryHeadersPlugin: () => getOmitRetryHeadersPlugin,
      getRetryAfterHint: () => getRetryAfterHint,
      getRetryPlugin: () => getRetryPlugin,
      omitRetryHeadersMiddleware: () => omitRetryHeadersMiddleware,
      omitRetryHeadersMiddlewareOptions: () => omitRetryHeadersMiddlewareOptions,
      resolveRetryConfig: () => resolveRetryConfig,
      retryMiddleware: () => retryMiddleware,
      retryMiddlewareOptions: () => retryMiddlewareOptions2
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_protocol_http8 = require_dist_cjs2();
    var import_uuid = (init_esm_node(), __toCommonJS(esm_node_exports));
    var import_util_retry = require_dist_cjs20();
    var getDefaultRetryQuota = /* @__PURE__ */ __name((initialRetryTokens, options) => {
      const MAX_CAPACITY = initialRetryTokens;
      const noRetryIncrement = (options == null ? void 0 : options.noRetryIncrement) ?? import_util_retry.NO_RETRY_INCREMENT;
      const retryCost = (options == null ? void 0 : options.retryCost) ?? import_util_retry.RETRY_COST;
      const timeoutRetryCost = (options == null ? void 0 : options.timeoutRetryCost) ?? import_util_retry.TIMEOUT_RETRY_COST;
      let availableCapacity = initialRetryTokens;
      const getCapacityAmount = /* @__PURE__ */ __name((error) => error.name === "TimeoutError" ? timeoutRetryCost : retryCost, "getCapacityAmount");
      const hasRetryTokens = /* @__PURE__ */ __name((error) => getCapacityAmount(error) <= availableCapacity, "hasRetryTokens");
      const retrieveRetryTokens = /* @__PURE__ */ __name((error) => {
        if (!hasRetryTokens(error)) {
          throw new Error("No retry token available");
        }
        const capacityAmount = getCapacityAmount(error);
        availableCapacity -= capacityAmount;
        return capacityAmount;
      }, "retrieveRetryTokens");
      const releaseRetryTokens = /* @__PURE__ */ __name((capacityReleaseAmount) => {
        availableCapacity += capacityReleaseAmount ?? noRetryIncrement;
        availableCapacity = Math.min(availableCapacity, MAX_CAPACITY);
      }, "releaseRetryTokens");
      return Object.freeze({
        hasRetryTokens,
        retrieveRetryTokens,
        releaseRetryTokens
      });
    }, "getDefaultRetryQuota");
    var defaultDelayDecider = /* @__PURE__ */ __name((delayBase, attempts) => Math.floor(Math.min(import_util_retry.MAXIMUM_RETRY_DELAY, Math.random() * 2 ** attempts * delayBase)), "defaultDelayDecider");
    var import_service_error_classification = require_dist_cjs19();
    var defaultRetryDecider = /* @__PURE__ */ __name((error) => {
      if (!error) {
        return false;
      }
      return (0, import_service_error_classification.isRetryableByTrait)(error) || (0, import_service_error_classification.isClockSkewError)(error) || (0, import_service_error_classification.isThrottlingError)(error) || (0, import_service_error_classification.isTransientError)(error);
    }, "defaultRetryDecider");
    var asSdkError = /* @__PURE__ */ __name((error) => {
      if (error instanceof Error)
        return error;
      if (error instanceof Object)
        return Object.assign(new Error(), error);
      if (typeof error === "string")
        return new Error(error);
      return new Error(`AWS SDK error wrapper for ${error}`);
    }, "asSdkError");
    var _StandardRetryStrategy = class _StandardRetryStrategy {
      constructor(maxAttemptsProvider, options) {
        this.maxAttemptsProvider = maxAttemptsProvider;
        this.mode = import_util_retry.RETRY_MODES.STANDARD;
        this.retryDecider = (options == null ? void 0 : options.retryDecider) ?? defaultRetryDecider;
        this.delayDecider = (options == null ? void 0 : options.delayDecider) ?? defaultDelayDecider;
        this.retryQuota = (options == null ? void 0 : options.retryQuota) ?? getDefaultRetryQuota(import_util_retry.INITIAL_RETRY_TOKENS);
      }
      shouldRetry(error, attempts, maxAttempts) {
        return attempts < maxAttempts && this.retryDecider(error) && this.retryQuota.hasRetryTokens(error);
      }
      async getMaxAttempts() {
        let maxAttempts;
        try {
          maxAttempts = await this.maxAttemptsProvider();
        } catch (error) {
          maxAttempts = import_util_retry.DEFAULT_MAX_ATTEMPTS;
        }
        return maxAttempts;
      }
      async retry(next, args, options) {
        let retryTokenAmount;
        let attempts = 0;
        let totalDelay = 0;
        const maxAttempts = await this.getMaxAttempts();
        const { request } = args;
        if (import_protocol_http8.HttpRequest.isInstance(request)) {
          request.headers[import_util_retry.INVOCATION_ID_HEADER] = (0, import_uuid.v4)();
        }
        while (true) {
          try {
            if (import_protocol_http8.HttpRequest.isInstance(request)) {
              request.headers[import_util_retry.REQUEST_HEADER] = `attempt=${attempts + 1}; max=${maxAttempts}`;
            }
            if (options == null ? void 0 : options.beforeRequest) {
              await options.beforeRequest();
            }
            const { response, output } = await next(args);
            if (options == null ? void 0 : options.afterRequest) {
              options.afterRequest(response);
            }
            this.retryQuota.releaseRetryTokens(retryTokenAmount);
            output.$metadata.attempts = attempts + 1;
            output.$metadata.totalRetryDelay = totalDelay;
            return { response, output };
          } catch (e) {
            const err = asSdkError(e);
            attempts++;
            if (this.shouldRetry(err, attempts, maxAttempts)) {
              retryTokenAmount = this.retryQuota.retrieveRetryTokens(err);
              const delayFromDecider = this.delayDecider(
                (0, import_service_error_classification.isThrottlingError)(err) ? import_util_retry.THROTTLING_RETRY_DELAY_BASE : import_util_retry.DEFAULT_RETRY_DELAY_BASE,
                attempts
              );
              const delayFromResponse = getDelayFromRetryAfterHeader(err.$response);
              const delay = Math.max(delayFromResponse || 0, delayFromDecider);
              totalDelay += delay;
              await new Promise((resolve) => setTimeout(resolve, delay));
              continue;
            }
            if (!err.$metadata) {
              err.$metadata = {};
            }
            err.$metadata.attempts = attempts;
            err.$metadata.totalRetryDelay = totalDelay;
            throw err;
          }
        }
      }
    };
    __name(_StandardRetryStrategy, "StandardRetryStrategy");
    var StandardRetryStrategy = _StandardRetryStrategy;
    var getDelayFromRetryAfterHeader = /* @__PURE__ */ __name((response) => {
      if (!import_protocol_http8.HttpResponse.isInstance(response))
        return;
      const retryAfterHeaderName = Object.keys(response.headers).find((key) => key.toLowerCase() === "retry-after");
      if (!retryAfterHeaderName)
        return;
      const retryAfter = response.headers[retryAfterHeaderName];
      const retryAfterSeconds = Number(retryAfter);
      if (!Number.isNaN(retryAfterSeconds))
        return retryAfterSeconds * 1e3;
      const retryAfterDate = new Date(retryAfter);
      return retryAfterDate.getTime() - Date.now();
    }, "getDelayFromRetryAfterHeader");
    var _AdaptiveRetryStrategy = class _AdaptiveRetryStrategy extends StandardRetryStrategy {
      constructor(maxAttemptsProvider, options) {
        const { rateLimiter, ...superOptions } = options ?? {};
        super(maxAttemptsProvider, superOptions);
        this.rateLimiter = rateLimiter ?? new import_util_retry.DefaultRateLimiter();
        this.mode = import_util_retry.RETRY_MODES.ADAPTIVE;
      }
      async retry(next, args) {
        return super.retry(next, args, {
          beforeRequest: async () => {
            return this.rateLimiter.getSendToken();
          },
          afterRequest: (response) => {
            this.rateLimiter.updateClientSendingRate(response);
          }
        });
      }
    };
    __name(_AdaptiveRetryStrategy, "AdaptiveRetryStrategy");
    var AdaptiveRetryStrategy = _AdaptiveRetryStrategy;
    var import_util_middleware3 = require_dist_cjs10();
    var ENV_MAX_ATTEMPTS = "AWS_MAX_ATTEMPTS";
    var CONFIG_MAX_ATTEMPTS = "max_attempts";
    var NODE_MAX_ATTEMPT_CONFIG_OPTIONS = {
      environmentVariableSelector: (env) => {
        const value = env[ENV_MAX_ATTEMPTS];
        if (!value)
          return void 0;
        const maxAttempt = parseInt(value);
        if (Number.isNaN(maxAttempt)) {
          throw new Error(`Environment variable ${ENV_MAX_ATTEMPTS} mast be a number, got "${value}"`);
        }
        return maxAttempt;
      },
      configFileSelector: (profile) => {
        const value = profile[CONFIG_MAX_ATTEMPTS];
        if (!value)
          return void 0;
        const maxAttempt = parseInt(value);
        if (Number.isNaN(maxAttempt)) {
          throw new Error(`Shared config file entry ${CONFIG_MAX_ATTEMPTS} mast be a number, got "${value}"`);
        }
        return maxAttempt;
      },
      default: import_util_retry.DEFAULT_MAX_ATTEMPTS
    };
    var resolveRetryConfig = /* @__PURE__ */ __name((input) => {
      const { retryStrategy } = input;
      const maxAttempts = (0, import_util_middleware3.normalizeProvider)(input.maxAttempts ?? import_util_retry.DEFAULT_MAX_ATTEMPTS);
      return {
        ...input,
        maxAttempts,
        retryStrategy: async () => {
          if (retryStrategy) {
            return retryStrategy;
          }
          const retryMode = await (0, import_util_middleware3.normalizeProvider)(input.retryMode)();
          if (retryMode === import_util_retry.RETRY_MODES.ADAPTIVE) {
            return new import_util_retry.AdaptiveRetryStrategy(maxAttempts);
          }
          return new import_util_retry.StandardRetryStrategy(maxAttempts);
        }
      };
    }, "resolveRetryConfig");
    var ENV_RETRY_MODE = "AWS_RETRY_MODE";
    var CONFIG_RETRY_MODE = "retry_mode";
    var NODE_RETRY_MODE_CONFIG_OPTIONS = {
      environmentVariableSelector: (env) => env[ENV_RETRY_MODE],
      configFileSelector: (profile) => profile[CONFIG_RETRY_MODE],
      default: import_util_retry.DEFAULT_RETRY_MODE
    };
    var omitRetryHeadersMiddleware = /* @__PURE__ */ __name(() => (next) => async (args) => {
      const { request } = args;
      if (import_protocol_http8.HttpRequest.isInstance(request)) {
        delete request.headers[import_util_retry.INVOCATION_ID_HEADER];
        delete request.headers[import_util_retry.REQUEST_HEADER];
      }
      return next(args);
    }, "omitRetryHeadersMiddleware");
    var omitRetryHeadersMiddlewareOptions = {
      name: "omitRetryHeadersMiddleware",
      tags: ["RETRY", "HEADERS", "OMIT_RETRY_HEADERS"],
      relation: "before",
      toMiddleware: "awsAuthMiddleware",
      override: true
    };
    var getOmitRetryHeadersPlugin = /* @__PURE__ */ __name((options) => ({
      applyToStack: (clientStack) => {
        clientStack.addRelativeTo(omitRetryHeadersMiddleware(), omitRetryHeadersMiddlewareOptions);
      }
    }), "getOmitRetryHeadersPlugin");
    var import_smithy_client5 = require_dist_cjs32();
    var import_isStreamingPayload = require_isStreamingPayload();
    var retryMiddleware = /* @__PURE__ */ __name((options) => (next, context) => async (args) => {
      var _a;
      let retryStrategy = await options.retryStrategy();
      const maxAttempts = await options.maxAttempts();
      if (isRetryStrategyV2(retryStrategy)) {
        retryStrategy = retryStrategy;
        let retryToken = await retryStrategy.acquireInitialRetryToken(context["partition_id"]);
        let lastError = new Error();
        let attempts = 0;
        let totalRetryDelay = 0;
        const { request } = args;
        const isRequest = import_protocol_http8.HttpRequest.isInstance(request);
        if (isRequest) {
          request.headers[import_util_retry.INVOCATION_ID_HEADER] = (0, import_uuid.v4)();
        }
        while (true) {
          try {
            if (isRequest) {
              request.headers[import_util_retry.REQUEST_HEADER] = `attempt=${attempts + 1}; max=${maxAttempts}`;
            }
            const { response, output } = await next(args);
            retryStrategy.recordSuccess(retryToken);
            output.$metadata.attempts = attempts + 1;
            output.$metadata.totalRetryDelay = totalRetryDelay;
            return { response, output };
          } catch (e) {
            const retryErrorInfo = getRetryErrorInfo(e);
            lastError = asSdkError(e);
            if (isRequest && (0, import_isStreamingPayload.isStreamingPayload)(request)) {
              (_a = context.logger instanceof import_smithy_client5.NoOpLogger ? console : context.logger) == null ? void 0 : _a.warn(
                "An error was encountered in a non-retryable streaming request."
              );
              throw lastError;
            }
            try {
              retryToken = await retryStrategy.refreshRetryTokenForRetry(retryToken, retryErrorInfo);
            } catch (refreshError) {
              if (!lastError.$metadata) {
                lastError.$metadata = {};
              }
              lastError.$metadata.attempts = attempts + 1;
              lastError.$metadata.totalRetryDelay = totalRetryDelay;
              throw lastError;
            }
            attempts = retryToken.getRetryCount();
            const delay = retryToken.getRetryDelay();
            totalRetryDelay += delay;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      } else {
        retryStrategy = retryStrategy;
        if (retryStrategy == null ? void 0 : retryStrategy.mode)
          context.userAgent = [...context.userAgent || [], ["cfg/retry-mode", retryStrategy.mode]];
        return retryStrategy.retry(next, args);
      }
    }, "retryMiddleware");
    var isRetryStrategyV2 = /* @__PURE__ */ __name((retryStrategy) => typeof retryStrategy.acquireInitialRetryToken !== "undefined" && typeof retryStrategy.refreshRetryTokenForRetry !== "undefined" && typeof retryStrategy.recordSuccess !== "undefined", "isRetryStrategyV2");
    var getRetryErrorInfo = /* @__PURE__ */ __name((error) => {
      const errorInfo = {
        error,
        errorType: getRetryErrorType(error)
      };
      const retryAfterHint = getRetryAfterHint(error.$response);
      if (retryAfterHint) {
        errorInfo.retryAfterHint = retryAfterHint;
      }
      return errorInfo;
    }, "getRetryErrorInfo");
    var getRetryErrorType = /* @__PURE__ */ __name((error) => {
      if ((0, import_service_error_classification.isThrottlingError)(error))
        return "THROTTLING";
      if ((0, import_service_error_classification.isTransientError)(error))
        return "TRANSIENT";
      if ((0, import_service_error_classification.isServerError)(error))
        return "SERVER_ERROR";
      return "CLIENT_ERROR";
    }, "getRetryErrorType");
    var retryMiddlewareOptions2 = {
      name: "retryMiddleware",
      tags: ["RETRY"],
      step: "finalizeRequest",
      priority: "high",
      override: true
    };
    var getRetryPlugin = /* @__PURE__ */ __name((options) => ({
      applyToStack: (clientStack) => {
        clientStack.add(retryMiddleware(options), retryMiddlewareOptions2);
      }
    }), "getRetryPlugin");
    var getRetryAfterHint = /* @__PURE__ */ __name((response) => {
      if (!import_protocol_http8.HttpResponse.isInstance(response))
        return;
      const retryAfterHeaderName = Object.keys(response.headers).find((key) => key.toLowerCase() === "retry-after");
      if (!retryAfterHeaderName)
        return;
      const retryAfter = response.headers[retryAfterHeaderName];
      const retryAfterSeconds = Number(retryAfter);
      if (!Number.isNaN(retryAfterSeconds))
        return new Date(retryAfterSeconds * 1e3);
      const retryAfterDate = new Date(retryAfter);
      return retryAfterDate;
    }, "getRetryAfterHint");
  }
});

// node_modules/@smithy/core/dist-es/middleware-http-signing/getHttpSigningMiddleware.js
var import_middleware_retry, httpSigningMiddlewareOptions, getHttpSigningPlugin;
var init_getHttpSigningMiddleware = __esm({
  "node_modules/@smithy/core/dist-es/middleware-http-signing/getHttpSigningMiddleware.js"() {
    import_middleware_retry = __toESM(require_dist_cjs33());
    init_httpSigningMiddleware();
    httpSigningMiddlewareOptions = {
      step: "finalizeRequest",
      tags: ["HTTP_SIGNING"],
      name: "httpSigningMiddleware",
      aliases: ["apiKeyMiddleware", "tokenMiddleware", "awsAuthMiddleware"],
      override: true,
      relation: "after",
      toMiddleware: import_middleware_retry.retryMiddlewareOptions.name
    };
    getHttpSigningPlugin = (config) => ({
      applyToStack: (clientStack) => {
        clientStack.addRelativeTo(httpSigningMiddleware(config), httpSigningMiddlewareOptions);
      }
    });
  }
});

// node_modules/@smithy/core/dist-es/middleware-http-signing/index.js
var init_middleware_http_signing = __esm({
  "node_modules/@smithy/core/dist-es/middleware-http-signing/index.js"() {
    init_httpSigningMiddleware();
    init_getHttpSigningMiddleware();
  }
});

// node_modules/@smithy/core/dist-es/util-identity-and-auth/DefaultIdentityProviderConfig.js
var DefaultIdentityProviderConfig;
var init_DefaultIdentityProviderConfig = __esm({
  "node_modules/@smithy/core/dist-es/util-identity-and-auth/DefaultIdentityProviderConfig.js"() {
    DefaultIdentityProviderConfig = class {
      constructor(config) {
        this.authSchemes = /* @__PURE__ */ new Map();
        for (const [key, value] of Object.entries(config)) {
          if (value !== void 0) {
            this.authSchemes.set(key, value);
          }
        }
      }
      getIdentityProvider(schemeId) {
        return this.authSchemes.get(schemeId);
      }
    };
  }
});

// node_modules/@smithy/core/dist-es/util-identity-and-auth/httpAuthSchemes/httpApiKeyAuth.js
var import_protocol_http2, import_types3, HttpApiKeyAuthSigner;
var init_httpApiKeyAuth = __esm({
  "node_modules/@smithy/core/dist-es/util-identity-and-auth/httpAuthSchemes/httpApiKeyAuth.js"() {
    import_protocol_http2 = __toESM(require_dist_cjs2());
    import_types3 = __toESM(require_dist_cjs());
    HttpApiKeyAuthSigner = class {
      async sign(httpRequest, identity, signingProperties) {
        if (!signingProperties) {
          throw new Error("request could not be signed with `apiKey` since the `name` and `in` signer properties are missing");
        }
        if (!signingProperties.name) {
          throw new Error("request could not be signed with `apiKey` since the `name` signer property is missing");
        }
        if (!signingProperties.in) {
          throw new Error("request could not be signed with `apiKey` since the `in` signer property is missing");
        }
        if (!identity.apiKey) {
          throw new Error("request could not be signed with `apiKey` since the `apiKey` is not defined");
        }
        const clonedRequest = import_protocol_http2.HttpRequest.clone(httpRequest);
        if (signingProperties.in === import_types3.HttpApiKeyAuthLocation.QUERY) {
          clonedRequest.query[signingProperties.name] = identity.apiKey;
        } else if (signingProperties.in === import_types3.HttpApiKeyAuthLocation.HEADER) {
          clonedRequest.headers[signingProperties.name] = signingProperties.scheme ? `${signingProperties.scheme} ${identity.apiKey}` : identity.apiKey;
        } else {
          throw new Error("request can only be signed with `apiKey` locations `query` or `header`, but found: `" + signingProperties.in + "`");
        }
        return clonedRequest;
      }
    };
  }
});

// node_modules/@smithy/core/dist-es/util-identity-and-auth/httpAuthSchemes/httpBearerAuth.js
var import_protocol_http3, HttpBearerAuthSigner;
var init_httpBearerAuth = __esm({
  "node_modules/@smithy/core/dist-es/util-identity-and-auth/httpAuthSchemes/httpBearerAuth.js"() {
    import_protocol_http3 = __toESM(require_dist_cjs2());
    HttpBearerAuthSigner = class {
      async sign(httpRequest, identity, signingProperties) {
        const clonedRequest = import_protocol_http3.HttpRequest.clone(httpRequest);
        if (!identity.token) {
          throw new Error("request could not be signed with `token` since the `token` is not defined");
        }
        clonedRequest.headers["Authorization"] = `Bearer ${identity.token}`;
        return clonedRequest;
      }
    };
  }
});

// node_modules/@smithy/core/dist-es/util-identity-and-auth/httpAuthSchemes/noAuth.js
var NoAuthSigner;
var init_noAuth = __esm({
  "node_modules/@smithy/core/dist-es/util-identity-and-auth/httpAuthSchemes/noAuth.js"() {
    NoAuthSigner = class {
      async sign(httpRequest, identity, signingProperties) {
        return httpRequest;
      }
    };
  }
});

// node_modules/@smithy/core/dist-es/util-identity-and-auth/httpAuthSchemes/index.js
var init_httpAuthSchemes = __esm({
  "node_modules/@smithy/core/dist-es/util-identity-and-auth/httpAuthSchemes/index.js"() {
    init_httpApiKeyAuth();
    init_httpBearerAuth();
    init_noAuth();
  }
});

// node_modules/@smithy/core/dist-es/util-identity-and-auth/memoizeIdentityProvider.js
var createIsIdentityExpiredFunction, EXPIRATION_MS, isIdentityExpired, doesIdentityRequireRefresh, memoizeIdentityProvider;
var init_memoizeIdentityProvider = __esm({
  "node_modules/@smithy/core/dist-es/util-identity-and-auth/memoizeIdentityProvider.js"() {
    createIsIdentityExpiredFunction = (expirationMs) => (identity) => doesIdentityRequireRefresh(identity) && identity.expiration.getTime() - Date.now() < expirationMs;
    EXPIRATION_MS = 3e5;
    isIdentityExpired = createIsIdentityExpiredFunction(EXPIRATION_MS);
    doesIdentityRequireRefresh = (identity) => identity.expiration !== void 0;
    memoizeIdentityProvider = (provider, isExpired, requiresRefresh) => {
      if (provider === void 0) {
        return void 0;
      }
      const normalizedProvider = typeof provider !== "function" ? async () => Promise.resolve(provider) : provider;
      let resolved;
      let pending;
      let hasResult;
      let isConstant = false;
      const coalesceProvider = async (options) => {
        if (!pending) {
          pending = normalizedProvider(options);
        }
        try {
          resolved = await pending;
          hasResult = true;
          isConstant = false;
        } finally {
          pending = void 0;
        }
        return resolved;
      };
      if (isExpired === void 0) {
        return async (options) => {
          if (!hasResult || options?.forceRefresh) {
            resolved = await coalesceProvider(options);
          }
          return resolved;
        };
      }
      return async (options) => {
        if (!hasResult || options?.forceRefresh) {
          resolved = await coalesceProvider(options);
        }
        if (isConstant) {
          return resolved;
        }
        if (!requiresRefresh(resolved)) {
          isConstant = true;
          return resolved;
        }
        if (isExpired(resolved)) {
          await coalesceProvider(options);
          return resolved;
        }
        return resolved;
      };
    };
  }
});

// node_modules/@smithy/core/dist-es/util-identity-and-auth/index.js
var init_util_identity_and_auth = __esm({
  "node_modules/@smithy/core/dist-es/util-identity-and-auth/index.js"() {
    init_DefaultIdentityProviderConfig();
    init_httpAuthSchemes();
    init_memoizeIdentityProvider();
  }
});

// node_modules/@smithy/core/dist-es/getSmithyContext.js
var import_types4, getSmithyContext3;
var init_getSmithyContext = __esm({
  "node_modules/@smithy/core/dist-es/getSmithyContext.js"() {
    import_types4 = __toESM(require_dist_cjs());
    getSmithyContext3 = (context) => context[import_types4.SMITHY_CONTEXT_KEY] || (context[import_types4.SMITHY_CONTEXT_KEY] = {});
  }
});

// node_modules/@smithy/core/dist-es/normalizeProvider.js
var normalizeProvider;
var init_normalizeProvider = __esm({
  "node_modules/@smithy/core/dist-es/normalizeProvider.js"() {
    normalizeProvider = (input) => {
      if (typeof input === "function")
        return input;
      const promisified = Promise.resolve(input);
      return () => promisified;
    };
  }
});

// node_modules/@smithy/core/dist-es/protocols/requestBuilder.js
function requestBuilder(input, context) {
  return new RequestBuilder(input, context);
}
var import_protocol_http4, import_smithy_client, RequestBuilder;
var init_requestBuilder = __esm({
  "node_modules/@smithy/core/dist-es/protocols/requestBuilder.js"() {
    import_protocol_http4 = __toESM(require_dist_cjs2());
    import_smithy_client = __toESM(require_dist_cjs32());
    RequestBuilder = class {
      constructor(input, context) {
        this.input = input;
        this.context = context;
        this.query = {};
        this.method = "";
        this.headers = {};
        this.path = "";
        this.body = null;
        this.hostname = "";
        this.resolvePathStack = [];
      }
      async build() {
        const { hostname, protocol = "https", port, path: basePath } = await this.context.endpoint();
        this.path = basePath;
        for (const resolvePath of this.resolvePathStack) {
          resolvePath(this.path);
        }
        return new import_protocol_http4.HttpRequest({
          protocol,
          hostname: this.hostname || hostname,
          port,
          method: this.method,
          path: this.path,
          query: this.query,
          body: this.body,
          headers: this.headers
        });
      }
      hn(hostname) {
        this.hostname = hostname;
        return this;
      }
      bp(uriLabel) {
        this.resolvePathStack.push((basePath) => {
          this.path = `${basePath?.endsWith("/") ? basePath.slice(0, -1) : basePath || ""}` + uriLabel;
        });
        return this;
      }
      p(memberName, labelValueProvider, uriLabel, isGreedyLabel) {
        this.resolvePathStack.push((path) => {
          this.path = (0, import_smithy_client.resolvedPath)(path, this.input, memberName, labelValueProvider, uriLabel, isGreedyLabel);
        });
        return this;
      }
      h(headers) {
        this.headers = headers;
        return this;
      }
      q(query2) {
        this.query = query2;
        return this;
      }
      b(body) {
        this.body = body;
        return this;
      }
      m(method) {
        this.method = method;
        return this;
      }
    };
  }
});

// node_modules/@smithy/core/dist-es/pagination/createPaginator.js
function createPaginator(ClientCtor, CommandCtor, inputTokenName, outputTokenName, pageSizeTokenName) {
  return async function* paginateOperation(config, input, ...additionalArguments) {
    let token = config.startingToken || void 0;
    let hasNext = true;
    let page;
    while (hasNext) {
      input[inputTokenName] = token;
      if (pageSizeTokenName) {
        input[pageSizeTokenName] = input[pageSizeTokenName] ?? config.pageSize;
      }
      if (config.client instanceof ClientCtor) {
        page = await makePagedClientRequest(CommandCtor, config.client, input, ...additionalArguments);
      } else {
        throw new Error(`Invalid client, expected instance of ${ClientCtor.name}`);
      }
      yield page;
      const prevToken = token;
      token = get(page, outputTokenName);
      hasNext = !!(token && (!config.stopOnSameToken || token !== prevToken));
    }
    return void 0;
  };
}
var makePagedClientRequest, get;
var init_createPaginator = __esm({
  "node_modules/@smithy/core/dist-es/pagination/createPaginator.js"() {
    makePagedClientRequest = async (CommandCtor, client, input, ...args) => {
      return await client.send(new CommandCtor(input), ...args);
    };
    get = (fromObject, path) => {
      let cursor = fromObject;
      const pathComponents = path.split(".");
      for (const step of pathComponents) {
        if (!cursor || typeof cursor !== "object") {
          return void 0;
        }
        cursor = cursor[step];
      }
      return cursor;
    };
  }
});

// node_modules/@smithy/core/dist-es/index.js
var dist_es_exports = {};
__export(dist_es_exports, {
  DefaultIdentityProviderConfig: () => DefaultIdentityProviderConfig,
  EXPIRATION_MS: () => EXPIRATION_MS,
  HttpApiKeyAuthSigner: () => HttpApiKeyAuthSigner,
  HttpBearerAuthSigner: () => HttpBearerAuthSigner,
  NoAuthSigner: () => NoAuthSigner,
  RequestBuilder: () => RequestBuilder,
  createIsIdentityExpiredFunction: () => createIsIdentityExpiredFunction,
  createPaginator: () => createPaginator,
  doesIdentityRequireRefresh: () => doesIdentityRequireRefresh,
  getHttpAuthSchemeEndpointRuleSetPlugin: () => getHttpAuthSchemeEndpointRuleSetPlugin,
  getHttpAuthSchemePlugin: () => getHttpAuthSchemePlugin,
  getHttpSigningPlugin: () => getHttpSigningPlugin,
  getSmithyContext: () => getSmithyContext3,
  httpAuthSchemeEndpointRuleSetMiddlewareOptions: () => httpAuthSchemeEndpointRuleSetMiddlewareOptions,
  httpAuthSchemeMiddleware: () => httpAuthSchemeMiddleware,
  httpAuthSchemeMiddlewareOptions: () => httpAuthSchemeMiddlewareOptions,
  httpSigningMiddleware: () => httpSigningMiddleware,
  httpSigningMiddlewareOptions: () => httpSigningMiddlewareOptions,
  isIdentityExpired: () => isIdentityExpired,
  memoizeIdentityProvider: () => memoizeIdentityProvider,
  normalizeProvider: () => normalizeProvider,
  requestBuilder: () => requestBuilder
});
var init_dist_es = __esm({
  "node_modules/@smithy/core/dist-es/index.js"() {
    init_middleware_http_auth_scheme();
    init_middleware_http_signing();
    init_util_identity_and_auth();
    init_getSmithyContext();
    init_normalizeProvider();
    init_requestBuilder();
    init_createPaginator();
  }
});

// node_modules/@smithy/middleware-content-length/dist-cjs/index.js
var require_dist_cjs34 = __commonJS({
  "node_modules/@smithy/middleware-content-length/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      contentLengthMiddleware: () => contentLengthMiddleware,
      contentLengthMiddlewareOptions: () => contentLengthMiddlewareOptions,
      getContentLengthPlugin: () => getContentLengthPlugin
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_protocol_http8 = require_dist_cjs2();
    var CONTENT_LENGTH_HEADER = "content-length";
    function contentLengthMiddleware(bodyLengthChecker) {
      return (next) => async (args) => {
        const request = args.request;
        if (import_protocol_http8.HttpRequest.isInstance(request)) {
          const { body, headers } = request;
          if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf(CONTENT_LENGTH_HEADER) === -1) {
            try {
              const length = bodyLengthChecker(body);
              request.headers = {
                ...request.headers,
                [CONTENT_LENGTH_HEADER]: String(length)
              };
            } catch (error) {
            }
          }
        }
        return next({
          ...args,
          request
        });
      };
    }
    __name(contentLengthMiddleware, "contentLengthMiddleware");
    var contentLengthMiddlewareOptions = {
      step: "build",
      tags: ["SET_CONTENT_LENGTH", "CONTENT_LENGTH"],
      name: "contentLengthMiddleware",
      override: true
    };
    var getContentLengthPlugin = /* @__PURE__ */ __name((options) => ({
      applyToStack: (clientStack) => {
        clientStack.add(contentLengthMiddleware(options.bodyLengthChecker), contentLengthMiddlewareOptions);
      }
    }), "getContentLengthPlugin");
  }
});

// node_modules/@aws-sdk/core/dist-es/submodules/client/emitWarningIfUnsupportedVersion.js
var warningEmitted, emitWarningIfUnsupportedVersion;
var init_emitWarningIfUnsupportedVersion = __esm({
  "node_modules/@aws-sdk/core/dist-es/submodules/client/emitWarningIfUnsupportedVersion.js"() {
    warningEmitted = false;
    emitWarningIfUnsupportedVersion = (version2) => {
      if (version2 && !warningEmitted && parseInt(version2.substring(1, version2.indexOf("."))) < 18) {
        warningEmitted = true;
        process.emitWarning(`NodeDeprecationWarning: The AWS SDK for JavaScript (v3) will
no longer support Node.js 16.x on January 6, 2025.

To continue receiving updates to AWS services, bug fixes, and security
updates please upgrade to a supported Node.js LTS version.

More information can be found at: https://a.co/74kJMmI`);
      }
    };
  }
});

// node_modules/@aws-sdk/core/dist-es/submodules/client/index.js
var init_client = __esm({
  "node_modules/@aws-sdk/core/dist-es/submodules/client/index.js"() {
    init_emitWarningIfUnsupportedVersion();
  }
});

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/getDateHeader.js
var import_protocol_http5, getDateHeader;
var init_getDateHeader = __esm({
  "node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/getDateHeader.js"() {
    import_protocol_http5 = __toESM(require_dist_cjs2());
    getDateHeader = (response) => import_protocol_http5.HttpResponse.isInstance(response) ? response.headers?.date ?? response.headers?.Date : void 0;
  }
});

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/getSkewCorrectedDate.js
var getSkewCorrectedDate;
var init_getSkewCorrectedDate = __esm({
  "node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/getSkewCorrectedDate.js"() {
    getSkewCorrectedDate = (systemClockOffset) => new Date(Date.now() + systemClockOffset);
  }
});

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/isClockSkewed.js
var isClockSkewed;
var init_isClockSkewed = __esm({
  "node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/isClockSkewed.js"() {
    init_getSkewCorrectedDate();
    isClockSkewed = (clockTime, systemClockOffset) => Math.abs(getSkewCorrectedDate(systemClockOffset).getTime() - clockTime) >= 3e5;
  }
});

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/getUpdatedSystemClockOffset.js
var getUpdatedSystemClockOffset;
var init_getUpdatedSystemClockOffset = __esm({
  "node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/getUpdatedSystemClockOffset.js"() {
    init_isClockSkewed();
    getUpdatedSystemClockOffset = (clockTime, currentSystemClockOffset) => {
      const clockTimeInMs = Date.parse(clockTime);
      if (isClockSkewed(clockTimeInMs, currentSystemClockOffset)) {
        return clockTimeInMs - Date.now();
      }
      return currentSystemClockOffset;
    };
  }
});

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/index.js
var init_utils = __esm({
  "node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/index.js"() {
    init_getDateHeader();
    init_getSkewCorrectedDate();
    init_getUpdatedSystemClockOffset();
  }
});

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/AwsSdkSigV4Signer.js
var import_protocol_http6, throwSigningPropertyError, validateSigningProperties, AwsSdkSigV4Signer, AWSSDKSigV4Signer;
var init_AwsSdkSigV4Signer = __esm({
  "node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/AwsSdkSigV4Signer.js"() {
    import_protocol_http6 = __toESM(require_dist_cjs2());
    init_utils();
    throwSigningPropertyError = (name, property) => {
      if (!property) {
        throw new Error(`Property \`${name}\` is not resolved for AWS SDK SigV4Auth`);
      }
      return property;
    };
    validateSigningProperties = async (signingProperties) => {
      const context = throwSigningPropertyError("context", signingProperties.context);
      const config = throwSigningPropertyError("config", signingProperties.config);
      const authScheme = context.endpointV2?.properties?.authSchemes?.[0];
      const signerFunction = throwSigningPropertyError("signer", config.signer);
      const signer = await signerFunction(authScheme);
      const signingRegion = signingProperties?.signingRegion;
      const signingRegionSet = signingProperties?.signingRegionSet;
      const signingName = signingProperties?.signingName;
      return {
        config,
        signer,
        signingRegion,
        signingRegionSet,
        signingName
      };
    };
    AwsSdkSigV4Signer = class {
      async sign(httpRequest, identity, signingProperties) {
        if (!import_protocol_http6.HttpRequest.isInstance(httpRequest)) {
          throw new Error("The request is not an instance of `HttpRequest` and cannot be signed");
        }
        const validatedProps = await validateSigningProperties(signingProperties);
        const { config, signer } = validatedProps;
        let { signingRegion, signingName } = validatedProps;
        const handlerExecutionContext = signingProperties.context;
        if (handlerExecutionContext?.authSchemes?.length ?? 0 > 1) {
          const [first, second] = handlerExecutionContext.authSchemes;
          if (first?.name === "sigv4a" && second?.name === "sigv4") {
            signingRegion = second?.signingRegion ?? signingRegion;
            signingName = second?.signingName ?? signingName;
          }
        }
        const signedRequest = await signer.sign(httpRequest, {
          signingDate: getSkewCorrectedDate(config.systemClockOffset),
          signingRegion,
          signingService: signingName
        });
        return signedRequest;
      }
      errorHandler(signingProperties) {
        return (error) => {
          const serverTime = error.ServerTime ?? getDateHeader(error.$response);
          if (serverTime) {
            const config = throwSigningPropertyError("config", signingProperties.config);
            const initialSystemClockOffset = config.systemClockOffset;
            config.systemClockOffset = getUpdatedSystemClockOffset(serverTime, config.systemClockOffset);
            const clockSkewCorrected = config.systemClockOffset !== initialSystemClockOffset;
            if (clockSkewCorrected && error.$metadata) {
              error.$metadata.clockSkewCorrected = true;
            }
          }
          throw error;
        };
      }
      successHandler(httpResponse, signingProperties) {
        const dateHeader = getDateHeader(httpResponse);
        if (dateHeader) {
          const config = throwSigningPropertyError("config", signingProperties.config);
          config.systemClockOffset = getUpdatedSystemClockOffset(dateHeader, config.systemClockOffset);
        }
      }
    };
    AWSSDKSigV4Signer = AwsSdkSigV4Signer;
  }
});

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/AwsSdkSigV4ASigner.js
var import_protocol_http7, AwsSdkSigV4ASigner;
var init_AwsSdkSigV4ASigner = __esm({
  "node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/AwsSdkSigV4ASigner.js"() {
    import_protocol_http7 = __toESM(require_dist_cjs2());
    init_utils();
    init_AwsSdkSigV4Signer();
    AwsSdkSigV4ASigner = class extends AwsSdkSigV4Signer {
      async sign(httpRequest, identity, signingProperties) {
        if (!import_protocol_http7.HttpRequest.isInstance(httpRequest)) {
          throw new Error("The request is not an instance of `HttpRequest` and cannot be signed");
        }
        const { config, signer, signingRegion, signingRegionSet, signingName } = await validateSigningProperties(signingProperties);
        const configResolvedSigningRegionSet = await config.sigv4aSigningRegionSet?.();
        const multiRegionOverride = (configResolvedSigningRegionSet ?? signingRegionSet ?? [signingRegion]).join(",");
        const signedRequest = await signer.sign(httpRequest, {
          signingDate: getSkewCorrectedDate(config.systemClockOffset),
          signingRegion: multiRegionOverride,
          signingService: signingName
        });
        return signedRequest;
      }
    };
  }
});

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/resolveAwsSdkSigV4AConfig.js
var import_property_provider, resolveAwsSdkSigV4AConfig, NODE_SIGV4A_CONFIG_OPTIONS;
var init_resolveAwsSdkSigV4AConfig = __esm({
  "node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/resolveAwsSdkSigV4AConfig.js"() {
    init_dist_es();
    import_property_provider = __toESM(require_dist_cjs12());
    resolveAwsSdkSigV4AConfig = (config) => {
      config.sigv4aSigningRegionSet = normalizeProvider(config.sigv4aSigningRegionSet);
      return config;
    };
    NODE_SIGV4A_CONFIG_OPTIONS = {
      environmentVariableSelector(env) {
        if (env.AWS_SIGV4A_SIGNING_REGION_SET) {
          return env.AWS_SIGV4A_SIGNING_REGION_SET.split(",").map((_) => _.trim());
        }
        throw new import_property_provider.ProviderError("AWS_SIGV4A_SIGNING_REGION_SET not set in env.", {
          tryNextLink: true
        });
      },
      configFileSelector(profile) {
        if (profile.sigv4a_signing_region_set) {
          return (profile.sigv4a_signing_region_set ?? "").split(",").map((_) => _.trim());
        }
        throw new import_property_provider.ProviderError("sigv4a_signing_region_set not set in profile.", {
          tryNextLink: true
        });
      },
      default: void 0
    };
  }
});

// node_modules/@smithy/signature-v4/dist-cjs/index.js
var require_dist_cjs35 = __commonJS({
  "node_modules/@smithy/signature-v4/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      SignatureV4: () => SignatureV42,
      clearCredentialCache: () => clearCredentialCache,
      createScope: () => createScope,
      getCanonicalHeaders: () => getCanonicalHeaders,
      getCanonicalQuery: () => getCanonicalQuery,
      getPayloadHash: () => getPayloadHash,
      getSigningKey: () => getSigningKey,
      moveHeadersToQuery: () => moveHeadersToQuery,
      prepareRequest: () => prepareRequest
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_util_middleware3 = require_dist_cjs10();
    var import_util_utf84 = require_dist_cjs24();
    var ALGORITHM_QUERY_PARAM = "X-Amz-Algorithm";
    var CREDENTIAL_QUERY_PARAM = "X-Amz-Credential";
    var AMZ_DATE_QUERY_PARAM = "X-Amz-Date";
    var SIGNED_HEADERS_QUERY_PARAM = "X-Amz-SignedHeaders";
    var EXPIRES_QUERY_PARAM = "X-Amz-Expires";
    var SIGNATURE_QUERY_PARAM = "X-Amz-Signature";
    var TOKEN_QUERY_PARAM = "X-Amz-Security-Token";
    var AUTH_HEADER = "authorization";
    var AMZ_DATE_HEADER = AMZ_DATE_QUERY_PARAM.toLowerCase();
    var DATE_HEADER = "date";
    var GENERATED_HEADERS = [AUTH_HEADER, AMZ_DATE_HEADER, DATE_HEADER];
    var SIGNATURE_HEADER = SIGNATURE_QUERY_PARAM.toLowerCase();
    var SHA256_HEADER = "x-amz-content-sha256";
    var TOKEN_HEADER = TOKEN_QUERY_PARAM.toLowerCase();
    var ALWAYS_UNSIGNABLE_HEADERS = {
      authorization: true,
      "cache-control": true,
      connection: true,
      expect: true,
      from: true,
      "keep-alive": true,
      "max-forwards": true,
      pragma: true,
      referer: true,
      te: true,
      trailer: true,
      "transfer-encoding": true,
      upgrade: true,
      "user-agent": true,
      "x-amzn-trace-id": true
    };
    var PROXY_HEADER_PATTERN = /^proxy-/;
    var SEC_HEADER_PATTERN = /^sec-/;
    var ALGORITHM_IDENTIFIER = "AWS4-HMAC-SHA256";
    var EVENT_ALGORITHM_IDENTIFIER = "AWS4-HMAC-SHA256-PAYLOAD";
    var UNSIGNED_PAYLOAD = "UNSIGNED-PAYLOAD";
    var MAX_CACHE_SIZE = 50;
    var KEY_TYPE_IDENTIFIER = "aws4_request";
    var MAX_PRESIGNED_TTL = 60 * 60 * 24 * 7;
    var import_util_hex_encoding = require_dist_cjs30();
    var import_util_utf8 = require_dist_cjs24();
    var signingKeyCache = {};
    var cacheQueue = [];
    var createScope = /* @__PURE__ */ __name((shortDate, region, service) => `${shortDate}/${region}/${service}/${KEY_TYPE_IDENTIFIER}`, "createScope");
    var getSigningKey = /* @__PURE__ */ __name(async (sha256Constructor, credentials, shortDate, region, service) => {
      const credsHash = await hmac(sha256Constructor, credentials.secretAccessKey, credentials.accessKeyId);
      const cacheKey = `${shortDate}:${region}:${service}:${(0, import_util_hex_encoding.toHex)(credsHash)}:${credentials.sessionToken}`;
      if (cacheKey in signingKeyCache) {
        return signingKeyCache[cacheKey];
      }
      cacheQueue.push(cacheKey);
      while (cacheQueue.length > MAX_CACHE_SIZE) {
        delete signingKeyCache[cacheQueue.shift()];
      }
      let key = `AWS4${credentials.secretAccessKey}`;
      for (const signable of [shortDate, region, service, KEY_TYPE_IDENTIFIER]) {
        key = await hmac(sha256Constructor, key, signable);
      }
      return signingKeyCache[cacheKey] = key;
    }, "getSigningKey");
    var clearCredentialCache = /* @__PURE__ */ __name(() => {
      cacheQueue.length = 0;
      Object.keys(signingKeyCache).forEach((cacheKey) => {
        delete signingKeyCache[cacheKey];
      });
    }, "clearCredentialCache");
    var hmac = /* @__PURE__ */ __name((ctor, secret, data) => {
      const hash = new ctor(secret);
      hash.update((0, import_util_utf8.toUint8Array)(data));
      return hash.digest();
    }, "hmac");
    var getCanonicalHeaders = /* @__PURE__ */ __name(({ headers }, unsignableHeaders, signableHeaders) => {
      const canonical = {};
      for (const headerName of Object.keys(headers).sort()) {
        if (headers[headerName] == void 0) {
          continue;
        }
        const canonicalHeaderName = headerName.toLowerCase();
        if (canonicalHeaderName in ALWAYS_UNSIGNABLE_HEADERS || (unsignableHeaders == null ? void 0 : unsignableHeaders.has(canonicalHeaderName)) || PROXY_HEADER_PATTERN.test(canonicalHeaderName) || SEC_HEADER_PATTERN.test(canonicalHeaderName)) {
          if (!signableHeaders || signableHeaders && !signableHeaders.has(canonicalHeaderName)) {
            continue;
          }
        }
        canonical[canonicalHeaderName] = headers[headerName].trim().replace(/\s+/g, " ");
      }
      return canonical;
    }, "getCanonicalHeaders");
    var import_util_uri_escape = require_dist_cjs26();
    var getCanonicalQuery = /* @__PURE__ */ __name(({ query: query2 = {} }) => {
      const keys = [];
      const serialized = {};
      for (const key of Object.keys(query2).sort()) {
        if (key.toLowerCase() === SIGNATURE_HEADER) {
          continue;
        }
        keys.push(key);
        const value = query2[key];
        if (typeof value === "string") {
          serialized[key] = `${(0, import_util_uri_escape.escapeUri)(key)}=${(0, import_util_uri_escape.escapeUri)(value)}`;
        } else if (Array.isArray(value)) {
          serialized[key] = value.slice(0).reduce(
            (encoded, value2) => encoded.concat([`${(0, import_util_uri_escape.escapeUri)(key)}=${(0, import_util_uri_escape.escapeUri)(value2)}`]),
            []
          ).sort().join("&");
        }
      }
      return keys.map((key) => serialized[key]).filter((serialized2) => serialized2).join("&");
    }, "getCanonicalQuery");
    var import_is_array_buffer = require_dist_cjs22();
    var import_util_utf82 = require_dist_cjs24();
    var getPayloadHash = /* @__PURE__ */ __name(async ({ headers, body }, hashConstructor) => {
      for (const headerName of Object.keys(headers)) {
        if (headerName.toLowerCase() === SHA256_HEADER) {
          return headers[headerName];
        }
      }
      if (body == void 0) {
        return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
      } else if (typeof body === "string" || ArrayBuffer.isView(body) || (0, import_is_array_buffer.isArrayBuffer)(body)) {
        const hashCtor = new hashConstructor();
        hashCtor.update((0, import_util_utf82.toUint8Array)(body));
        return (0, import_util_hex_encoding.toHex)(await hashCtor.digest());
      }
      return UNSIGNED_PAYLOAD;
    }, "getPayloadHash");
    var import_util_utf83 = require_dist_cjs24();
    var _HeaderFormatter = class _HeaderFormatter {
      format(headers) {
        const chunks = [];
        for (const headerName of Object.keys(headers)) {
          const bytes = (0, import_util_utf83.fromUtf8)(headerName);
          chunks.push(Uint8Array.from([bytes.byteLength]), bytes, this.formatHeaderValue(headers[headerName]));
        }
        const out = new Uint8Array(chunks.reduce((carry, bytes) => carry + bytes.byteLength, 0));
        let position = 0;
        for (const chunk of chunks) {
          out.set(chunk, position);
          position += chunk.byteLength;
        }
        return out;
      }
      formatHeaderValue(header) {
        switch (header.type) {
          case "boolean":
            return Uint8Array.from([
              header.value ? 0 : 1
              /* boolFalse */
            ]);
          case "byte":
            return Uint8Array.from([2, header.value]);
          case "short":
            const shortView = new DataView(new ArrayBuffer(3));
            shortView.setUint8(
              0,
              3
              /* short */
            );
            shortView.setInt16(1, header.value, false);
            return new Uint8Array(shortView.buffer);
          case "integer":
            const intView = new DataView(new ArrayBuffer(5));
            intView.setUint8(
              0,
              4
              /* integer */
            );
            intView.setInt32(1, header.value, false);
            return new Uint8Array(intView.buffer);
          case "long":
            const longBytes = new Uint8Array(9);
            longBytes[0] = 5;
            longBytes.set(header.value.bytes, 1);
            return longBytes;
          case "binary":
            const binView = new DataView(new ArrayBuffer(3 + header.value.byteLength));
            binView.setUint8(
              0,
              6
              /* byteArray */
            );
            binView.setUint16(1, header.value.byteLength, false);
            const binBytes = new Uint8Array(binView.buffer);
            binBytes.set(header.value, 3);
            return binBytes;
          case "string":
            const utf8Bytes = (0, import_util_utf83.fromUtf8)(header.value);
            const strView = new DataView(new ArrayBuffer(3 + utf8Bytes.byteLength));
            strView.setUint8(
              0,
              7
              /* string */
            );
            strView.setUint16(1, utf8Bytes.byteLength, false);
            const strBytes = new Uint8Array(strView.buffer);
            strBytes.set(utf8Bytes, 3);
            return strBytes;
          case "timestamp":
            const tsBytes = new Uint8Array(9);
            tsBytes[0] = 8;
            tsBytes.set(Int64.fromNumber(header.value.valueOf()).bytes, 1);
            return tsBytes;
          case "uuid":
            if (!UUID_PATTERN.test(header.value)) {
              throw new Error(`Invalid UUID received: ${header.value}`);
            }
            const uuidBytes = new Uint8Array(17);
            uuidBytes[0] = 9;
            uuidBytes.set((0, import_util_hex_encoding.fromHex)(header.value.replace(/\-/g, "")), 1);
            return uuidBytes;
        }
      }
    };
    __name(_HeaderFormatter, "HeaderFormatter");
    var HeaderFormatter = _HeaderFormatter;
    var UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
    var _Int64 = class _Int642 {
      constructor(bytes) {
        this.bytes = bytes;
        if (bytes.byteLength !== 8) {
          throw new Error("Int64 buffers must be exactly 8 bytes");
        }
      }
      static fromNumber(number) {
        if (number > 9223372036854776e3 || number < -9223372036854776e3) {
          throw new Error(`${number} is too large (or, if negative, too small) to represent as an Int64`);
        }
        const bytes = new Uint8Array(8);
        for (let i = 7, remaining = Math.abs(Math.round(number)); i > -1 && remaining > 0; i--, remaining /= 256) {
          bytes[i] = remaining;
        }
        if (number < 0) {
          negate(bytes);
        }
        return new _Int642(bytes);
      }
      /**
       * Called implicitly by infix arithmetic operators.
       */
      valueOf() {
        const bytes = this.bytes.slice(0);
        const negative = bytes[0] & 128;
        if (negative) {
          negate(bytes);
        }
        return parseInt((0, import_util_hex_encoding.toHex)(bytes), 16) * (negative ? -1 : 1);
      }
      toString() {
        return String(this.valueOf());
      }
    };
    __name(_Int64, "Int64");
    var Int64 = _Int64;
    function negate(bytes) {
      for (let i = 0; i < 8; i++) {
        bytes[i] ^= 255;
      }
      for (let i = 7; i > -1; i--) {
        bytes[i]++;
        if (bytes[i] !== 0)
          break;
      }
    }
    __name(negate, "negate");
    var hasHeader = /* @__PURE__ */ __name((soughtHeader, headers) => {
      soughtHeader = soughtHeader.toLowerCase();
      for (const headerName of Object.keys(headers)) {
        if (soughtHeader === headerName.toLowerCase()) {
          return true;
        }
      }
      return false;
    }, "hasHeader");
    var import_protocol_http8 = require_dist_cjs2();
    var moveHeadersToQuery = /* @__PURE__ */ __name((request, options = {}) => {
      var _a;
      const { headers, query: query2 = {} } = import_protocol_http8.HttpRequest.clone(request);
      for (const name of Object.keys(headers)) {
        const lname = name.toLowerCase();
        if (lname.slice(0, 6) === "x-amz-" && !((_a = options.unhoistableHeaders) == null ? void 0 : _a.has(lname))) {
          query2[name] = headers[name];
          delete headers[name];
        }
      }
      return {
        ...request,
        headers,
        query: query2
      };
    }, "moveHeadersToQuery");
    var prepareRequest = /* @__PURE__ */ __name((request) => {
      request = import_protocol_http8.HttpRequest.clone(request);
      for (const headerName of Object.keys(request.headers)) {
        if (GENERATED_HEADERS.indexOf(headerName.toLowerCase()) > -1) {
          delete request.headers[headerName];
        }
      }
      return request;
    }, "prepareRequest");
    var iso8601 = /* @__PURE__ */ __name((time) => toDate(time).toISOString().replace(/\.\d{3}Z$/, "Z"), "iso8601");
    var toDate = /* @__PURE__ */ __name((time) => {
      if (typeof time === "number") {
        return new Date(time * 1e3);
      }
      if (typeof time === "string") {
        if (Number(time)) {
          return new Date(Number(time) * 1e3);
        }
        return new Date(time);
      }
      return time;
    }, "toDate");
    var _SignatureV4 = class _SignatureV4 {
      constructor({
        applyChecksum,
        credentials,
        region,
        service,
        sha256,
        uriEscapePath = true
      }) {
        this.headerFormatter = new HeaderFormatter();
        this.service = service;
        this.sha256 = sha256;
        this.uriEscapePath = uriEscapePath;
        this.applyChecksum = typeof applyChecksum === "boolean" ? applyChecksum : true;
        this.regionProvider = (0, import_util_middleware3.normalizeProvider)(region);
        this.credentialProvider = (0, import_util_middleware3.normalizeProvider)(credentials);
      }
      async presign(originalRequest, options = {}) {
        const {
          signingDate = /* @__PURE__ */ new Date(),
          expiresIn = 3600,
          unsignableHeaders,
          unhoistableHeaders,
          signableHeaders,
          signingRegion,
          signingService
        } = options;
        const credentials = await this.credentialProvider();
        this.validateResolvedCredentials(credentials);
        const region = signingRegion ?? await this.regionProvider();
        const { longDate, shortDate } = formatDate(signingDate);
        if (expiresIn > MAX_PRESIGNED_TTL) {
          return Promise.reject(
            "Signature version 4 presigned URLs must have an expiration date less than one week in the future"
          );
        }
        const scope = createScope(shortDate, region, signingService ?? this.service);
        const request = moveHeadersToQuery(prepareRequest(originalRequest), { unhoistableHeaders });
        if (credentials.sessionToken) {
          request.query[TOKEN_QUERY_PARAM] = credentials.sessionToken;
        }
        request.query[ALGORITHM_QUERY_PARAM] = ALGORITHM_IDENTIFIER;
        request.query[CREDENTIAL_QUERY_PARAM] = `${credentials.accessKeyId}/${scope}`;
        request.query[AMZ_DATE_QUERY_PARAM] = longDate;
        request.query[EXPIRES_QUERY_PARAM] = expiresIn.toString(10);
        const canonicalHeaders = getCanonicalHeaders(request, unsignableHeaders, signableHeaders);
        request.query[SIGNED_HEADERS_QUERY_PARAM] = getCanonicalHeaderList(canonicalHeaders);
        request.query[SIGNATURE_QUERY_PARAM] = await this.getSignature(
          longDate,
          scope,
          this.getSigningKey(credentials, region, shortDate, signingService),
          this.createCanonicalRequest(request, canonicalHeaders, await getPayloadHash(originalRequest, this.sha256))
        );
        return request;
      }
      async sign(toSign, options) {
        if (typeof toSign === "string") {
          return this.signString(toSign, options);
        } else if (toSign.headers && toSign.payload) {
          return this.signEvent(toSign, options);
        } else if (toSign.message) {
          return this.signMessage(toSign, options);
        } else {
          return this.signRequest(toSign, options);
        }
      }
      async signEvent({ headers, payload }, { signingDate = /* @__PURE__ */ new Date(), priorSignature, signingRegion, signingService }) {
        const region = signingRegion ?? await this.regionProvider();
        const { shortDate, longDate } = formatDate(signingDate);
        const scope = createScope(shortDate, region, signingService ?? this.service);
        const hashedPayload = await getPayloadHash({ headers: {}, body: payload }, this.sha256);
        const hash = new this.sha256();
        hash.update(headers);
        const hashedHeaders = (0, import_util_hex_encoding.toHex)(await hash.digest());
        const stringToSign = [
          EVENT_ALGORITHM_IDENTIFIER,
          longDate,
          scope,
          priorSignature,
          hashedHeaders,
          hashedPayload
        ].join("\n");
        return this.signString(stringToSign, { signingDate, signingRegion: region, signingService });
      }
      async signMessage(signableMessage, { signingDate = /* @__PURE__ */ new Date(), signingRegion, signingService }) {
        const promise = this.signEvent(
          {
            headers: this.headerFormatter.format(signableMessage.message.headers),
            payload: signableMessage.message.body
          },
          {
            signingDate,
            signingRegion,
            signingService,
            priorSignature: signableMessage.priorSignature
          }
        );
        return promise.then((signature) => {
          return { message: signableMessage.message, signature };
        });
      }
      async signString(stringToSign, { signingDate = /* @__PURE__ */ new Date(), signingRegion, signingService } = {}) {
        const credentials = await this.credentialProvider();
        this.validateResolvedCredentials(credentials);
        const region = signingRegion ?? await this.regionProvider();
        const { shortDate } = formatDate(signingDate);
        const hash = new this.sha256(await this.getSigningKey(credentials, region, shortDate, signingService));
        hash.update((0, import_util_utf84.toUint8Array)(stringToSign));
        return (0, import_util_hex_encoding.toHex)(await hash.digest());
      }
      async signRequest(requestToSign, {
        signingDate = /* @__PURE__ */ new Date(),
        signableHeaders,
        unsignableHeaders,
        signingRegion,
        signingService
      } = {}) {
        const credentials = await this.credentialProvider();
        this.validateResolvedCredentials(credentials);
        const region = signingRegion ?? await this.regionProvider();
        const request = prepareRequest(requestToSign);
        const { longDate, shortDate } = formatDate(signingDate);
        const scope = createScope(shortDate, region, signingService ?? this.service);
        request.headers[AMZ_DATE_HEADER] = longDate;
        if (credentials.sessionToken) {
          request.headers[TOKEN_HEADER] = credentials.sessionToken;
        }
        const payloadHash = await getPayloadHash(request, this.sha256);
        if (!hasHeader(SHA256_HEADER, request.headers) && this.applyChecksum) {
          request.headers[SHA256_HEADER] = payloadHash;
        }
        const canonicalHeaders = getCanonicalHeaders(request, unsignableHeaders, signableHeaders);
        const signature = await this.getSignature(
          longDate,
          scope,
          this.getSigningKey(credentials, region, shortDate, signingService),
          this.createCanonicalRequest(request, canonicalHeaders, payloadHash)
        );
        request.headers[AUTH_HEADER] = `${ALGORITHM_IDENTIFIER} Credential=${credentials.accessKeyId}/${scope}, SignedHeaders=${getCanonicalHeaderList(canonicalHeaders)}, Signature=${signature}`;
        return request;
      }
      createCanonicalRequest(request, canonicalHeaders, payloadHash) {
        const sortedHeaders = Object.keys(canonicalHeaders).sort();
        return `${request.method}
${this.getCanonicalPath(request)}
${getCanonicalQuery(request)}
${sortedHeaders.map((name) => `${name}:${canonicalHeaders[name]}`).join("\n")}

${sortedHeaders.join(";")}
${payloadHash}`;
      }
      async createStringToSign(longDate, credentialScope, canonicalRequest) {
        const hash = new this.sha256();
        hash.update((0, import_util_utf84.toUint8Array)(canonicalRequest));
        const hashedRequest = await hash.digest();
        return `${ALGORITHM_IDENTIFIER}
${longDate}
${credentialScope}
${(0, import_util_hex_encoding.toHex)(hashedRequest)}`;
      }
      getCanonicalPath({ path }) {
        if (this.uriEscapePath) {
          const normalizedPathSegments = [];
          for (const pathSegment of path.split("/")) {
            if ((pathSegment == null ? void 0 : pathSegment.length) === 0)
              continue;
            if (pathSegment === ".")
              continue;
            if (pathSegment === "..") {
              normalizedPathSegments.pop();
            } else {
              normalizedPathSegments.push(pathSegment);
            }
          }
          const normalizedPath = `${(path == null ? void 0 : path.startsWith("/")) ? "/" : ""}${normalizedPathSegments.join("/")}${normalizedPathSegments.length > 0 && (path == null ? void 0 : path.endsWith("/")) ? "/" : ""}`;
          const doubleEncoded = (0, import_util_uri_escape.escapeUri)(normalizedPath);
          return doubleEncoded.replace(/%2F/g, "/");
        }
        return path;
      }
      async getSignature(longDate, credentialScope, keyPromise, canonicalRequest) {
        const stringToSign = await this.createStringToSign(longDate, credentialScope, canonicalRequest);
        const hash = new this.sha256(await keyPromise);
        hash.update((0, import_util_utf84.toUint8Array)(stringToSign));
        return (0, import_util_hex_encoding.toHex)(await hash.digest());
      }
      getSigningKey(credentials, region, shortDate, service) {
        return getSigningKey(this.sha256, credentials, shortDate, region, service || this.service);
      }
      validateResolvedCredentials(credentials) {
        if (typeof credentials !== "object" || // @ts-expect-error: Property 'accessKeyId' does not exist on type 'object'.ts(2339)
        typeof credentials.accessKeyId !== "string" || // @ts-expect-error: Property 'secretAccessKey' does not exist on type 'object'.ts(2339)
        typeof credentials.secretAccessKey !== "string") {
          throw new Error("Resolved credential object is not valid");
        }
      }
    };
    __name(_SignatureV4, "SignatureV4");
    var SignatureV42 = _SignatureV4;
    var formatDate = /* @__PURE__ */ __name((now) => {
      const longDate = iso8601(now).replace(/[\-:]/g, "");
      return {
        longDate,
        shortDate: longDate.slice(0, 8)
      };
    }, "formatDate");
    var getCanonicalHeaderList = /* @__PURE__ */ __name((headers) => Object.keys(headers).sort().join(";"), "getCanonicalHeaderList");
  }
});

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/resolveAwsSdkSigV4Config.js
var import_signature_v4, resolveAwsSdkSigV4Config, resolveAWSSDKSigV4Config;
var init_resolveAwsSdkSigV4Config = __esm({
  "node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/resolveAwsSdkSigV4Config.js"() {
    init_dist_es();
    import_signature_v4 = __toESM(require_dist_cjs35());
    resolveAwsSdkSigV4Config = (config) => {
      let normalizedCreds;
      if (config.credentials) {
        normalizedCreds = memoizeIdentityProvider(config.credentials, isIdentityExpired, doesIdentityRequireRefresh);
      }
      if (!normalizedCreds) {
        if (config.credentialDefaultProvider) {
          normalizedCreds = normalizeProvider(config.credentialDefaultProvider(Object.assign({}, config, {
            parentClientConfig: config
          })));
        } else {
          normalizedCreds = async () => {
            throw new Error("`credentials` is missing");
          };
        }
      }
      const { signingEscapePath = true, systemClockOffset = config.systemClockOffset || 0, sha256 } = config;
      let signer;
      if (config.signer) {
        signer = normalizeProvider(config.signer);
      } else if (config.regionInfoProvider) {
        signer = () => normalizeProvider(config.region)().then(async (region) => [
          await config.regionInfoProvider(region, {
            useFipsEndpoint: await config.useFipsEndpoint(),
            useDualstackEndpoint: await config.useDualstackEndpoint()
          }) || {},
          region
        ]).then(([regionInfo, region]) => {
          const { signingRegion, signingService } = regionInfo;
          config.signingRegion = config.signingRegion || signingRegion || region;
          config.signingName = config.signingName || signingService || config.serviceId;
          const params = {
            ...config,
            credentials: normalizedCreds,
            region: config.signingRegion,
            service: config.signingName,
            sha256,
            uriEscapePath: signingEscapePath
          };
          const SignerCtor = config.signerConstructor || import_signature_v4.SignatureV4;
          return new SignerCtor(params);
        });
      } else {
        signer = async (authScheme) => {
          authScheme = Object.assign({}, {
            name: "sigv4",
            signingName: config.signingName || config.defaultSigningName,
            signingRegion: await normalizeProvider(config.region)(),
            properties: {}
          }, authScheme);
          const signingRegion = authScheme.signingRegion;
          const signingService = authScheme.signingName;
          config.signingRegion = config.signingRegion || signingRegion;
          config.signingName = config.signingName || signingService || config.serviceId;
          const params = {
            ...config,
            credentials: normalizedCreds,
            region: config.signingRegion,
            service: config.signingName,
            sha256,
            uriEscapePath: signingEscapePath
          };
          const SignerCtor = config.signerConstructor || import_signature_v4.SignatureV4;
          return new SignerCtor(params);
        };
      }
      return {
        ...config,
        systemClockOffset,
        signingEscapePath,
        credentials: normalizedCreds,
        signer
      };
    };
    resolveAWSSDKSigV4Config = resolveAwsSdkSigV4Config;
  }
});

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/index.js
var init_aws_sdk = __esm({
  "node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/index.js"() {
    init_AwsSdkSigV4Signer();
    init_AwsSdkSigV4ASigner();
    init_resolveAwsSdkSigV4AConfig();
    init_resolveAwsSdkSigV4Config();
  }
});

// node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/index.js
var init_httpAuthSchemes2 = __esm({
  "node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/index.js"() {
    init_aws_sdk();
  }
});

// node_modules/@aws-sdk/core/dist-es/submodules/protocols/coercing-serializers.js
var _toStr, _toBool, _toNum;
var init_coercing_serializers = __esm({
  "node_modules/@aws-sdk/core/dist-es/submodules/protocols/coercing-serializers.js"() {
    _toStr = (val2) => {
      if (val2 == null) {
        return val2;
      }
      if (typeof val2 === "number" || typeof val2 === "bigint") {
        const warning = new Error(`Received number ${val2} where a string was expected.`);
        warning.name = "Warning";
        console.warn(warning);
        return String(val2);
      }
      if (typeof val2 === "boolean") {
        const warning = new Error(`Received boolean ${val2} where a string was expected.`);
        warning.name = "Warning";
        console.warn(warning);
        return String(val2);
      }
      return val2;
    };
    _toBool = (val2) => {
      if (val2 == null) {
        return val2;
      }
      if (typeof val2 === "number") {
      }
      if (typeof val2 === "string") {
        const lowercase = val2.toLowerCase();
        if (val2 !== "" && lowercase !== "false" && lowercase !== "true") {
          const warning = new Error(`Received string "${val2}" where a boolean was expected.`);
          warning.name = "Warning";
          console.warn(warning);
        }
        return val2 !== "" && lowercase !== "false";
      }
      return val2;
    };
    _toNum = (val2) => {
      if (val2 == null) {
        return val2;
      }
      if (typeof val2 === "boolean") {
      }
      if (typeof val2 === "string") {
        const num = Number(val2);
        if (num.toString() !== val2) {
          const warning = new Error(`Received string "${val2}" where a number was expected.`);
          warning.name = "Warning";
          console.warn(warning);
          return val2;
        }
        return num;
      }
      return val2;
    };
  }
});

// node_modules/@aws-sdk/core/dist-es/submodules/protocols/json/awsExpectUnion.js
var import_smithy_client2, awsExpectUnion;
var init_awsExpectUnion = __esm({
  "node_modules/@aws-sdk/core/dist-es/submodules/protocols/json/awsExpectUnion.js"() {
    import_smithy_client2 = __toESM(require_dist_cjs32());
    awsExpectUnion = (value) => {
      if (value == null) {
        return void 0;
      }
      if (typeof value === "object" && "__type" in value) {
        delete value.__type;
      }
      return (0, import_smithy_client2.expectUnion)(value);
    };
  }
});

// node_modules/@aws-sdk/core/dist-es/submodules/protocols/common.js
var import_smithy_client3, collectBodyString;
var init_common = __esm({
  "node_modules/@aws-sdk/core/dist-es/submodules/protocols/common.js"() {
    import_smithy_client3 = __toESM(require_dist_cjs32());
    collectBodyString = (streamBody, context) => (0, import_smithy_client3.collectBody)(streamBody, context).then((body) => context.utf8Encoder(body));
  }
});

// node_modules/@aws-sdk/core/dist-es/submodules/protocols/json/parseJsonBody.js
var parseJsonBody, parseJsonErrorBody, loadRestJsonErrorCode;
var init_parseJsonBody = __esm({
  "node_modules/@aws-sdk/core/dist-es/submodules/protocols/json/parseJsonBody.js"() {
    init_common();
    parseJsonBody = (streamBody, context) => collectBodyString(streamBody, context).then((encoded) => {
      if (encoded.length) {
        try {
          return JSON.parse(encoded);
        } catch (e) {
          if (e?.name === "SyntaxError") {
            Object.defineProperty(e, "$responseBodyText", {
              value: encoded
            });
          }
          throw e;
        }
      }
      return {};
    });
    parseJsonErrorBody = async (errorBody, context) => {
      const value = await parseJsonBody(errorBody, context);
      value.message = value.message ?? value.Message;
      return value;
    };
    loadRestJsonErrorCode = (output, data) => {
      const findKey = (object, key) => Object.keys(object).find((k) => k.toLowerCase() === key.toLowerCase());
      const sanitizeErrorCode = (rawValue) => {
        let cleanValue = rawValue;
        if (typeof cleanValue === "number") {
          cleanValue = cleanValue.toString();
        }
        if (cleanValue.indexOf(",") >= 0) {
          cleanValue = cleanValue.split(",")[0];
        }
        if (cleanValue.indexOf(":") >= 0) {
          cleanValue = cleanValue.split(":")[0];
        }
        if (cleanValue.indexOf("#") >= 0) {
          cleanValue = cleanValue.split("#")[1];
        }
        return cleanValue;
      };
      const headerKey = findKey(output.headers, "x-amzn-errortype");
      if (headerKey !== void 0) {
        return sanitizeErrorCode(output.headers[headerKey]);
      }
      if (data.code !== void 0) {
        return sanitizeErrorCode(data.code);
      }
      if (data["__type"] !== void 0) {
        return sanitizeErrorCode(data["__type"]);
      }
    };
  }
});

// node_modules/fast-xml-parser/src/util.js
var require_util = __commonJS({
  "node_modules/fast-xml-parser/src/util.js"(exports2) {
    "use strict";
    var nameStartChar = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
    var nameChar = nameStartChar + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
    var nameRegexp = "[" + nameStartChar + "][" + nameChar + "]*";
    var regexName = new RegExp("^" + nameRegexp + "$");
    var getAllMatches = function(string, regex) {
      const matches = [];
      let match = regex.exec(string);
      while (match) {
        const allmatches = [];
        allmatches.startIndex = regex.lastIndex - match[0].length;
        const len = match.length;
        for (let index = 0; index < len; index++) {
          allmatches.push(match[index]);
        }
        matches.push(allmatches);
        match = regex.exec(string);
      }
      return matches;
    };
    var isName = function(string) {
      const match = regexName.exec(string);
      return !(match === null || typeof match === "undefined");
    };
    exports2.isExist = function(v) {
      return typeof v !== "undefined";
    };
    exports2.isEmptyObject = function(obj) {
      return Object.keys(obj).length === 0;
    };
    exports2.merge = function(target, a, arrayMode) {
      if (a) {
        const keys = Object.keys(a);
        const len = keys.length;
        for (let i = 0; i < len; i++) {
          if (arrayMode === "strict") {
            target[keys[i]] = [a[keys[i]]];
          } else {
            target[keys[i]] = a[keys[i]];
          }
        }
      }
    };
    exports2.getValue = function(v) {
      if (exports2.isExist(v)) {
        return v;
      } else {
        return "";
      }
    };
    exports2.isName = isName;
    exports2.getAllMatches = getAllMatches;
    exports2.nameRegexp = nameRegexp;
  }
});

// node_modules/fast-xml-parser/src/validator.js
var require_validator = __commonJS({
  "node_modules/fast-xml-parser/src/validator.js"(exports2) {
    "use strict";
    var util = require_util();
    var defaultOptions = {
      allowBooleanAttributes: false,
      //A tag can have attributes without any value
      unpairedTags: []
    };
    exports2.validate = function(xmlData, options) {
      options = Object.assign({}, defaultOptions, options);
      const tags = [];
      let tagFound = false;
      let reachedRoot = false;
      if (xmlData[0] === "\uFEFF") {
        xmlData = xmlData.substr(1);
      }
      for (let i = 0; i < xmlData.length; i++) {
        if (xmlData[i] === "<" && xmlData[i + 1] === "?") {
          i += 2;
          i = readPI(xmlData, i);
          if (i.err)
            return i;
        } else if (xmlData[i] === "<") {
          let tagStartPos = i;
          i++;
          if (xmlData[i] === "!") {
            i = readCommentAndCDATA(xmlData, i);
            continue;
          } else {
            let closingTag = false;
            if (xmlData[i] === "/") {
              closingTag = true;
              i++;
            }
            let tagName = "";
            for (; i < xmlData.length && xmlData[i] !== ">" && xmlData[i] !== " " && xmlData[i] !== "	" && xmlData[i] !== "\n" && xmlData[i] !== "\r"; i++) {
              tagName += xmlData[i];
            }
            tagName = tagName.trim();
            if (tagName[tagName.length - 1] === "/") {
              tagName = tagName.substring(0, tagName.length - 1);
              i--;
            }
            if (!validateTagName(tagName)) {
              let msg;
              if (tagName.trim().length === 0) {
                msg = "Invalid space after '<'.";
              } else {
                msg = "Tag '" + tagName + "' is an invalid name.";
              }
              return getErrorObject("InvalidTag", msg, getLineNumberForPosition(xmlData, i));
            }
            const result = readAttributeStr(xmlData, i);
            if (result === false) {
              return getErrorObject("InvalidAttr", "Attributes for '" + tagName + "' have open quote.", getLineNumberForPosition(xmlData, i));
            }
            let attrStr = result.value;
            i = result.index;
            if (attrStr[attrStr.length - 1] === "/") {
              const attrStrStart = i - attrStr.length;
              attrStr = attrStr.substring(0, attrStr.length - 1);
              const isValid = validateAttributeString(attrStr, options);
              if (isValid === true) {
                tagFound = true;
              } else {
                return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
              }
            } else if (closingTag) {
              if (!result.tagClosed) {
                return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
              } else if (attrStr.trim().length > 0) {
                return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
              } else if (tags.length === 0) {
                return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' has not been opened.", getLineNumberForPosition(xmlData, tagStartPos));
              } else {
                const otg = tags.pop();
                if (tagName !== otg.tagName) {
                  let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
                  return getErrorObject(
                    "InvalidTag",
                    "Expected closing tag '" + otg.tagName + "' (opened in line " + openPos.line + ", col " + openPos.col + ") instead of closing tag '" + tagName + "'.",
                    getLineNumberForPosition(xmlData, tagStartPos)
                  );
                }
                if (tags.length == 0) {
                  reachedRoot = true;
                }
              }
            } else {
              const isValid = validateAttributeString(attrStr, options);
              if (isValid !== true) {
                return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line));
              }
              if (reachedRoot === true) {
                return getErrorObject("InvalidXml", "Multiple possible root nodes found.", getLineNumberForPosition(xmlData, i));
              } else if (options.unpairedTags.indexOf(tagName) !== -1) {
              } else {
                tags.push({ tagName, tagStartPos });
              }
              tagFound = true;
            }
            for (i++; i < xmlData.length; i++) {
              if (xmlData[i] === "<") {
                if (xmlData[i + 1] === "!") {
                  i++;
                  i = readCommentAndCDATA(xmlData, i);
                  continue;
                } else if (xmlData[i + 1] === "?") {
                  i = readPI(xmlData, ++i);
                  if (i.err)
                    return i;
                } else {
                  break;
                }
              } else if (xmlData[i] === "&") {
                const afterAmp = validateAmpersand(xmlData, i);
                if (afterAmp == -1)
                  return getErrorObject("InvalidChar", "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
                i = afterAmp;
              } else {
                if (reachedRoot === true && !isWhiteSpace(xmlData[i])) {
                  return getErrorObject("InvalidXml", "Extra text at the end", getLineNumberForPosition(xmlData, i));
                }
              }
            }
            if (xmlData[i] === "<") {
              i--;
            }
          }
        } else {
          if (isWhiteSpace(xmlData[i])) {
            continue;
          }
          return getErrorObject("InvalidChar", "char '" + xmlData[i] + "' is not expected.", getLineNumberForPosition(xmlData, i));
        }
      }
      if (!tagFound) {
        return getErrorObject("InvalidXml", "Start tag expected.", 1);
      } else if (tags.length == 1) {
        return getErrorObject("InvalidTag", "Unclosed tag '" + tags[0].tagName + "'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
      } else if (tags.length > 0) {
        return getErrorObject("InvalidXml", "Invalid '" + JSON.stringify(tags.map((t) => t.tagName), null, 4).replace(/\r?\n/g, "") + "' found.", { line: 1, col: 1 });
      }
      return true;
    };
    function isWhiteSpace(char) {
      return char === " " || char === "	" || char === "\n" || char === "\r";
    }
    function readPI(xmlData, i) {
      const start = i;
      for (; i < xmlData.length; i++) {
        if (xmlData[i] == "?" || xmlData[i] == " ") {
          const tagname = xmlData.substr(start, i - start);
          if (i > 5 && tagname === "xml") {
            return getErrorObject("InvalidXml", "XML declaration allowed only at the start of the document.", getLineNumberForPosition(xmlData, i));
          } else if (xmlData[i] == "?" && xmlData[i + 1] == ">") {
            i++;
            break;
          } else {
            continue;
          }
        }
      }
      return i;
    }
    function readCommentAndCDATA(xmlData, i) {
      if (xmlData.length > i + 5 && xmlData[i + 1] === "-" && xmlData[i + 2] === "-") {
        for (i += 3; i < xmlData.length; i++) {
          if (xmlData[i] === "-" && xmlData[i + 1] === "-" && xmlData[i + 2] === ">") {
            i += 2;
            break;
          }
        }
      } else if (xmlData.length > i + 8 && xmlData[i + 1] === "D" && xmlData[i + 2] === "O" && xmlData[i + 3] === "C" && xmlData[i + 4] === "T" && xmlData[i + 5] === "Y" && xmlData[i + 6] === "P" && xmlData[i + 7] === "E") {
        let angleBracketsCount = 1;
        for (i += 8; i < xmlData.length; i++) {
          if (xmlData[i] === "<") {
            angleBracketsCount++;
          } else if (xmlData[i] === ">") {
            angleBracketsCount--;
            if (angleBracketsCount === 0) {
              break;
            }
          }
        }
      } else if (xmlData.length > i + 9 && xmlData[i + 1] === "[" && xmlData[i + 2] === "C" && xmlData[i + 3] === "D" && xmlData[i + 4] === "A" && xmlData[i + 5] === "T" && xmlData[i + 6] === "A" && xmlData[i + 7] === "[") {
        for (i += 8; i < xmlData.length; i++) {
          if (xmlData[i] === "]" && xmlData[i + 1] === "]" && xmlData[i + 2] === ">") {
            i += 2;
            break;
          }
        }
      }
      return i;
    }
    var doubleQuote = '"';
    var singleQuote = "'";
    function readAttributeStr(xmlData, i) {
      let attrStr = "";
      let startChar = "";
      let tagClosed = false;
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
          if (startChar === "") {
            startChar = xmlData[i];
          } else if (startChar !== xmlData[i]) {
          } else {
            startChar = "";
          }
        } else if (xmlData[i] === ">") {
          if (startChar === "") {
            tagClosed = true;
            break;
          }
        }
        attrStr += xmlData[i];
      }
      if (startChar !== "") {
        return false;
      }
      return {
        value: attrStr,
        index: i,
        tagClosed
      };
    }
    var validAttrStrRegxp = new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`, "g");
    function validateAttributeString(attrStr, options) {
      const matches = util.getAllMatches(attrStr, validAttrStrRegxp);
      const attrNames = {};
      for (let i = 0; i < matches.length; i++) {
        if (matches[i][1].length === 0) {
          return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' has no space in starting.", getPositionFromMatch(matches[i]));
        } else if (matches[i][3] !== void 0 && matches[i][4] === void 0) {
          return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' is without value.", getPositionFromMatch(matches[i]));
        } else if (matches[i][3] === void 0 && !options.allowBooleanAttributes) {
          return getErrorObject("InvalidAttr", "boolean attribute '" + matches[i][2] + "' is not allowed.", getPositionFromMatch(matches[i]));
        }
        const attrName = matches[i][2];
        if (!validateAttrName(attrName)) {
          return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is an invalid name.", getPositionFromMatch(matches[i]));
        }
        if (!attrNames.hasOwnProperty(attrName)) {
          attrNames[attrName] = 1;
        } else {
          return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is repeated.", getPositionFromMatch(matches[i]));
        }
      }
      return true;
    }
    function validateNumberAmpersand(xmlData, i) {
      let re = /\d/;
      if (xmlData[i] === "x") {
        i++;
        re = /[\da-fA-F]/;
      }
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === ";")
          return i;
        if (!xmlData[i].match(re))
          break;
      }
      return -1;
    }
    function validateAmpersand(xmlData, i) {
      i++;
      if (xmlData[i] === ";")
        return -1;
      if (xmlData[i] === "#") {
        i++;
        return validateNumberAmpersand(xmlData, i);
      }
      let count = 0;
      for (; i < xmlData.length; i++, count++) {
        if (xmlData[i].match(/\w/) && count < 20)
          continue;
        if (xmlData[i] === ";")
          break;
        return -1;
      }
      return i;
    }
    function getErrorObject(code, message, lineNumber) {
      return {
        err: {
          code,
          msg: message,
          line: lineNumber.line || lineNumber,
          col: lineNumber.col
        }
      };
    }
    function validateAttrName(attrName) {
      return util.isName(attrName);
    }
    function validateTagName(tagname) {
      return util.isName(tagname);
    }
    function getLineNumberForPosition(xmlData, index) {
      const lines = xmlData.substring(0, index).split(/\r?\n/);
      return {
        line: lines.length,
        // column number is last line's length + 1, because column numbering starts at 1:
        col: lines[lines.length - 1].length + 1
      };
    }
    function getPositionFromMatch(match) {
      return match.startIndex + match[1].length;
    }
  }
});

// node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js
var require_OptionsBuilder = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js"(exports2) {
    var defaultOptions = {
      preserveOrder: false,
      attributeNamePrefix: "@_",
      attributesGroupName: false,
      textNodeName: "#text",
      ignoreAttributes: true,
      removeNSPrefix: false,
      // remove NS from tag name or attribute name if true
      allowBooleanAttributes: false,
      //a tag can have attributes without any value
      //ignoreRootElement : false,
      parseTagValue: true,
      parseAttributeValue: false,
      trimValues: true,
      //Trim string values of tag and attributes
      cdataPropName: false,
      numberParseOptions: {
        hex: true,
        leadingZeros: true,
        eNotation: true
      },
      tagValueProcessor: function(tagName, val2) {
        return val2;
      },
      attributeValueProcessor: function(attrName, val2) {
        return val2;
      },
      stopNodes: [],
      //nested tags will not be parsed even for errors
      alwaysCreateTextNode: false,
      isArray: () => false,
      commentPropName: false,
      unpairedTags: [],
      processEntities: true,
      htmlEntities: false,
      ignoreDeclaration: false,
      ignorePiTags: false,
      transformTagName: false,
      transformAttributeName: false,
      updateTag: function(tagName, jPath, attrs) {
        return tagName;
      }
      // skipEmptyListItem: false
    };
    var buildOptions = function(options) {
      return Object.assign({}, defaultOptions, options);
    };
    exports2.buildOptions = buildOptions;
    exports2.defaultOptions = defaultOptions;
  }
});

// node_modules/fast-xml-parser/src/xmlparser/xmlNode.js
var require_xmlNode = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/xmlNode.js"(exports2, module2) {
    "use strict";
    var XmlNode = class {
      constructor(tagname) {
        this.tagname = tagname;
        this.child = [];
        this[":@"] = {};
      }
      add(key, val2) {
        if (key === "__proto__")
          key = "#__proto__";
        this.child.push({ [key]: val2 });
      }
      addChild(node) {
        if (node.tagname === "__proto__")
          node.tagname = "#__proto__";
        if (node[":@"] && Object.keys(node[":@"]).length > 0) {
          this.child.push({ [node.tagname]: node.child, [":@"]: node[":@"] });
        } else {
          this.child.push({ [node.tagname]: node.child });
        }
      }
    };
    module2.exports = XmlNode;
  }
});

// node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js
var require_DocTypeReader = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js"(exports2, module2) {
    var util = require_util();
    function readDocType(xmlData, i) {
      const entities = {};
      if (xmlData[i + 3] === "O" && xmlData[i + 4] === "C" && xmlData[i + 5] === "T" && xmlData[i + 6] === "Y" && xmlData[i + 7] === "P" && xmlData[i + 8] === "E") {
        i = i + 9;
        let angleBracketsCount = 1;
        let hasBody = false, comment = false;
        let exp = "";
        for (; i < xmlData.length; i++) {
          if (xmlData[i] === "<" && !comment) {
            if (hasBody && isEntity(xmlData, i)) {
              i += 7;
              [entityName, val, i] = readEntityExp(xmlData, i + 1);
              if (val.indexOf("&") === -1)
                entities[validateEntityName(entityName)] = {
                  regx: RegExp(`&${entityName};`, "g"),
                  val
                };
            } else if (hasBody && isElement(xmlData, i))
              i += 8;
            else if (hasBody && isAttlist(xmlData, i))
              i += 8;
            else if (hasBody && isNotation(xmlData, i))
              i += 9;
            else if (isComment)
              comment = true;
            else
              throw new Error("Invalid DOCTYPE");
            angleBracketsCount++;
            exp = "";
          } else if (xmlData[i] === ">") {
            if (comment) {
              if (xmlData[i - 1] === "-" && xmlData[i - 2] === "-") {
                comment = false;
                angleBracketsCount--;
              }
            } else {
              angleBracketsCount--;
            }
            if (angleBracketsCount === 0) {
              break;
            }
          } else if (xmlData[i] === "[") {
            hasBody = true;
          } else {
            exp += xmlData[i];
          }
        }
        if (angleBracketsCount !== 0) {
          throw new Error(`Unclosed DOCTYPE`);
        }
      } else {
        throw new Error(`Invalid Tag instead of DOCTYPE`);
      }
      return { entities, i };
    }
    function readEntityExp(xmlData, i) {
      let entityName2 = "";
      for (; i < xmlData.length && (xmlData[i] !== "'" && xmlData[i] !== '"'); i++) {
        entityName2 += xmlData[i];
      }
      entityName2 = entityName2.trim();
      if (entityName2.indexOf(" ") !== -1)
        throw new Error("External entites are not supported");
      const startChar = xmlData[i++];
      let val2 = "";
      for (; i < xmlData.length && xmlData[i] !== startChar; i++) {
        val2 += xmlData[i];
      }
      return [entityName2, val2, i];
    }
    function isComment(xmlData, i) {
      if (xmlData[i + 1] === "!" && xmlData[i + 2] === "-" && xmlData[i + 3] === "-")
        return true;
      return false;
    }
    function isEntity(xmlData, i) {
      if (xmlData[i + 1] === "!" && xmlData[i + 2] === "E" && xmlData[i + 3] === "N" && xmlData[i + 4] === "T" && xmlData[i + 5] === "I" && xmlData[i + 6] === "T" && xmlData[i + 7] === "Y")
        return true;
      return false;
    }
    function isElement(xmlData, i) {
      if (xmlData[i + 1] === "!" && xmlData[i + 2] === "E" && xmlData[i + 3] === "L" && xmlData[i + 4] === "E" && xmlData[i + 5] === "M" && xmlData[i + 6] === "E" && xmlData[i + 7] === "N" && xmlData[i + 8] === "T")
        return true;
      return false;
    }
    function isAttlist(xmlData, i) {
      if (xmlData[i + 1] === "!" && xmlData[i + 2] === "A" && xmlData[i + 3] === "T" && xmlData[i + 4] === "T" && xmlData[i + 5] === "L" && xmlData[i + 6] === "I" && xmlData[i + 7] === "S" && xmlData[i + 8] === "T")
        return true;
      return false;
    }
    function isNotation(xmlData, i) {
      if (xmlData[i + 1] === "!" && xmlData[i + 2] === "N" && xmlData[i + 3] === "O" && xmlData[i + 4] === "T" && xmlData[i + 5] === "A" && xmlData[i + 6] === "T" && xmlData[i + 7] === "I" && xmlData[i + 8] === "O" && xmlData[i + 9] === "N")
        return true;
      return false;
    }
    function validateEntityName(name) {
      if (util.isName(name))
        return name;
      else
        throw new Error(`Invalid entity name ${name}`);
    }
    module2.exports = readDocType;
  }
});

// node_modules/strnum/strnum.js
var require_strnum = __commonJS({
  "node_modules/strnum/strnum.js"(exports2, module2) {
    var hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
    var numRegex = /^([\-\+])?(0*)(\.[0-9]+([eE]\-?[0-9]+)?|[0-9]+(\.[0-9]+([eE]\-?[0-9]+)?)?)$/;
    if (!Number.parseInt && window.parseInt) {
      Number.parseInt = window.parseInt;
    }
    if (!Number.parseFloat && window.parseFloat) {
      Number.parseFloat = window.parseFloat;
    }
    var consider = {
      hex: true,
      leadingZeros: true,
      decimalPoint: ".",
      eNotation: true
      //skipLike: /regex/
    };
    function toNumber(str, options = {}) {
      options = Object.assign({}, consider, options);
      if (!str || typeof str !== "string")
        return str;
      let trimmedStr = str.trim();
      if (options.skipLike !== void 0 && options.skipLike.test(trimmedStr))
        return str;
      else if (options.hex && hexRegex.test(trimmedStr)) {
        return Number.parseInt(trimmedStr, 16);
      } else {
        const match = numRegex.exec(trimmedStr);
        if (match) {
          const sign = match[1];
          const leadingZeros = match[2];
          let numTrimmedByZeros = trimZeros(match[3]);
          const eNotation = match[4] || match[6];
          if (!options.leadingZeros && leadingZeros.length > 0 && sign && trimmedStr[2] !== ".")
            return str;
          else if (!options.leadingZeros && leadingZeros.length > 0 && !sign && trimmedStr[1] !== ".")
            return str;
          else {
            const num = Number(trimmedStr);
            const numStr = "" + num;
            if (numStr.search(/[eE]/) !== -1) {
              if (options.eNotation)
                return num;
              else
                return str;
            } else if (eNotation) {
              if (options.eNotation)
                return num;
              else
                return str;
            } else if (trimmedStr.indexOf(".") !== -1) {
              if (numStr === "0" && numTrimmedByZeros === "")
                return num;
              else if (numStr === numTrimmedByZeros)
                return num;
              else if (sign && numStr === "-" + numTrimmedByZeros)
                return num;
              else
                return str;
            }
            if (leadingZeros) {
              if (numTrimmedByZeros === numStr)
                return num;
              else if (sign + numTrimmedByZeros === numStr)
                return num;
              else
                return str;
            }
            if (trimmedStr === numStr)
              return num;
            else if (trimmedStr === sign + numStr)
              return num;
            return str;
          }
        } else {
          return str;
        }
      }
    }
    function trimZeros(numStr) {
      if (numStr && numStr.indexOf(".") !== -1) {
        numStr = numStr.replace(/0+$/, "");
        if (numStr === ".")
          numStr = "0";
        else if (numStr[0] === ".")
          numStr = "0" + numStr;
        else if (numStr[numStr.length - 1] === ".")
          numStr = numStr.substr(0, numStr.length - 1);
        return numStr;
      }
      return numStr;
    }
    module2.exports = toNumber;
  }
});

// node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js
var require_OrderedObjParser = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js"(exports2, module2) {
    "use strict";
    var util = require_util();
    var xmlNode = require_xmlNode();
    var readDocType = require_DocTypeReader();
    var toNumber = require_strnum();
    var OrderedObjParser = class {
      constructor(options) {
        this.options = options;
        this.currentNode = null;
        this.tagsNodeStack = [];
        this.docTypeEntities = {};
        this.lastEntities = {
          "apos": { regex: /&(apos|#39|#x27);/g, val: "'" },
          "gt": { regex: /&(gt|#62|#x3E);/g, val: ">" },
          "lt": { regex: /&(lt|#60|#x3C);/g, val: "<" },
          "quot": { regex: /&(quot|#34|#x22);/g, val: '"' }
        };
        this.ampEntity = { regex: /&(amp|#38|#x26);/g, val: "&" };
        this.htmlEntities = {
          "space": { regex: /&(nbsp|#160);/g, val: " " },
          // "lt" : { regex: /&(lt|#60);/g, val: "<" },
          // "gt" : { regex: /&(gt|#62);/g, val: ">" },
          // "amp" : { regex: /&(amp|#38);/g, val: "&" },
          // "quot" : { regex: /&(quot|#34);/g, val: "\"" },
          // "apos" : { regex: /&(apos|#39);/g, val: "'" },
          "cent": { regex: /&(cent|#162);/g, val: "\xA2" },
          "pound": { regex: /&(pound|#163);/g, val: "\xA3" },
          "yen": { regex: /&(yen|#165);/g, val: "\xA5" },
          "euro": { regex: /&(euro|#8364);/g, val: "\u20AC" },
          "copyright": { regex: /&(copy|#169);/g, val: "\xA9" },
          "reg": { regex: /&(reg|#174);/g, val: "\xAE" },
          "inr": { regex: /&(inr|#8377);/g, val: "\u20B9" },
          "num_dec": { regex: /&#([0-9]{1,7});/g, val: (_, str) => String.fromCharCode(Number.parseInt(str, 10)) },
          "num_hex": { regex: /&#x([0-9a-fA-F]{1,6});/g, val: (_, str) => String.fromCharCode(Number.parseInt(str, 16)) }
        };
        this.addExternalEntities = addExternalEntities;
        this.parseXml = parseXml;
        this.parseTextData = parseTextData;
        this.resolveNameSpace = resolveNameSpace;
        this.buildAttributesMap = buildAttributesMap;
        this.isItStopNode = isItStopNode;
        this.replaceEntitiesValue = replaceEntitiesValue;
        this.readStopNodeData = readStopNodeData;
        this.saveTextToParentTag = saveTextToParentTag;
        this.addChild = addChild;
      }
    };
    function addExternalEntities(externalEntities) {
      const entKeys = Object.keys(externalEntities);
      for (let i = 0; i < entKeys.length; i++) {
        const ent = entKeys[i];
        this.lastEntities[ent] = {
          regex: new RegExp("&" + ent + ";", "g"),
          val: externalEntities[ent]
        };
      }
    }
    function parseTextData(val2, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
      if (val2 !== void 0) {
        if (this.options.trimValues && !dontTrim) {
          val2 = val2.trim();
        }
        if (val2.length > 0) {
          if (!escapeEntities)
            val2 = this.replaceEntitiesValue(val2);
          const newval = this.options.tagValueProcessor(tagName, val2, jPath, hasAttributes, isLeafNode);
          if (newval === null || newval === void 0) {
            return val2;
          } else if (typeof newval !== typeof val2 || newval !== val2) {
            return newval;
          } else if (this.options.trimValues) {
            return parseValue(val2, this.options.parseTagValue, this.options.numberParseOptions);
          } else {
            const trimmedVal = val2.trim();
            if (trimmedVal === val2) {
              return parseValue(val2, this.options.parseTagValue, this.options.numberParseOptions);
            } else {
              return val2;
            }
          }
        }
      }
    }
    function resolveNameSpace(tagname) {
      if (this.options.removeNSPrefix) {
        const tags = tagname.split(":");
        const prefix = tagname.charAt(0) === "/" ? "/" : "";
        if (tags[0] === "xmlns") {
          return "";
        }
        if (tags.length === 2) {
          tagname = prefix + tags[1];
        }
      }
      return tagname;
    }
    var attrsRegx = new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
    function buildAttributesMap(attrStr, jPath, tagName) {
      if (!this.options.ignoreAttributes && typeof attrStr === "string") {
        const matches = util.getAllMatches(attrStr, attrsRegx);
        const len = matches.length;
        const attrs = {};
        for (let i = 0; i < len; i++) {
          const attrName = this.resolveNameSpace(matches[i][1]);
          let oldVal = matches[i][4];
          let aName = this.options.attributeNamePrefix + attrName;
          if (attrName.length) {
            if (this.options.transformAttributeName) {
              aName = this.options.transformAttributeName(aName);
            }
            if (aName === "__proto__")
              aName = "#__proto__";
            if (oldVal !== void 0) {
              if (this.options.trimValues) {
                oldVal = oldVal.trim();
              }
              oldVal = this.replaceEntitiesValue(oldVal);
              const newVal = this.options.attributeValueProcessor(attrName, oldVal, jPath);
              if (newVal === null || newVal === void 0) {
                attrs[aName] = oldVal;
              } else if (typeof newVal !== typeof oldVal || newVal !== oldVal) {
                attrs[aName] = newVal;
              } else {
                attrs[aName] = parseValue(
                  oldVal,
                  this.options.parseAttributeValue,
                  this.options.numberParseOptions
                );
              }
            } else if (this.options.allowBooleanAttributes) {
              attrs[aName] = true;
            }
          }
        }
        if (!Object.keys(attrs).length) {
          return;
        }
        if (this.options.attributesGroupName) {
          const attrCollection = {};
          attrCollection[this.options.attributesGroupName] = attrs;
          return attrCollection;
        }
        return attrs;
      }
    }
    var parseXml = function(xmlData) {
      xmlData = xmlData.replace(/\r\n?/g, "\n");
      const xmlObj = new xmlNode("!xml");
      let currentNode = xmlObj;
      let textData = "";
      let jPath = "";
      for (let i = 0; i < xmlData.length; i++) {
        const ch = xmlData[i];
        if (ch === "<") {
          if (xmlData[i + 1] === "/") {
            const closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.");
            let tagName = xmlData.substring(i + 2, closeIndex).trim();
            if (this.options.removeNSPrefix) {
              const colonIndex = tagName.indexOf(":");
              if (colonIndex !== -1) {
                tagName = tagName.substr(colonIndex + 1);
              }
            }
            if (this.options.transformTagName) {
              tagName = this.options.transformTagName(tagName);
            }
            if (currentNode) {
              textData = this.saveTextToParentTag(textData, currentNode, jPath);
            }
            const lastTagName = jPath.substring(jPath.lastIndexOf(".") + 1);
            if (tagName && this.options.unpairedTags.indexOf(tagName) !== -1) {
              throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
            }
            let propIndex = 0;
            if (lastTagName && this.options.unpairedTags.indexOf(lastTagName) !== -1) {
              propIndex = jPath.lastIndexOf(".", jPath.lastIndexOf(".") - 1);
              this.tagsNodeStack.pop();
            } else {
              propIndex = jPath.lastIndexOf(".");
            }
            jPath = jPath.substring(0, propIndex);
            currentNode = this.tagsNodeStack.pop();
            textData = "";
            i = closeIndex;
          } else if (xmlData[i + 1] === "?") {
            let tagData = readTagExp(xmlData, i, false, "?>");
            if (!tagData)
              throw new Error("Pi Tag is not closed.");
            textData = this.saveTextToParentTag(textData, currentNode, jPath);
            if (this.options.ignoreDeclaration && tagData.tagName === "?xml" || this.options.ignorePiTags) {
            } else {
              const childNode = new xmlNode(tagData.tagName);
              childNode.add(this.options.textNodeName, "");
              if (tagData.tagName !== tagData.tagExp && tagData.attrExpPresent) {
                childNode[":@"] = this.buildAttributesMap(tagData.tagExp, jPath, tagData.tagName);
              }
              this.addChild(currentNode, childNode, jPath);
            }
            i = tagData.closeIndex + 1;
          } else if (xmlData.substr(i + 1, 3) === "!--") {
            const endIndex = findClosingIndex(xmlData, "-->", i + 4, "Comment is not closed.");
            if (this.options.commentPropName) {
              const comment = xmlData.substring(i + 4, endIndex - 2);
              textData = this.saveTextToParentTag(textData, currentNode, jPath);
              currentNode.add(this.options.commentPropName, [{ [this.options.textNodeName]: comment }]);
            }
            i = endIndex;
          } else if (xmlData.substr(i + 1, 2) === "!D") {
            const result = readDocType(xmlData, i);
            this.docTypeEntities = result.entities;
            i = result.i;
          } else if (xmlData.substr(i + 1, 2) === "![") {
            const closeIndex = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
            const tagExp = xmlData.substring(i + 9, closeIndex);
            textData = this.saveTextToParentTag(textData, currentNode, jPath);
            let val2 = this.parseTextData(tagExp, currentNode.tagname, jPath, true, false, true, true);
            if (val2 == void 0)
              val2 = "";
            if (this.options.cdataPropName) {
              currentNode.add(this.options.cdataPropName, [{ [this.options.textNodeName]: tagExp }]);
            } else {
              currentNode.add(this.options.textNodeName, val2);
            }
            i = closeIndex + 2;
          } else {
            let result = readTagExp(xmlData, i, this.options.removeNSPrefix);
            let tagName = result.tagName;
            const rawTagName = result.rawTagName;
            let tagExp = result.tagExp;
            let attrExpPresent = result.attrExpPresent;
            let closeIndex = result.closeIndex;
            if (this.options.transformTagName) {
              tagName = this.options.transformTagName(tagName);
            }
            if (currentNode && textData) {
              if (currentNode.tagname !== "!xml") {
                textData = this.saveTextToParentTag(textData, currentNode, jPath, false);
              }
            }
            const lastTag = currentNode;
            if (lastTag && this.options.unpairedTags.indexOf(lastTag.tagname) !== -1) {
              currentNode = this.tagsNodeStack.pop();
              jPath = jPath.substring(0, jPath.lastIndexOf("."));
            }
            if (tagName !== xmlObj.tagname) {
              jPath += jPath ? "." + tagName : tagName;
            }
            if (this.isItStopNode(this.options.stopNodes, jPath, tagName)) {
              let tagContent = "";
              if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
                if (tagName[tagName.length - 1] === "/") {
                  tagName = tagName.substr(0, tagName.length - 1);
                  jPath = jPath.substr(0, jPath.length - 1);
                  tagExp = tagName;
                } else {
                  tagExp = tagExp.substr(0, tagExp.length - 1);
                }
                i = result.closeIndex;
              } else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
                i = result.closeIndex;
              } else {
                const result2 = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
                if (!result2)
                  throw new Error(`Unexpected end of ${rawTagName}`);
                i = result2.i;
                tagContent = result2.tagContent;
              }
              const childNode = new xmlNode(tagName);
              if (tagName !== tagExp && attrExpPresent) {
                childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
              }
              if (tagContent) {
                tagContent = this.parseTextData(tagContent, tagName, jPath, true, attrExpPresent, true, true);
              }
              jPath = jPath.substr(0, jPath.lastIndexOf("."));
              childNode.add(this.options.textNodeName, tagContent);
              this.addChild(currentNode, childNode, jPath);
            } else {
              if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
                if (tagName[tagName.length - 1] === "/") {
                  tagName = tagName.substr(0, tagName.length - 1);
                  jPath = jPath.substr(0, jPath.length - 1);
                  tagExp = tagName;
                } else {
                  tagExp = tagExp.substr(0, tagExp.length - 1);
                }
                if (this.options.transformTagName) {
                  tagName = this.options.transformTagName(tagName);
                }
                const childNode = new xmlNode(tagName);
                if (tagName !== tagExp && attrExpPresent) {
                  childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
                }
                this.addChild(currentNode, childNode, jPath);
                jPath = jPath.substr(0, jPath.lastIndexOf("."));
              } else {
                const childNode = new xmlNode(tagName);
                this.tagsNodeStack.push(currentNode);
                if (tagName !== tagExp && attrExpPresent) {
                  childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
                }
                this.addChild(currentNode, childNode, jPath);
                currentNode = childNode;
              }
              textData = "";
              i = closeIndex;
            }
          }
        } else {
          textData += xmlData[i];
        }
      }
      return xmlObj.child;
    };
    function addChild(currentNode, childNode, jPath) {
      const result = this.options.updateTag(childNode.tagname, jPath, childNode[":@"]);
      if (result === false) {
      } else if (typeof result === "string") {
        childNode.tagname = result;
        currentNode.addChild(childNode);
      } else {
        currentNode.addChild(childNode);
      }
    }
    var replaceEntitiesValue = function(val2) {
      if (this.options.processEntities) {
        for (let entityName2 in this.docTypeEntities) {
          const entity = this.docTypeEntities[entityName2];
          val2 = val2.replace(entity.regx, entity.val);
        }
        for (let entityName2 in this.lastEntities) {
          const entity = this.lastEntities[entityName2];
          val2 = val2.replace(entity.regex, entity.val);
        }
        if (this.options.htmlEntities) {
          for (let entityName2 in this.htmlEntities) {
            const entity = this.htmlEntities[entityName2];
            val2 = val2.replace(entity.regex, entity.val);
          }
        }
        val2 = val2.replace(this.ampEntity.regex, this.ampEntity.val);
      }
      return val2;
    };
    function saveTextToParentTag(textData, currentNode, jPath, isLeafNode) {
      if (textData) {
        if (isLeafNode === void 0)
          isLeafNode = Object.keys(currentNode.child).length === 0;
        textData = this.parseTextData(
          textData,
          currentNode.tagname,
          jPath,
          false,
          currentNode[":@"] ? Object.keys(currentNode[":@"]).length !== 0 : false,
          isLeafNode
        );
        if (textData !== void 0 && textData !== "")
          currentNode.add(this.options.textNodeName, textData);
        textData = "";
      }
      return textData;
    }
    function isItStopNode(stopNodes, jPath, currentTagName) {
      const allNodesExp = "*." + currentTagName;
      for (const stopNodePath in stopNodes) {
        const stopNodeExp = stopNodes[stopNodePath];
        if (allNodesExp === stopNodeExp || jPath === stopNodeExp)
          return true;
      }
      return false;
    }
    function tagExpWithClosingIndex(xmlData, i, closingChar = ">") {
      let attrBoundary;
      let tagExp = "";
      for (let index = i; index < xmlData.length; index++) {
        let ch = xmlData[index];
        if (attrBoundary) {
          if (ch === attrBoundary)
            attrBoundary = "";
        } else if (ch === '"' || ch === "'") {
          attrBoundary = ch;
        } else if (ch === closingChar[0]) {
          if (closingChar[1]) {
            if (xmlData[index + 1] === closingChar[1]) {
              return {
                data: tagExp,
                index
              };
            }
          } else {
            return {
              data: tagExp,
              index
            };
          }
        } else if (ch === "	") {
          ch = " ";
        }
        tagExp += ch;
      }
    }
    function findClosingIndex(xmlData, str, i, errMsg) {
      const closingIndex = xmlData.indexOf(str, i);
      if (closingIndex === -1) {
        throw new Error(errMsg);
      } else {
        return closingIndex + str.length - 1;
      }
    }
    function readTagExp(xmlData, i, removeNSPrefix, closingChar = ">") {
      const result = tagExpWithClosingIndex(xmlData, i + 1, closingChar);
      if (!result)
        return;
      let tagExp = result.data;
      const closeIndex = result.index;
      const separatorIndex = tagExp.search(/\s/);
      let tagName = tagExp;
      let attrExpPresent = true;
      if (separatorIndex !== -1) {
        tagName = tagExp.substring(0, separatorIndex);
        tagExp = tagExp.substring(separatorIndex + 1).trimStart();
      }
      const rawTagName = tagName;
      if (removeNSPrefix) {
        const colonIndex = tagName.indexOf(":");
        if (colonIndex !== -1) {
          tagName = tagName.substr(colonIndex + 1);
          attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
        }
      }
      return {
        tagName,
        tagExp,
        closeIndex,
        attrExpPresent,
        rawTagName
      };
    }
    function readStopNodeData(xmlData, tagName, i) {
      const startIndex = i;
      let openTagCount = 1;
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === "<") {
          if (xmlData[i + 1] === "/") {
            const closeIndex = findClosingIndex(xmlData, ">", i, `${tagName} is not closed`);
            let closeTagName = xmlData.substring(i + 2, closeIndex).trim();
            if (closeTagName === tagName) {
              openTagCount--;
              if (openTagCount === 0) {
                return {
                  tagContent: xmlData.substring(startIndex, i),
                  i: closeIndex
                };
              }
            }
            i = closeIndex;
          } else if (xmlData[i + 1] === "?") {
            const closeIndex = findClosingIndex(xmlData, "?>", i + 1, "StopNode is not closed.");
            i = closeIndex;
          } else if (xmlData.substr(i + 1, 3) === "!--") {
            const closeIndex = findClosingIndex(xmlData, "-->", i + 3, "StopNode is not closed.");
            i = closeIndex;
          } else if (xmlData.substr(i + 1, 2) === "![") {
            const closeIndex = findClosingIndex(xmlData, "]]>", i, "StopNode is not closed.") - 2;
            i = closeIndex;
          } else {
            const tagData = readTagExp(xmlData, i, ">");
            if (tagData) {
              const openTagName = tagData && tagData.tagName;
              if (openTagName === tagName && tagData.tagExp[tagData.tagExp.length - 1] !== "/") {
                openTagCount++;
              }
              i = tagData.closeIndex;
            }
          }
        }
      }
    }
    function parseValue(val2, shouldParse, options) {
      if (shouldParse && typeof val2 === "string") {
        const newval = val2.trim();
        if (newval === "true")
          return true;
        else if (newval === "false")
          return false;
        else
          return toNumber(val2, options);
      } else {
        if (util.isExist(val2)) {
          return val2;
        } else {
          return "";
        }
      }
    }
    module2.exports = OrderedObjParser;
  }
});

// node_modules/fast-xml-parser/src/xmlparser/node2json.js
var require_node2json = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/node2json.js"(exports2) {
    "use strict";
    function prettify(node, options) {
      return compress(node, options);
    }
    function compress(arr, options, jPath) {
      let text;
      const compressedObj = {};
      for (let i = 0; i < arr.length; i++) {
        const tagObj = arr[i];
        const property = propName(tagObj);
        let newJpath = "";
        if (jPath === void 0)
          newJpath = property;
        else
          newJpath = jPath + "." + property;
        if (property === options.textNodeName) {
          if (text === void 0)
            text = tagObj[property];
          else
            text += "" + tagObj[property];
        } else if (property === void 0) {
          continue;
        } else if (tagObj[property]) {
          let val2 = compress(tagObj[property], options, newJpath);
          const isLeaf = isLeafTag(val2, options);
          if (tagObj[":@"]) {
            assignAttributes(val2, tagObj[":@"], newJpath, options);
          } else if (Object.keys(val2).length === 1 && val2[options.textNodeName] !== void 0 && !options.alwaysCreateTextNode) {
            val2 = val2[options.textNodeName];
          } else if (Object.keys(val2).length === 0) {
            if (options.alwaysCreateTextNode)
              val2[options.textNodeName] = "";
            else
              val2 = "";
          }
          if (compressedObj[property] !== void 0 && compressedObj.hasOwnProperty(property)) {
            if (!Array.isArray(compressedObj[property])) {
              compressedObj[property] = [compressedObj[property]];
            }
            compressedObj[property].push(val2);
          } else {
            if (options.isArray(property, newJpath, isLeaf)) {
              compressedObj[property] = [val2];
            } else {
              compressedObj[property] = val2;
            }
          }
        }
      }
      if (typeof text === "string") {
        if (text.length > 0)
          compressedObj[options.textNodeName] = text;
      } else if (text !== void 0)
        compressedObj[options.textNodeName] = text;
      return compressedObj;
    }
    function propName(obj) {
      const keys = Object.keys(obj);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key !== ":@")
          return key;
      }
    }
    function assignAttributes(obj, attrMap, jpath, options) {
      if (attrMap) {
        const keys = Object.keys(attrMap);
        const len = keys.length;
        for (let i = 0; i < len; i++) {
          const atrrName = keys[i];
          if (options.isArray(atrrName, jpath + "." + atrrName, true, true)) {
            obj[atrrName] = [attrMap[atrrName]];
          } else {
            obj[atrrName] = attrMap[atrrName];
          }
        }
      }
    }
    function isLeafTag(obj, options) {
      const { textNodeName } = options;
      const propCount = Object.keys(obj).length;
      if (propCount === 0) {
        return true;
      }
      if (propCount === 1 && (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)) {
        return true;
      }
      return false;
    }
    exports2.prettify = prettify;
  }
});

// node_modules/fast-xml-parser/src/xmlparser/XMLParser.js
var require_XMLParser = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/XMLParser.js"(exports2, module2) {
    var { buildOptions } = require_OptionsBuilder();
    var OrderedObjParser = require_OrderedObjParser();
    var { prettify } = require_node2json();
    var validator = require_validator();
    var XMLParser2 = class {
      constructor(options) {
        this.externalEntities = {};
        this.options = buildOptions(options);
      }
      /**
       * Parse XML dats to JS object 
       * @param {string|Buffer} xmlData 
       * @param {boolean|Object} validationOption 
       */
      parse(xmlData, validationOption) {
        if (typeof xmlData === "string") {
        } else if (xmlData.toString) {
          xmlData = xmlData.toString();
        } else {
          throw new Error("XML data is accepted in String or Bytes[] form.");
        }
        if (validationOption) {
          if (validationOption === true)
            validationOption = {};
          const result = validator.validate(xmlData, validationOption);
          if (result !== true) {
            throw Error(`${result.err.msg}:${result.err.line}:${result.err.col}`);
          }
        }
        const orderedObjParser = new OrderedObjParser(this.options);
        orderedObjParser.addExternalEntities(this.externalEntities);
        const orderedResult = orderedObjParser.parseXml(xmlData);
        if (this.options.preserveOrder || orderedResult === void 0)
          return orderedResult;
        else
          return prettify(orderedResult, this.options);
      }
      /**
       * Add Entity which is not by default supported by this library
       * @param {string} key 
       * @param {string} value 
       */
      addEntity(key, value) {
        if (value.indexOf("&") !== -1) {
          throw new Error("Entity value can't have '&'");
        } else if (key.indexOf("&") !== -1 || key.indexOf(";") !== -1) {
          throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
        } else if (value === "&") {
          throw new Error("An entity with value '&' is not permitted");
        } else {
          this.externalEntities[key] = value;
        }
      }
    };
    module2.exports = XMLParser2;
  }
});

// node_modules/fast-xml-parser/src/xmlbuilder/orderedJs2Xml.js
var require_orderedJs2Xml = __commonJS({
  "node_modules/fast-xml-parser/src/xmlbuilder/orderedJs2Xml.js"(exports2, module2) {
    var EOL = "\n";
    function toXml(jArray, options) {
      let indentation = "";
      if (options.format && options.indentBy.length > 0) {
        indentation = EOL;
      }
      return arrToStr(jArray, options, "", indentation);
    }
    function arrToStr(arr, options, jPath, indentation) {
      let xmlStr = "";
      let isPreviousElementTag = false;
      for (let i = 0; i < arr.length; i++) {
        const tagObj = arr[i];
        const tagName = propName(tagObj);
        if (tagName === void 0)
          continue;
        let newJPath = "";
        if (jPath.length === 0)
          newJPath = tagName;
        else
          newJPath = `${jPath}.${tagName}`;
        if (tagName === options.textNodeName) {
          let tagText = tagObj[tagName];
          if (!isStopNode(newJPath, options)) {
            tagText = options.tagValueProcessor(tagName, tagText);
            tagText = replaceEntitiesValue(tagText, options);
          }
          if (isPreviousElementTag) {
            xmlStr += indentation;
          }
          xmlStr += tagText;
          isPreviousElementTag = false;
          continue;
        } else if (tagName === options.cdataPropName) {
          if (isPreviousElementTag) {
            xmlStr += indentation;
          }
          xmlStr += `<![CDATA[${tagObj[tagName][0][options.textNodeName]}]]>`;
          isPreviousElementTag = false;
          continue;
        } else if (tagName === options.commentPropName) {
          xmlStr += indentation + `<!--${tagObj[tagName][0][options.textNodeName]}-->`;
          isPreviousElementTag = true;
          continue;
        } else if (tagName[0] === "?") {
          const attStr2 = attr_to_str(tagObj[":@"], options);
          const tempInd = tagName === "?xml" ? "" : indentation;
          let piTextNodeName = tagObj[tagName][0][options.textNodeName];
          piTextNodeName = piTextNodeName.length !== 0 ? " " + piTextNodeName : "";
          xmlStr += tempInd + `<${tagName}${piTextNodeName}${attStr2}?>`;
          isPreviousElementTag = true;
          continue;
        }
        let newIdentation = indentation;
        if (newIdentation !== "") {
          newIdentation += options.indentBy;
        }
        const attStr = attr_to_str(tagObj[":@"], options);
        const tagStart = indentation + `<${tagName}${attStr}`;
        const tagValue = arrToStr(tagObj[tagName], options, newJPath, newIdentation);
        if (options.unpairedTags.indexOf(tagName) !== -1) {
          if (options.suppressUnpairedNode)
            xmlStr += tagStart + ">";
          else
            xmlStr += tagStart + "/>";
        } else if ((!tagValue || tagValue.length === 0) && options.suppressEmptyNode) {
          xmlStr += tagStart + "/>";
        } else if (tagValue && tagValue.endsWith(">")) {
          xmlStr += tagStart + `>${tagValue}${indentation}</${tagName}>`;
        } else {
          xmlStr += tagStart + ">";
          if (tagValue && indentation !== "" && (tagValue.includes("/>") || tagValue.includes("</"))) {
            xmlStr += indentation + options.indentBy + tagValue + indentation;
          } else {
            xmlStr += tagValue;
          }
          xmlStr += `</${tagName}>`;
        }
        isPreviousElementTag = true;
      }
      return xmlStr;
    }
    function propName(obj) {
      const keys = Object.keys(obj);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (!obj.hasOwnProperty(key))
          continue;
        if (key !== ":@")
          return key;
      }
    }
    function attr_to_str(attrMap, options) {
      let attrStr = "";
      if (attrMap && !options.ignoreAttributes) {
        for (let attr in attrMap) {
          if (!attrMap.hasOwnProperty(attr))
            continue;
          let attrVal = options.attributeValueProcessor(attr, attrMap[attr]);
          attrVal = replaceEntitiesValue(attrVal, options);
          if (attrVal === true && options.suppressBooleanAttributes) {
            attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}`;
          } else {
            attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}="${attrVal}"`;
          }
        }
      }
      return attrStr;
    }
    function isStopNode(jPath, options) {
      jPath = jPath.substr(0, jPath.length - options.textNodeName.length - 1);
      let tagName = jPath.substr(jPath.lastIndexOf(".") + 1);
      for (let index in options.stopNodes) {
        if (options.stopNodes[index] === jPath || options.stopNodes[index] === "*." + tagName)
          return true;
      }
      return false;
    }
    function replaceEntitiesValue(textValue, options) {
      if (textValue && textValue.length > 0 && options.processEntities) {
        for (let i = 0; i < options.entities.length; i++) {
          const entity = options.entities[i];
          textValue = textValue.replace(entity.regex, entity.val);
        }
      }
      return textValue;
    }
    module2.exports = toXml;
  }
});

// node_modules/fast-xml-parser/src/xmlbuilder/json2xml.js
var require_json2xml = __commonJS({
  "node_modules/fast-xml-parser/src/xmlbuilder/json2xml.js"(exports2, module2) {
    "use strict";
    var buildFromOrderedJs = require_orderedJs2Xml();
    var defaultOptions = {
      attributeNamePrefix: "@_",
      attributesGroupName: false,
      textNodeName: "#text",
      ignoreAttributes: true,
      cdataPropName: false,
      format: false,
      indentBy: "  ",
      suppressEmptyNode: false,
      suppressUnpairedNode: true,
      suppressBooleanAttributes: true,
      tagValueProcessor: function(key, a) {
        return a;
      },
      attributeValueProcessor: function(attrName, a) {
        return a;
      },
      preserveOrder: false,
      commentPropName: false,
      unpairedTags: [],
      entities: [
        { regex: new RegExp("&", "g"), val: "&amp;" },
        //it must be on top
        { regex: new RegExp(">", "g"), val: "&gt;" },
        { regex: new RegExp("<", "g"), val: "&lt;" },
        { regex: new RegExp("'", "g"), val: "&apos;" },
        { regex: new RegExp('"', "g"), val: "&quot;" }
      ],
      processEntities: true,
      stopNodes: [],
      // transformTagName: false,
      // transformAttributeName: false,
      oneListGroup: false
    };
    function Builder(options) {
      this.options = Object.assign({}, defaultOptions, options);
      if (this.options.ignoreAttributes || this.options.attributesGroupName) {
        this.isAttribute = function() {
          return false;
        };
      } else {
        this.attrPrefixLen = this.options.attributeNamePrefix.length;
        this.isAttribute = isAttribute;
      }
      this.processTextOrObjNode = processTextOrObjNode;
      if (this.options.format) {
        this.indentate = indentate;
        this.tagEndChar = ">\n";
        this.newLine = "\n";
      } else {
        this.indentate = function() {
          return "";
        };
        this.tagEndChar = ">";
        this.newLine = "";
      }
    }
    Builder.prototype.build = function(jObj) {
      if (this.options.preserveOrder) {
        return buildFromOrderedJs(jObj, this.options);
      } else {
        if (Array.isArray(jObj) && this.options.arrayNodeName && this.options.arrayNodeName.length > 1) {
          jObj = {
            [this.options.arrayNodeName]: jObj
          };
        }
        return this.j2x(jObj, 0).val;
      }
    };
    Builder.prototype.j2x = function(jObj, level) {
      let attrStr = "";
      let val2 = "";
      for (let key in jObj) {
        if (!Object.prototype.hasOwnProperty.call(jObj, key))
          continue;
        if (typeof jObj[key] === "undefined") {
          if (this.isAttribute(key)) {
            val2 += "";
          }
        } else if (jObj[key] === null) {
          if (this.isAttribute(key)) {
            val2 += "";
          } else if (key[0] === "?") {
            val2 += this.indentate(level) + "<" + key + "?" + this.tagEndChar;
          } else {
            val2 += this.indentate(level) + "<" + key + "/" + this.tagEndChar;
          }
        } else if (jObj[key] instanceof Date) {
          val2 += this.buildTextValNode(jObj[key], key, "", level);
        } else if (typeof jObj[key] !== "object") {
          const attr = this.isAttribute(key);
          if (attr) {
            attrStr += this.buildAttrPairStr(attr, "" + jObj[key]);
          } else {
            if (key === this.options.textNodeName) {
              let newval = this.options.tagValueProcessor(key, "" + jObj[key]);
              val2 += this.replaceEntitiesValue(newval);
            } else {
              val2 += this.buildTextValNode(jObj[key], key, "", level);
            }
          }
        } else if (Array.isArray(jObj[key])) {
          const arrLen = jObj[key].length;
          let listTagVal = "";
          let listTagAttr = "";
          for (let j = 0; j < arrLen; j++) {
            const item = jObj[key][j];
            if (typeof item === "undefined") {
            } else if (item === null) {
              if (key[0] === "?")
                val2 += this.indentate(level) + "<" + key + "?" + this.tagEndChar;
              else
                val2 += this.indentate(level) + "<" + key + "/" + this.tagEndChar;
            } else if (typeof item === "object") {
              if (this.options.oneListGroup) {
                const result = this.j2x(item, level + 1);
                listTagVal += result.val;
                if (this.options.attributesGroupName && item.hasOwnProperty(this.options.attributesGroupName)) {
                  listTagAttr += result.attrStr;
                }
              } else {
                listTagVal += this.processTextOrObjNode(item, key, level);
              }
            } else {
              if (this.options.oneListGroup) {
                let textValue = this.options.tagValueProcessor(key, item);
                textValue = this.replaceEntitiesValue(textValue);
                listTagVal += textValue;
              } else {
                listTagVal += this.buildTextValNode(item, key, "", level);
              }
            }
          }
          if (this.options.oneListGroup) {
            listTagVal = this.buildObjectNode(listTagVal, key, listTagAttr, level);
          }
          val2 += listTagVal;
        } else {
          if (this.options.attributesGroupName && key === this.options.attributesGroupName) {
            const Ks = Object.keys(jObj[key]);
            const L = Ks.length;
            for (let j = 0; j < L; j++) {
              attrStr += this.buildAttrPairStr(Ks[j], "" + jObj[key][Ks[j]]);
            }
          } else {
            val2 += this.processTextOrObjNode(jObj[key], key, level);
          }
        }
      }
      return { attrStr, val: val2 };
    };
    Builder.prototype.buildAttrPairStr = function(attrName, val2) {
      val2 = this.options.attributeValueProcessor(attrName, "" + val2);
      val2 = this.replaceEntitiesValue(val2);
      if (this.options.suppressBooleanAttributes && val2 === "true") {
        return " " + attrName;
      } else
        return " " + attrName + '="' + val2 + '"';
    };
    function processTextOrObjNode(object, key, level) {
      const result = this.j2x(object, level + 1);
      if (object[this.options.textNodeName] !== void 0 && Object.keys(object).length === 1) {
        return this.buildTextValNode(object[this.options.textNodeName], key, result.attrStr, level);
      } else {
        return this.buildObjectNode(result.val, key, result.attrStr, level);
      }
    }
    Builder.prototype.buildObjectNode = function(val2, key, attrStr, level) {
      if (val2 === "") {
        if (key[0] === "?")
          return this.indentate(level) + "<" + key + attrStr + "?" + this.tagEndChar;
        else {
          return this.indentate(level) + "<" + key + attrStr + this.closeTag(key) + this.tagEndChar;
        }
      } else {
        let tagEndExp = "</" + key + this.tagEndChar;
        let piClosingChar = "";
        if (key[0] === "?") {
          piClosingChar = "?";
          tagEndExp = "";
        }
        if ((attrStr || attrStr === "") && val2.indexOf("<") === -1) {
          return this.indentate(level) + "<" + key + attrStr + piClosingChar + ">" + val2 + tagEndExp;
        } else if (this.options.commentPropName !== false && key === this.options.commentPropName && piClosingChar.length === 0) {
          return this.indentate(level) + `<!--${val2}-->` + this.newLine;
        } else {
          return this.indentate(level) + "<" + key + attrStr + piClosingChar + this.tagEndChar + val2 + this.indentate(level) + tagEndExp;
        }
      }
    };
    Builder.prototype.closeTag = function(key) {
      let closeTag = "";
      if (this.options.unpairedTags.indexOf(key) !== -1) {
        if (!this.options.suppressUnpairedNode)
          closeTag = "/";
      } else if (this.options.suppressEmptyNode) {
        closeTag = "/";
      } else {
        closeTag = `></${key}`;
      }
      return closeTag;
    };
    Builder.prototype.buildTextValNode = function(val2, key, attrStr, level) {
      if (this.options.cdataPropName !== false && key === this.options.cdataPropName) {
        return this.indentate(level) + `<![CDATA[${val2}]]>` + this.newLine;
      } else if (this.options.commentPropName !== false && key === this.options.commentPropName) {
        return this.indentate(level) + `<!--${val2}-->` + this.newLine;
      } else if (key[0] === "?") {
        return this.indentate(level) + "<" + key + attrStr + "?" + this.tagEndChar;
      } else {
        let textValue = this.options.tagValueProcessor(key, val2);
        textValue = this.replaceEntitiesValue(textValue);
        if (textValue === "") {
          return this.indentate(level) + "<" + key + attrStr + this.closeTag(key) + this.tagEndChar;
        } else {
          return this.indentate(level) + "<" + key + attrStr + ">" + textValue + "</" + key + this.tagEndChar;
        }
      }
    };
    Builder.prototype.replaceEntitiesValue = function(textValue) {
      if (textValue && textValue.length > 0 && this.options.processEntities) {
        for (let i = 0; i < this.options.entities.length; i++) {
          const entity = this.options.entities[i];
          textValue = textValue.replace(entity.regex, entity.val);
        }
      }
      return textValue;
    };
    function indentate(level) {
      return this.options.indentBy.repeat(level);
    }
    function isAttribute(name) {
      if (name.startsWith(this.options.attributeNamePrefix) && name !== this.options.textNodeName) {
        return name.substr(this.attrPrefixLen);
      } else {
        return false;
      }
    }
    module2.exports = Builder;
  }
});

// node_modules/fast-xml-parser/src/fxp.js
var require_fxp = __commonJS({
  "node_modules/fast-xml-parser/src/fxp.js"(exports2, module2) {
    "use strict";
    var validator = require_validator();
    var XMLParser2 = require_XMLParser();
    var XMLBuilder = require_json2xml();
    module2.exports = {
      XMLParser: XMLParser2,
      XMLValidator: validator,
      XMLBuilder
    };
  }
});

// node_modules/@aws-sdk/core/dist-es/submodules/protocols/xml/parseXmlBody.js
var import_smithy_client4, import_fast_xml_parser, parseXmlBody, parseXmlErrorBody, loadRestXmlErrorCode;
var init_parseXmlBody = __esm({
  "node_modules/@aws-sdk/core/dist-es/submodules/protocols/xml/parseXmlBody.js"() {
    import_smithy_client4 = __toESM(require_dist_cjs32());
    import_fast_xml_parser = __toESM(require_fxp());
    init_common();
    parseXmlBody = (streamBody, context) => collectBodyString(streamBody, context).then((encoded) => {
      if (encoded.length) {
        const parser = new import_fast_xml_parser.XMLParser({
          attributeNamePrefix: "",
          htmlEntities: true,
          ignoreAttributes: false,
          ignoreDeclaration: true,
          parseTagValue: false,
          trimValues: false,
          tagValueProcessor: (_, val2) => val2.trim() === "" && val2.includes("\n") ? "" : void 0
        });
        parser.addEntity("#xD", "\r");
        parser.addEntity("#10", "\n");
        let parsedObj;
        try {
          parsedObj = parser.parse(encoded, true);
        } catch (e) {
          if (e && typeof e === "object") {
            Object.defineProperty(e, "$responseBodyText", {
              value: encoded
            });
          }
          throw e;
        }
        const textNodeName = "#text";
        const key = Object.keys(parsedObj)[0];
        const parsedObjToReturn = parsedObj[key];
        if (parsedObjToReturn[textNodeName]) {
          parsedObjToReturn[key] = parsedObjToReturn[textNodeName];
          delete parsedObjToReturn[textNodeName];
        }
        return (0, import_smithy_client4.getValueFromTextNode)(parsedObjToReturn);
      }
      return {};
    });
    parseXmlErrorBody = async (errorBody, context) => {
      const value = await parseXmlBody(errorBody, context);
      if (value.Error) {
        value.Error.message = value.Error.message ?? value.Error.Message;
      }
      return value;
    };
    loadRestXmlErrorCode = (output, data) => {
      if (data?.Error?.Code !== void 0) {
        return data.Error.Code;
      }
      if (data?.Code !== void 0) {
        return data.Code;
      }
      if (output.statusCode == 404) {
        return "NotFound";
      }
    };
  }
});

// node_modules/@aws-sdk/core/dist-es/submodules/protocols/index.js
var init_protocols = __esm({
  "node_modules/@aws-sdk/core/dist-es/submodules/protocols/index.js"() {
    init_coercing_serializers();
    init_awsExpectUnion();
    init_parseJsonBody();
    init_parseXmlBody();
  }
});

// node_modules/@aws-sdk/core/dist-es/index.js
var dist_es_exports2 = {};
__export(dist_es_exports2, {
  AWSSDKSigV4Signer: () => AWSSDKSigV4Signer,
  AwsSdkSigV4ASigner: () => AwsSdkSigV4ASigner,
  AwsSdkSigV4Signer: () => AwsSdkSigV4Signer,
  NODE_SIGV4A_CONFIG_OPTIONS: () => NODE_SIGV4A_CONFIG_OPTIONS,
  _toBool: () => _toBool,
  _toNum: () => _toNum,
  _toStr: () => _toStr,
  awsExpectUnion: () => awsExpectUnion,
  emitWarningIfUnsupportedVersion: () => emitWarningIfUnsupportedVersion,
  loadRestJsonErrorCode: () => loadRestJsonErrorCode,
  loadRestXmlErrorCode: () => loadRestXmlErrorCode,
  parseJsonBody: () => parseJsonBody,
  parseJsonErrorBody: () => parseJsonErrorBody,
  parseXmlBody: () => parseXmlBody,
  parseXmlErrorBody: () => parseXmlErrorBody,
  resolveAWSSDKSigV4Config: () => resolveAWSSDKSigV4Config,
  resolveAwsSdkSigV4AConfig: () => resolveAwsSdkSigV4AConfig,
  resolveAwsSdkSigV4Config: () => resolveAwsSdkSigV4Config,
  validateSigningProperties: () => validateSigningProperties
});
var init_dist_es2 = __esm({
  "node_modules/@aws-sdk/core/dist-es/index.js"() {
    init_client();
    init_httpAuthSchemes2();
    init_protocols();
  }
});

// node_modules/@aws-sdk/client-secrets-manager/dist-cjs/auth/httpAuthSchemeProvider.js
var require_httpAuthSchemeProvider = __commonJS({
  "node_modules/@aws-sdk/client-secrets-manager/dist-cjs/auth/httpAuthSchemeProvider.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.resolveHttpAuthSchemeConfig = exports2.defaultSecretsManagerHttpAuthSchemeProvider = exports2.defaultSecretsManagerHttpAuthSchemeParametersProvider = void 0;
    var core_1 = (init_dist_es2(), __toCommonJS(dist_es_exports2));
    var util_middleware_1 = require_dist_cjs10();
    var defaultSecretsManagerHttpAuthSchemeParametersProvider = async (config, context, input) => {
      return {
        operation: (0, util_middleware_1.getSmithyContext)(context).operation,
        region: await (0, util_middleware_1.normalizeProvider)(config.region)() || (() => {
          throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
        })()
      };
    };
    exports2.defaultSecretsManagerHttpAuthSchemeParametersProvider = defaultSecretsManagerHttpAuthSchemeParametersProvider;
    function createAwsAuthSigv4HttpAuthOption(authParameters) {
      return {
        schemeId: "aws.auth#sigv4",
        signingProperties: {
          name: "secretsmanager",
          region: authParameters.region
        },
        propertiesExtractor: (config, context) => ({
          signingProperties: {
            config,
            context
          }
        })
      };
    }
    var defaultSecretsManagerHttpAuthSchemeProvider = (authParameters) => {
      const options = [];
      switch (authParameters.operation) {
        default: {
          options.push(createAwsAuthSigv4HttpAuthOption(authParameters));
        }
      }
      return options;
    };
    exports2.defaultSecretsManagerHttpAuthSchemeProvider = defaultSecretsManagerHttpAuthSchemeProvider;
    var resolveHttpAuthSchemeConfig = (config) => {
      const config_0 = (0, core_1.resolveAwsSdkSigV4Config)(config);
      return {
        ...config_0
      };
    };
    exports2.resolveHttpAuthSchemeConfig = resolveHttpAuthSchemeConfig;
  }
});

// node_modules/tslib/tslib.es6.mjs
var tslib_es6_exports = {};
__export(tslib_es6_exports, {
  __addDisposableResource: () => __addDisposableResource,
  __assign: () => __assign,
  __asyncDelegator: () => __asyncDelegator,
  __asyncGenerator: () => __asyncGenerator,
  __asyncValues: () => __asyncValues,
  __await: () => __await,
  __awaiter: () => __awaiter,
  __classPrivateFieldGet: () => __classPrivateFieldGet,
  __classPrivateFieldIn: () => __classPrivateFieldIn,
  __classPrivateFieldSet: () => __classPrivateFieldSet,
  __createBinding: () => __createBinding,
  __decorate: () => __decorate,
  __disposeResources: () => __disposeResources,
  __esDecorate: () => __esDecorate,
  __exportStar: () => __exportStar,
  __extends: () => __extends,
  __generator: () => __generator,
  __importDefault: () => __importDefault,
  __importStar: () => __importStar,
  __makeTemplateObject: () => __makeTemplateObject,
  __metadata: () => __metadata,
  __param: () => __param,
  __propKey: () => __propKey,
  __read: () => __read,
  __rest: () => __rest,
  __runInitializers: () => __runInitializers,
  __setFunctionName: () => __setFunctionName,
  __spread: () => __spread,
  __spreadArray: () => __spreadArray,
  __spreadArrays: () => __spreadArrays,
  __values: () => __values,
  default: () => tslib_es6_default
});
function __extends(d, b) {
  if (typeof b !== "function" && b !== null)
    throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
  extendStatics(d, b);
  function __() {
    this.constructor = d;
  }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
function __rest(s, e) {
  var t = {};
  for (var p in s)
    if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
      t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
        t[p[i]] = s[p[i]];
    }
  return t;
}
function __decorate(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function __param(paramIndex, decorator) {
  return function(target, key) {
    decorator(target, key, paramIndex);
  };
}
function __esDecorate(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) {
    if (f !== void 0 && typeof f !== "function")
      throw new TypeError("Function expected");
    return f;
  }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _, done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
    var context = {};
    for (var p in contextIn)
      context[p] = p === "access" ? {} : contextIn[p];
    for (var p in contextIn.access)
      context.access[p] = contextIn.access[p];
    context.addInitializer = function(f) {
      if (done)
        throw new TypeError("Cannot add initializers after decoration has completed");
      extraInitializers.push(accept(f || null));
    };
    var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
    if (kind === "accessor") {
      if (result === void 0)
        continue;
      if (result === null || typeof result !== "object")
        throw new TypeError("Object expected");
      if (_ = accept(result.get))
        descriptor.get = _;
      if (_ = accept(result.set))
        descriptor.set = _;
      if (_ = accept(result.init))
        initializers.unshift(_);
    } else if (_ = accept(result)) {
      if (kind === "field")
        initializers.unshift(_);
      else
        descriptor[key] = _;
    }
  }
  if (target)
    Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
}
function __runInitializers(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) {
    value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : void 0;
}
function __propKey(x) {
  return typeof x === "symbol" ? x : "".concat(x);
}
function __setFunctionName(f, name, prefix) {
  if (typeof name === "symbol")
    name = name.description ? "[".concat(name.description, "]") : "";
  return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
}
function __metadata(metadataKey, metadataValue) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
    return Reflect.metadata(metadataKey, metadataValue);
}
function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}
function __generator(thisArg, body) {
  var _ = { label: 0, sent: function() {
    if (t[0] & 1)
      throw t[1];
    return t[1];
  }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
  return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f)
      throw new TypeError("Generator is already executing.");
    while (g && (g = 0, op[0] && (_ = 0)), _)
      try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
          return t;
        if (y = 0, t)
          op = [op[0] & 2, t.value];
        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;
          case 4:
            _.label++;
            return { value: op[1], done: false };
          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;
          case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;
          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }
            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            if (t[2])
              _.ops.pop();
            _.trys.pop();
            continue;
        }
        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
    if (op[0] & 5)
      throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
}
function __exportStar(m, o) {
  for (var p in m)
    if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p))
      __createBinding(o, m, p);
}
function __values(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m)
    return m.call(o);
  if (o && typeof o.length === "number")
    return {
      next: function() {
        if (o && i >= o.length)
          o = void 0;
        return { value: o && o[i++], done: !o };
      }
    };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function __read(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m)
    return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
      ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"]))
        m.call(i);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
}
function __spread() {
  for (var ar = [], i = 0; i < arguments.length; i++)
    ar = ar.concat(__read(arguments[i]));
  return ar;
}
function __spreadArrays() {
  for (var s = 0, i = 0, il = arguments.length; i < il; i++)
    s += arguments[i].length;
  for (var r = Array(s), k = 0, i = 0; i < il; i++)
    for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
      r[k] = a[j];
  return r;
}
function __spreadArray(to, from, pack) {
  if (pack || arguments.length === 2)
    for (var i = 0, l = from.length, ar; i < l; i++) {
      if (ar || !(i in from)) {
        if (!ar)
          ar = Array.prototype.slice.call(from, 0, i);
        ar[i] = from[i];
      }
    }
  return to.concat(ar || Array.prototype.slice.call(from));
}
function __await(v) {
  return this instanceof __await ? (this.v = v, this) : new __await(v);
}
function __asyncGenerator(thisArg, _arguments, generator) {
  if (!Symbol.asyncIterator)
    throw new TypeError("Symbol.asyncIterator is not defined.");
  var g = generator.apply(thisArg, _arguments || []), i, q = [];
  return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function() {
    return this;
  }, i;
  function awaitReturn(f) {
    return function(v) {
      return Promise.resolve(v).then(f, reject);
    };
  }
  function verb(n, f) {
    if (g[n]) {
      i[n] = function(v) {
        return new Promise(function(a, b) {
          q.push([n, v, a, b]) > 1 || resume(n, v);
        });
      };
      if (f)
        i[n] = f(i[n]);
    }
  }
  function resume(n, v) {
    try {
      step(g[n](v));
    } catch (e) {
      settle(q[0][3], e);
    }
  }
  function step(r) {
    r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
  }
  function fulfill(value) {
    resume("next", value);
  }
  function reject(value) {
    resume("throw", value);
  }
  function settle(f, v) {
    if (f(v), q.shift(), q.length)
      resume(q[0][0], q[0][1]);
  }
}
function __asyncDelegator(o) {
  var i, p;
  return i = {}, verb("next"), verb("throw", function(e) {
    throw e;
  }), verb("return"), i[Symbol.iterator] = function() {
    return this;
  }, i;
  function verb(n, f) {
    i[n] = o[n] ? function(v) {
      return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v;
    } : f;
  }
}
function __asyncValues(o) {
  if (!Symbol.asyncIterator)
    throw new TypeError("Symbol.asyncIterator is not defined.");
  var m = o[Symbol.asyncIterator], i;
  return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
    return this;
  }, i);
  function verb(n) {
    i[n] = o[n] && function(v) {
      return new Promise(function(resolve, reject) {
        v = o[n](v), settle(resolve, reject, v.done, v.value);
      });
    };
  }
  function settle(resolve, reject, d, v) {
    Promise.resolve(v).then(function(v2) {
      resolve({ value: v2, done: d });
    }, reject);
  }
}
function __makeTemplateObject(cooked, raw) {
  if (Object.defineProperty) {
    Object.defineProperty(cooked, "raw", { value: raw });
  } else {
    cooked.raw = raw;
  }
  return cooked;
}
function __importStar(mod) {
  if (mod && mod.__esModule)
    return mod;
  var result = {};
  if (mod != null) {
    for (var k in mod)
      if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
        __createBinding(result, mod, k);
  }
  __setModuleDefault(result, mod);
  return result;
}
function __importDefault(mod) {
  return mod && mod.__esModule ? mod : { default: mod };
}
function __classPrivateFieldGet(receiver, state, kind, f) {
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}
function __classPrivateFieldSet(receiver, state, value, kind, f) {
  if (kind === "m")
    throw new TypeError("Private method is not writable");
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
}
function __classPrivateFieldIn(state, receiver) {
  if (receiver === null || typeof receiver !== "object" && typeof receiver !== "function")
    throw new TypeError("Cannot use 'in' operator on non-object");
  return typeof state === "function" ? receiver === state : state.has(receiver);
}
function __addDisposableResource(env, value, async) {
  if (value !== null && value !== void 0) {
    if (typeof value !== "object" && typeof value !== "function")
      throw new TypeError("Object expected.");
    var dispose, inner;
    if (async) {
      if (!Symbol.asyncDispose)
        throw new TypeError("Symbol.asyncDispose is not defined.");
      dispose = value[Symbol.asyncDispose];
    }
    if (dispose === void 0) {
      if (!Symbol.dispose)
        throw new TypeError("Symbol.dispose is not defined.");
      dispose = value[Symbol.dispose];
      if (async)
        inner = dispose;
    }
    if (typeof dispose !== "function")
      throw new TypeError("Object not disposable.");
    if (inner)
      dispose = function() {
        try {
          inner.call(this);
        } catch (e) {
          return Promise.reject(e);
        }
      };
    env.stack.push({ value, dispose, async });
  } else if (async) {
    env.stack.push({ async: true });
  }
  return value;
}
function __disposeResources(env) {
  function fail(e) {
    env.error = env.hasError ? new _SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
    env.hasError = true;
  }
  var r, s = 0;
  function next() {
    while (r = env.stack.pop()) {
      try {
        if (!r.async && s === 1)
          return s = 0, env.stack.push(r), Promise.resolve().then(next);
        if (r.dispose) {
          var result = r.dispose.call(r.value);
          if (r.async)
            return s |= 2, Promise.resolve(result).then(next, function(e) {
              fail(e);
              return next();
            });
        } else
          s |= 1;
      } catch (e) {
        fail(e);
      }
    }
    if (s === 1)
      return env.hasError ? Promise.reject(env.error) : Promise.resolve();
    if (env.hasError)
      throw env.error;
  }
  return next();
}
var extendStatics, __assign, __createBinding, __setModuleDefault, _SuppressedError, tslib_es6_default;
var init_tslib_es6 = __esm({
  "node_modules/tslib/tslib.es6.mjs"() {
    extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    __assign = function() {
      __assign = Object.assign || function __assign2(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p))
              t[p] = s[p];
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    __createBinding = Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    };
    __setModuleDefault = Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    };
    _SuppressedError = typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
      var e = new Error(message);
      return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };
    tslib_es6_default = {
      __extends,
      __assign,
      __rest,
      __decorate,
      __param,
      __metadata,
      __awaiter,
      __generator,
      __createBinding,
      __exportStar,
      __values,
      __read,
      __spread,
      __spreadArrays,
      __spreadArray,
      __await,
      __asyncGenerator,
      __asyncDelegator,
      __asyncValues,
      __makeTemplateObject,
      __importStar,
      __importDefault,
      __classPrivateFieldGet,
      __classPrivateFieldSet,
      __classPrivateFieldIn,
      __addDisposableResource,
      __disposeResources
    };
  }
});

// node_modules/@aws-sdk/client-secrets-manager/package.json
var require_package = __commonJS({
  "node_modules/@aws-sdk/client-secrets-manager/package.json"(exports2, module2) {
    module2.exports = {
      name: "@aws-sdk/client-secrets-manager",
      description: "AWS SDK for JavaScript Secrets Manager Client for Node.js, Browser and React Native",
      version: "3.645.0",
      scripts: {
        build: "concurrently 'yarn:build:cjs' 'yarn:build:es' 'yarn:build:types'",
        "build:cjs": "node ../../scripts/compilation/inline client-secrets-manager",
        "build:es": "tsc -p tsconfig.es.json",
        "build:include:deps": "lerna run --scope $npm_package_name --include-dependencies build",
        "build:types": "tsc -p tsconfig.types.json",
        "build:types:downlevel": "downlevel-dts dist-types dist-types/ts3.4",
        clean: "rimraf ./dist-* && rimraf *.tsbuildinfo",
        "extract:docs": "api-extractor run --local",
        "generate:client": "node ../../scripts/generate-clients/single-service --solo secrets-manager"
      },
      main: "./dist-cjs/index.js",
      types: "./dist-types/index.d.ts",
      module: "./dist-es/index.js",
      sideEffects: false,
      dependencies: {
        "@aws-crypto/sha256-browser": "5.2.0",
        "@aws-crypto/sha256-js": "5.2.0",
        "@aws-sdk/client-sso-oidc": "3.645.0",
        "@aws-sdk/client-sts": "3.645.0",
        "@aws-sdk/core": "3.635.0",
        "@aws-sdk/credential-provider-node": "3.645.0",
        "@aws-sdk/middleware-host-header": "3.620.0",
        "@aws-sdk/middleware-logger": "3.609.0",
        "@aws-sdk/middleware-recursion-detection": "3.620.0",
        "@aws-sdk/middleware-user-agent": "3.645.0",
        "@aws-sdk/region-config-resolver": "3.614.0",
        "@aws-sdk/types": "3.609.0",
        "@aws-sdk/util-endpoints": "3.645.0",
        "@aws-sdk/util-user-agent-browser": "3.609.0",
        "@aws-sdk/util-user-agent-node": "3.614.0",
        "@smithy/config-resolver": "^3.0.5",
        "@smithy/core": "^2.4.0",
        "@smithy/fetch-http-handler": "^3.2.4",
        "@smithy/hash-node": "^3.0.3",
        "@smithy/invalid-dependency": "^3.0.3",
        "@smithy/middleware-content-length": "^3.0.5",
        "@smithy/middleware-endpoint": "^3.1.0",
        "@smithy/middleware-retry": "^3.0.15",
        "@smithy/middleware-serde": "^3.0.3",
        "@smithy/middleware-stack": "^3.0.3",
        "@smithy/node-config-provider": "^3.1.4",
        "@smithy/node-http-handler": "^3.1.4",
        "@smithy/protocol-http": "^4.1.0",
        "@smithy/smithy-client": "^3.2.0",
        "@smithy/types": "^3.3.0",
        "@smithy/url-parser": "^3.0.3",
        "@smithy/util-base64": "^3.0.0",
        "@smithy/util-body-length-browser": "^3.0.0",
        "@smithy/util-body-length-node": "^3.0.0",
        "@smithy/util-defaults-mode-browser": "^3.0.15",
        "@smithy/util-defaults-mode-node": "^3.0.15",
        "@smithy/util-endpoints": "^2.0.5",
        "@smithy/util-middleware": "^3.0.3",
        "@smithy/util-retry": "^3.0.3",
        "@smithy/util-utf8": "^3.0.0",
        tslib: "^2.6.2",
        uuid: "^9.0.1"
      },
      devDependencies: {
        "@tsconfig/node16": "16.1.3",
        "@types/node": "^16.18.96",
        "@types/uuid": "^9.0.4",
        concurrently: "7.0.0",
        "downlevel-dts": "0.10.1",
        rimraf: "3.0.2",
        typescript: "~4.9.5"
      },
      engines: {
        node: ">=16.0.0"
      },
      typesVersions: {
        "<4.0": {
          "dist-types/*": [
            "dist-types/ts3.4/*"
          ]
        }
      },
      files: [
        "dist-*/**"
      ],
      author: {
        name: "AWS SDK for JavaScript Team",
        url: "https://aws.amazon.com/javascript/"
      },
      license: "Apache-2.0",
      browser: {
        "./dist-es/runtimeConfig": "./dist-es/runtimeConfig.browser"
      },
      "react-native": {
        "./dist-es/runtimeConfig": "./dist-es/runtimeConfig.native"
      },
      homepage: "https://github.com/aws/aws-sdk-js-v3/tree/main/clients/client-secrets-manager",
      repository: {
        type: "git",
        url: "https://github.com/aws/aws-sdk-js-v3.git",
        directory: "clients/client-secrets-manager"
      }
    };
  }
});

// node_modules/@aws-sdk/credential-provider-env/dist-cjs/index.js
var require_dist_cjs36 = __commonJS({
  "node_modules/@aws-sdk/credential-provider-env/dist-cjs/index.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      ENV_ACCOUNT_ID: () => ENV_ACCOUNT_ID,
      ENV_CREDENTIAL_SCOPE: () => ENV_CREDENTIAL_SCOPE,
      ENV_EXPIRATION: () => ENV_EXPIRATION,
      ENV_KEY: () => ENV_KEY,
      ENV_SECRET: () => ENV_SECRET,
      ENV_SESSION: () => ENV_SESSION,
      fromEnv: () => fromEnv
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_property_provider2 = require_dist_cjs12();
    var ENV_KEY = "AWS_ACCESS_KEY_ID";
    var ENV_SECRET = "AWS_SECRET_ACCESS_KEY";
    var ENV_SESSION = "AWS_SESSION_TOKEN";
    var ENV_EXPIRATION = "AWS_CREDENTIAL_EXPIRATION";
    var ENV_CREDENTIAL_SCOPE = "AWS_CREDENTIAL_SCOPE";
    var ENV_ACCOUNT_ID = "AWS_ACCOUNT_ID";
    var fromEnv = /* @__PURE__ */ __name((init) => async () => {
      var _a;
      (_a = init == null ? void 0 : init.logger) == null ? void 0 : _a.debug("@aws-sdk/credential-provider-env - fromEnv");
      const accessKeyId = process.env[ENV_KEY];
      const secretAccessKey = process.env[ENV_SECRET];
      const sessionToken = process.env[ENV_SESSION];
      const expiry = process.env[ENV_EXPIRATION];
      const credentialScope = process.env[ENV_CREDENTIAL_SCOPE];
      const accountId = process.env[ENV_ACCOUNT_ID];
      if (accessKeyId && secretAccessKey) {
        return {
          accessKeyId,
          secretAccessKey,
          ...sessionToken && { sessionToken },
          ...expiry && { expiration: new Date(expiry) },
          ...credentialScope && { credentialScope },
          ...accountId && { accountId }
        };
      }
      throw new import_property_provider2.CredentialsProviderError("Unable to find environment variable credentials.", { logger: init == null ? void 0 : init.logger });
    }, "fromEnv");
  }
});

// node_modules/@smithy/credential-provider-imds/dist-cjs/index.js
var require_dist_cjs37 = __commonJS({
  "node_modules/@smithy/credential-provider-imds/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      DEFAULT_MAX_RETRIES: () => DEFAULT_MAX_RETRIES,
      DEFAULT_TIMEOUT: () => DEFAULT_TIMEOUT,
      ENV_CMDS_AUTH_TOKEN: () => ENV_CMDS_AUTH_TOKEN,
      ENV_CMDS_FULL_URI: () => ENV_CMDS_FULL_URI,
      ENV_CMDS_RELATIVE_URI: () => ENV_CMDS_RELATIVE_URI,
      Endpoint: () => Endpoint,
      fromContainerMetadata: () => fromContainerMetadata,
      fromInstanceMetadata: () => fromInstanceMetadata,
      getInstanceMetadataEndpoint: () => getInstanceMetadataEndpoint,
      httpRequest: () => httpRequest,
      providerConfigFromInit: () => providerConfigFromInit
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_url = require("url");
    var import_property_provider2 = require_dist_cjs12();
    var import_buffer = require("buffer");
    var import_http = require("http");
    function httpRequest(options) {
      return new Promise((resolve, reject) => {
        var _a;
        const req = (0, import_http.request)({
          method: "GET",
          ...options,
          // Node.js http module doesn't accept hostname with square brackets
          // Refs: https://github.com/nodejs/node/issues/39738
          hostname: (_a = options.hostname) == null ? void 0 : _a.replace(/^\[(.+)\]$/, "$1")
        });
        req.on("error", (err) => {
          reject(Object.assign(new import_property_provider2.ProviderError("Unable to connect to instance metadata service"), err));
          req.destroy();
        });
        req.on("timeout", () => {
          reject(new import_property_provider2.ProviderError("TimeoutError from instance metadata service"));
          req.destroy();
        });
        req.on("response", (res) => {
          const { statusCode = 400 } = res;
          if (statusCode < 200 || 300 <= statusCode) {
            reject(
              Object.assign(new import_property_provider2.ProviderError("Error response received from instance metadata service"), { statusCode })
            );
            req.destroy();
          }
          const chunks = [];
          res.on("data", (chunk) => {
            chunks.push(chunk);
          });
          res.on("end", () => {
            resolve(import_buffer.Buffer.concat(chunks));
            req.destroy();
          });
        });
        req.end();
      });
    }
    __name(httpRequest, "httpRequest");
    var isImdsCredentials = /* @__PURE__ */ __name((arg) => Boolean(arg) && typeof arg === "object" && typeof arg.AccessKeyId === "string" && typeof arg.SecretAccessKey === "string" && typeof arg.Token === "string" && typeof arg.Expiration === "string", "isImdsCredentials");
    var fromImdsCredentials = /* @__PURE__ */ __name((creds) => ({
      accessKeyId: creds.AccessKeyId,
      secretAccessKey: creds.SecretAccessKey,
      sessionToken: creds.Token,
      expiration: new Date(creds.Expiration),
      ...creds.AccountId && { accountId: creds.AccountId }
    }), "fromImdsCredentials");
    var DEFAULT_TIMEOUT = 1e3;
    var DEFAULT_MAX_RETRIES = 0;
    var providerConfigFromInit = /* @__PURE__ */ __name(({
      maxRetries = DEFAULT_MAX_RETRIES,
      timeout = DEFAULT_TIMEOUT
    }) => ({ maxRetries, timeout }), "providerConfigFromInit");
    var retry = /* @__PURE__ */ __name((toRetry, maxRetries) => {
      let promise = toRetry();
      for (let i = 0; i < maxRetries; i++) {
        promise = promise.catch(toRetry);
      }
      return promise;
    }, "retry");
    var ENV_CMDS_FULL_URI = "AWS_CONTAINER_CREDENTIALS_FULL_URI";
    var ENV_CMDS_RELATIVE_URI = "AWS_CONTAINER_CREDENTIALS_RELATIVE_URI";
    var ENV_CMDS_AUTH_TOKEN = "AWS_CONTAINER_AUTHORIZATION_TOKEN";
    var fromContainerMetadata = /* @__PURE__ */ __name((init = {}) => {
      const { timeout, maxRetries } = providerConfigFromInit(init);
      return () => retry(async () => {
        const requestOptions = await getCmdsUri({ logger: init.logger });
        const credsResponse = JSON.parse(await requestFromEcsImds(timeout, requestOptions));
        if (!isImdsCredentials(credsResponse)) {
          throw new import_property_provider2.CredentialsProviderError("Invalid response received from instance metadata service.", {
            logger: init.logger
          });
        }
        return fromImdsCredentials(credsResponse);
      }, maxRetries);
    }, "fromContainerMetadata");
    var requestFromEcsImds = /* @__PURE__ */ __name(async (timeout, options) => {
      if (process.env[ENV_CMDS_AUTH_TOKEN]) {
        options.headers = {
          ...options.headers,
          Authorization: process.env[ENV_CMDS_AUTH_TOKEN]
        };
      }
      const buffer = await httpRequest({
        ...options,
        timeout
      });
      return buffer.toString();
    }, "requestFromEcsImds");
    var CMDS_IP = "169.254.170.2";
    var GREENGRASS_HOSTS = {
      localhost: true,
      "127.0.0.1": true
    };
    var GREENGRASS_PROTOCOLS = {
      "http:": true,
      "https:": true
    };
    var getCmdsUri = /* @__PURE__ */ __name(async ({ logger }) => {
      if (process.env[ENV_CMDS_RELATIVE_URI]) {
        return {
          hostname: CMDS_IP,
          path: process.env[ENV_CMDS_RELATIVE_URI]
        };
      }
      if (process.env[ENV_CMDS_FULL_URI]) {
        const parsed = (0, import_url.parse)(process.env[ENV_CMDS_FULL_URI]);
        if (!parsed.hostname || !(parsed.hostname in GREENGRASS_HOSTS)) {
          throw new import_property_provider2.CredentialsProviderError(`${parsed.hostname} is not a valid container metadata service hostname`, {
            tryNextLink: false,
            logger
          });
        }
        if (!parsed.protocol || !(parsed.protocol in GREENGRASS_PROTOCOLS)) {
          throw new import_property_provider2.CredentialsProviderError(`${parsed.protocol} is not a valid container metadata service protocol`, {
            tryNextLink: false,
            logger
          });
        }
        return {
          ...parsed,
          port: parsed.port ? parseInt(parsed.port, 10) : void 0
        };
      }
      throw new import_property_provider2.CredentialsProviderError(
        `The container metadata credential provider cannot be used unless the ${ENV_CMDS_RELATIVE_URI} or ${ENV_CMDS_FULL_URI} environment variable is set`,
        {
          tryNextLink: false,
          logger
        }
      );
    }, "getCmdsUri");
    var _InstanceMetadataV1FallbackError = class _InstanceMetadataV1FallbackError2 extends import_property_provider2.CredentialsProviderError {
      constructor(message, tryNextLink = true) {
        super(message, tryNextLink);
        this.tryNextLink = tryNextLink;
        this.name = "InstanceMetadataV1FallbackError";
        Object.setPrototypeOf(this, _InstanceMetadataV1FallbackError2.prototype);
      }
    };
    __name(_InstanceMetadataV1FallbackError, "InstanceMetadataV1FallbackError");
    var InstanceMetadataV1FallbackError = _InstanceMetadataV1FallbackError;
    var import_node_config_provider = require_dist_cjs14();
    var import_url_parser = require_dist_cjs16();
    var Endpoint = /* @__PURE__ */ ((Endpoint2) => {
      Endpoint2["IPv4"] = "http://169.254.169.254";
      Endpoint2["IPv6"] = "http://[fd00:ec2::254]";
      return Endpoint2;
    })(Endpoint || {});
    var ENV_ENDPOINT_NAME = "AWS_EC2_METADATA_SERVICE_ENDPOINT";
    var CONFIG_ENDPOINT_NAME = "ec2_metadata_service_endpoint";
    var ENDPOINT_CONFIG_OPTIONS = {
      environmentVariableSelector: (env) => env[ENV_ENDPOINT_NAME],
      configFileSelector: (profile) => profile[CONFIG_ENDPOINT_NAME],
      default: void 0
    };
    var EndpointMode = /* @__PURE__ */ ((EndpointMode2) => {
      EndpointMode2["IPv4"] = "IPv4";
      EndpointMode2["IPv6"] = "IPv6";
      return EndpointMode2;
    })(EndpointMode || {});
    var ENV_ENDPOINT_MODE_NAME = "AWS_EC2_METADATA_SERVICE_ENDPOINT_MODE";
    var CONFIG_ENDPOINT_MODE_NAME = "ec2_metadata_service_endpoint_mode";
    var ENDPOINT_MODE_CONFIG_OPTIONS = {
      environmentVariableSelector: (env) => env[ENV_ENDPOINT_MODE_NAME],
      configFileSelector: (profile) => profile[CONFIG_ENDPOINT_MODE_NAME],
      default: "IPv4"
      /* IPv4 */
    };
    var getInstanceMetadataEndpoint = /* @__PURE__ */ __name(async () => (0, import_url_parser.parseUrl)(await getFromEndpointConfig() || await getFromEndpointModeConfig()), "getInstanceMetadataEndpoint");
    var getFromEndpointConfig = /* @__PURE__ */ __name(async () => (0, import_node_config_provider.loadConfig)(ENDPOINT_CONFIG_OPTIONS)(), "getFromEndpointConfig");
    var getFromEndpointModeConfig = /* @__PURE__ */ __name(async () => {
      const endpointMode = await (0, import_node_config_provider.loadConfig)(ENDPOINT_MODE_CONFIG_OPTIONS)();
      switch (endpointMode) {
        case "IPv4":
          return "http://169.254.169.254";
        case "IPv6":
          return "http://[fd00:ec2::254]";
        default:
          throw new Error(`Unsupported endpoint mode: ${endpointMode}. Select from ${Object.values(EndpointMode)}`);
      }
    }, "getFromEndpointModeConfig");
    var STATIC_STABILITY_REFRESH_INTERVAL_SECONDS = 5 * 60;
    var STATIC_STABILITY_REFRESH_INTERVAL_JITTER_WINDOW_SECONDS = 5 * 60;
    var STATIC_STABILITY_DOC_URL = "https://docs.aws.amazon.com/sdkref/latest/guide/feature-static-credentials.html";
    var getExtendedInstanceMetadataCredentials = /* @__PURE__ */ __name((credentials, logger) => {
      const refreshInterval = STATIC_STABILITY_REFRESH_INTERVAL_SECONDS + Math.floor(Math.random() * STATIC_STABILITY_REFRESH_INTERVAL_JITTER_WINDOW_SECONDS);
      const newExpiration = new Date(Date.now() + refreshInterval * 1e3);
      logger.warn(
        `Attempting credential expiration extension due to a credential service availability issue. A refresh of these credentials will be attempted after ${new Date(newExpiration)}.
For more information, please visit: ` + STATIC_STABILITY_DOC_URL
      );
      const originalExpiration = credentials.originalExpiration ?? credentials.expiration;
      return {
        ...credentials,
        ...originalExpiration ? { originalExpiration } : {},
        expiration: newExpiration
      };
    }, "getExtendedInstanceMetadataCredentials");
    var staticStabilityProvider = /* @__PURE__ */ __name((provider, options = {}) => {
      const logger = (options == null ? void 0 : options.logger) || console;
      let pastCredentials;
      return async () => {
        let credentials;
        try {
          credentials = await provider();
          if (credentials.expiration && credentials.expiration.getTime() < Date.now()) {
            credentials = getExtendedInstanceMetadataCredentials(credentials, logger);
          }
        } catch (e) {
          if (pastCredentials) {
            logger.warn("Credential renew failed: ", e);
            credentials = getExtendedInstanceMetadataCredentials(pastCredentials, logger);
          } else {
            throw e;
          }
        }
        pastCredentials = credentials;
        return credentials;
      };
    }, "staticStabilityProvider");
    var IMDS_PATH = "/latest/meta-data/iam/security-credentials/";
    var IMDS_TOKEN_PATH = "/latest/api/token";
    var AWS_EC2_METADATA_V1_DISABLED = "AWS_EC2_METADATA_V1_DISABLED";
    var PROFILE_AWS_EC2_METADATA_V1_DISABLED = "ec2_metadata_v1_disabled";
    var X_AWS_EC2_METADATA_TOKEN = "x-aws-ec2-metadata-token";
    var fromInstanceMetadata = /* @__PURE__ */ __name((init = {}) => staticStabilityProvider(getInstanceMetadataProvider(init), { logger: init.logger }), "fromInstanceMetadata");
    var getInstanceMetadataProvider = /* @__PURE__ */ __name((init = {}) => {
      let disableFetchToken = false;
      const { logger, profile } = init;
      const { timeout, maxRetries } = providerConfigFromInit(init);
      const getCredentials = /* @__PURE__ */ __name(async (maxRetries2, options) => {
        var _a;
        const isImdsV1Fallback = disableFetchToken || ((_a = options.headers) == null ? void 0 : _a[X_AWS_EC2_METADATA_TOKEN]) == null;
        if (isImdsV1Fallback) {
          let fallbackBlockedFromProfile = false;
          let fallbackBlockedFromProcessEnv = false;
          const configValue = await (0, import_node_config_provider.loadConfig)(
            {
              environmentVariableSelector: (env) => {
                const envValue = env[AWS_EC2_METADATA_V1_DISABLED];
                fallbackBlockedFromProcessEnv = !!envValue && envValue !== "false";
                if (envValue === void 0) {
                  throw new import_property_provider2.CredentialsProviderError(
                    `${AWS_EC2_METADATA_V1_DISABLED} not set in env, checking config file next.`,
                    { logger: init.logger }
                  );
                }
                return fallbackBlockedFromProcessEnv;
              },
              configFileSelector: (profile2) => {
                const profileValue = profile2[PROFILE_AWS_EC2_METADATA_V1_DISABLED];
                fallbackBlockedFromProfile = !!profileValue && profileValue !== "false";
                return fallbackBlockedFromProfile;
              },
              default: false
            },
            {
              profile
            }
          )();
          if (init.ec2MetadataV1Disabled || configValue) {
            const causes = [];
            if (init.ec2MetadataV1Disabled)
              causes.push("credential provider initialization (runtime option ec2MetadataV1Disabled)");
            if (fallbackBlockedFromProfile)
              causes.push(`config file profile (${PROFILE_AWS_EC2_METADATA_V1_DISABLED})`);
            if (fallbackBlockedFromProcessEnv)
              causes.push(`process environment variable (${AWS_EC2_METADATA_V1_DISABLED})`);
            throw new InstanceMetadataV1FallbackError(
              `AWS EC2 Metadata v1 fallback has been blocked by AWS SDK configuration in the following: [${causes.join(
                ", "
              )}].`
            );
          }
        }
        const imdsProfile = (await retry(async () => {
          let profile2;
          try {
            profile2 = await getProfile(options);
          } catch (err) {
            if (err.statusCode === 401) {
              disableFetchToken = false;
            }
            throw err;
          }
          return profile2;
        }, maxRetries2)).trim();
        return retry(async () => {
          let creds;
          try {
            creds = await getCredentialsFromProfile(imdsProfile, options, init);
          } catch (err) {
            if (err.statusCode === 401) {
              disableFetchToken = false;
            }
            throw err;
          }
          return creds;
        }, maxRetries2);
      }, "getCredentials");
      return async () => {
        const endpoint = await getInstanceMetadataEndpoint();
        if (disableFetchToken) {
          logger == null ? void 0 : logger.debug("AWS SDK Instance Metadata", "using v1 fallback (no token fetch)");
          return getCredentials(maxRetries, { ...endpoint, timeout });
        } else {
          let token;
          try {
            token = (await getMetadataToken({ ...endpoint, timeout })).toString();
          } catch (error) {
            if ((error == null ? void 0 : error.statusCode) === 400) {
              throw Object.assign(error, {
                message: "EC2 Metadata token request returned error"
              });
            } else if (error.message === "TimeoutError" || [403, 404, 405].includes(error.statusCode)) {
              disableFetchToken = true;
            }
            logger == null ? void 0 : logger.debug("AWS SDK Instance Metadata", "using v1 fallback (initial)");
            return getCredentials(maxRetries, { ...endpoint, timeout });
          }
          return getCredentials(maxRetries, {
            ...endpoint,
            headers: {
              [X_AWS_EC2_METADATA_TOKEN]: token
            },
            timeout
          });
        }
      };
    }, "getInstanceMetadataProvider");
    var getMetadataToken = /* @__PURE__ */ __name(async (options) => httpRequest({
      ...options,
      path: IMDS_TOKEN_PATH,
      method: "PUT",
      headers: {
        "x-aws-ec2-metadata-token-ttl-seconds": "21600"
      }
    }), "getMetadataToken");
    var getProfile = /* @__PURE__ */ __name(async (options) => (await httpRequest({ ...options, path: IMDS_PATH })).toString(), "getProfile");
    var getCredentialsFromProfile = /* @__PURE__ */ __name(async (profile, options, init) => {
      const credentialsResponse = JSON.parse(
        (await httpRequest({
          ...options,
          path: IMDS_PATH + profile
        })).toString()
      );
      if (!isImdsCredentials(credentialsResponse)) {
        throw new import_property_provider2.CredentialsProviderError("Invalid response received from instance metadata service.", {
          logger: init.logger
        });
      }
      return fromImdsCredentials(credentialsResponse);
    }, "getCredentialsFromProfile");
  }
});

// node_modules/@aws-sdk/credential-provider-http/dist-cjs/fromHttp/checkUrl.js
var require_checkUrl = __commonJS({
  "node_modules/@aws-sdk/credential-provider-http/dist-cjs/fromHttp/checkUrl.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.checkUrl = void 0;
    var property_provider_1 = require_dist_cjs12();
    var ECS_CONTAINER_HOST = "169.254.170.2";
    var EKS_CONTAINER_HOST_IPv4 = "169.254.170.23";
    var EKS_CONTAINER_HOST_IPv6 = "[fd00:ec2::23]";
    var checkUrl = (url, logger) => {
      if (url.protocol === "https:") {
        return;
      }
      if (url.hostname === ECS_CONTAINER_HOST || url.hostname === EKS_CONTAINER_HOST_IPv4 || url.hostname === EKS_CONTAINER_HOST_IPv6) {
        return;
      }
      if (url.hostname.includes("[")) {
        if (url.hostname === "[::1]" || url.hostname === "[0000:0000:0000:0000:0000:0000:0000:0001]") {
          return;
        }
      } else {
        if (url.hostname === "localhost") {
          return;
        }
        const ipComponents = url.hostname.split(".");
        const inRange = (component) => {
          const num = parseInt(component, 10);
          return 0 <= num && num <= 255;
        };
        if (ipComponents[0] === "127" && inRange(ipComponents[1]) && inRange(ipComponents[2]) && inRange(ipComponents[3]) && ipComponents.length === 4) {
          return;
        }
      }
      throw new property_provider_1.CredentialsProviderError(`URL not accepted. It must either be HTTPS or match one of the following:
  - loopback CIDR 127.0.0.0/8 or [::1/128]
  - ECS container host 169.254.170.2
  - EKS container host 169.254.170.23 or [fd00:ec2::23]`, { logger });
    };
    exports2.checkUrl = checkUrl;
  }
});

// node_modules/@aws-sdk/credential-provider-http/dist-cjs/fromHttp/requestHelpers.js
var require_requestHelpers = __commonJS({
  "node_modules/@aws-sdk/credential-provider-http/dist-cjs/fromHttp/requestHelpers.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getCredentials = exports2.createGetRequest = void 0;
    var property_provider_1 = require_dist_cjs12();
    var protocol_http_1 = require_dist_cjs2();
    var smithy_client_1 = require_dist_cjs32();
    var util_stream_1 = require_dist_cjs31();
    function createGetRequest(url) {
      return new protocol_http_1.HttpRequest({
        protocol: url.protocol,
        hostname: url.hostname,
        port: Number(url.port),
        path: url.pathname,
        query: Array.from(url.searchParams.entries()).reduce((acc, [k, v]) => {
          acc[k] = v;
          return acc;
        }, {}),
        fragment: url.hash
      });
    }
    exports2.createGetRequest = createGetRequest;
    async function getCredentials(response, logger) {
      const stream = (0, util_stream_1.sdkStreamMixin)(response.body);
      const str = await stream.transformToString();
      if (response.statusCode === 200) {
        const parsed = JSON.parse(str);
        if (typeof parsed.AccessKeyId !== "string" || typeof parsed.SecretAccessKey !== "string" || typeof parsed.Token !== "string" || typeof parsed.Expiration !== "string") {
          throw new property_provider_1.CredentialsProviderError("HTTP credential provider response not of the required format, an object matching: { AccessKeyId: string, SecretAccessKey: string, Token: string, Expiration: string(rfc3339) }", { logger });
        }
        return {
          accessKeyId: parsed.AccessKeyId,
          secretAccessKey: parsed.SecretAccessKey,
          sessionToken: parsed.Token,
          expiration: (0, smithy_client_1.parseRfc3339DateTime)(parsed.Expiration)
        };
      }
      if (response.statusCode >= 400 && response.statusCode < 500) {
        let parsedBody = {};
        try {
          parsedBody = JSON.parse(str);
        } catch (e) {
        }
        throw Object.assign(new property_provider_1.CredentialsProviderError(`Server responded with status: ${response.statusCode}`, { logger }), {
          Code: parsedBody.Code,
          Message: parsedBody.Message
        });
      }
      throw new property_provider_1.CredentialsProviderError(`Server responded with status: ${response.statusCode}`, { logger });
    }
    exports2.getCredentials = getCredentials;
  }
});

// node_modules/@aws-sdk/credential-provider-http/dist-cjs/fromHttp/retry-wrapper.js
var require_retry_wrapper = __commonJS({
  "node_modules/@aws-sdk/credential-provider-http/dist-cjs/fromHttp/retry-wrapper.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.retryWrapper = void 0;
    var retryWrapper = (toRetry, maxRetries, delayMs) => {
      return async () => {
        for (let i = 0; i < maxRetries; ++i) {
          try {
            return await toRetry();
          } catch (e) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }
        return await toRetry();
      };
    };
    exports2.retryWrapper = retryWrapper;
  }
});

// node_modules/@aws-sdk/credential-provider-http/dist-cjs/fromHttp/fromHttp.js
var require_fromHttp = __commonJS({
  "node_modules/@aws-sdk/credential-provider-http/dist-cjs/fromHttp/fromHttp.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.fromHttp = void 0;
    var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
    var node_http_handler_1 = require_dist_cjs28();
    var property_provider_1 = require_dist_cjs12();
    var promises_1 = tslib_1.__importDefault(require("fs/promises"));
    var checkUrl_1 = require_checkUrl();
    var requestHelpers_1 = require_requestHelpers();
    var retry_wrapper_1 = require_retry_wrapper();
    var AWS_CONTAINER_CREDENTIALS_RELATIVE_URI = "AWS_CONTAINER_CREDENTIALS_RELATIVE_URI";
    var DEFAULT_LINK_LOCAL_HOST = "http://169.254.170.2";
    var AWS_CONTAINER_CREDENTIALS_FULL_URI = "AWS_CONTAINER_CREDENTIALS_FULL_URI";
    var AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE = "AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE";
    var AWS_CONTAINER_AUTHORIZATION_TOKEN = "AWS_CONTAINER_AUTHORIZATION_TOKEN";
    var fromHttp = (options = {}) => {
      options.logger?.debug("@aws-sdk/credential-provider-http - fromHttp");
      let host;
      const relative = options.awsContainerCredentialsRelativeUri ?? process.env[AWS_CONTAINER_CREDENTIALS_RELATIVE_URI];
      const full = options.awsContainerCredentialsFullUri ?? process.env[AWS_CONTAINER_CREDENTIALS_FULL_URI];
      const token = options.awsContainerAuthorizationToken ?? process.env[AWS_CONTAINER_AUTHORIZATION_TOKEN];
      const tokenFile = options.awsContainerAuthorizationTokenFile ?? process.env[AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE];
      const warn = options.logger?.constructor?.name === "NoOpLogger" || !options.logger ? console.warn : options.logger.warn;
      if (relative && full) {
        warn("@aws-sdk/credential-provider-http: you have set both awsContainerCredentialsRelativeUri and awsContainerCredentialsFullUri.");
        warn("awsContainerCredentialsFullUri will take precedence.");
      }
      if (token && tokenFile) {
        warn("@aws-sdk/credential-provider-http: you have set both awsContainerAuthorizationToken and awsContainerAuthorizationTokenFile.");
        warn("awsContainerAuthorizationToken will take precedence.");
      }
      if (full) {
        host = full;
      } else if (relative) {
        host = `${DEFAULT_LINK_LOCAL_HOST}${relative}`;
      } else {
        throw new property_provider_1.CredentialsProviderError(`No HTTP credential provider host provided.
Set AWS_CONTAINER_CREDENTIALS_FULL_URI or AWS_CONTAINER_CREDENTIALS_RELATIVE_URI.`, { logger: options.logger });
      }
      const url = new URL(host);
      (0, checkUrl_1.checkUrl)(url, options.logger);
      const requestHandler = new node_http_handler_1.NodeHttpHandler({
        requestTimeout: options.timeout ?? 1e3,
        connectionTimeout: options.timeout ?? 1e3
      });
      return (0, retry_wrapper_1.retryWrapper)(async () => {
        const request = (0, requestHelpers_1.createGetRequest)(url);
        if (token) {
          request.headers.Authorization = token;
        } else if (tokenFile) {
          request.headers.Authorization = (await promises_1.default.readFile(tokenFile)).toString();
        }
        try {
          const result = await requestHandler.handle(request);
          return (0, requestHelpers_1.getCredentials)(result.response);
        } catch (e) {
          throw new property_provider_1.CredentialsProviderError(String(e), { logger: options.logger });
        }
      }, options.maxRetries ?? 3, options.timeout ?? 1e3);
    };
    exports2.fromHttp = fromHttp;
  }
});

// node_modules/@aws-sdk/credential-provider-http/dist-cjs/index.js
var require_dist_cjs38 = __commonJS({
  "node_modules/@aws-sdk/credential-provider-http/dist-cjs/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.fromHttp = void 0;
    var fromHttp_1 = require_fromHttp();
    Object.defineProperty(exports2, "fromHttp", { enumerable: true, get: function() {
      return fromHttp_1.fromHttp;
    } });
  }
});

// node_modules/@aws-sdk/client-sso/dist-cjs/auth/httpAuthSchemeProvider.js
var require_httpAuthSchemeProvider2 = __commonJS({
  "node_modules/@aws-sdk/client-sso/dist-cjs/auth/httpAuthSchemeProvider.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.resolveHttpAuthSchemeConfig = exports2.defaultSSOHttpAuthSchemeProvider = exports2.defaultSSOHttpAuthSchemeParametersProvider = void 0;
    var core_1 = (init_dist_es2(), __toCommonJS(dist_es_exports2));
    var util_middleware_1 = require_dist_cjs10();
    var defaultSSOHttpAuthSchemeParametersProvider = async (config, context, input) => {
      return {
        operation: (0, util_middleware_1.getSmithyContext)(context).operation,
        region: await (0, util_middleware_1.normalizeProvider)(config.region)() || (() => {
          throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
        })()
      };
    };
    exports2.defaultSSOHttpAuthSchemeParametersProvider = defaultSSOHttpAuthSchemeParametersProvider;
    function createAwsAuthSigv4HttpAuthOption(authParameters) {
      return {
        schemeId: "aws.auth#sigv4",
        signingProperties: {
          name: "awsssoportal",
          region: authParameters.region
        },
        propertiesExtractor: (config, context) => ({
          signingProperties: {
            config,
            context
          }
        })
      };
    }
    function createSmithyApiNoAuthHttpAuthOption(authParameters) {
      return {
        schemeId: "smithy.api#noAuth"
      };
    }
    var defaultSSOHttpAuthSchemeProvider = (authParameters) => {
      const options = [];
      switch (authParameters.operation) {
        case "GetRoleCredentials": {
          options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
          break;
        }
        case "ListAccountRoles": {
          options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
          break;
        }
        case "ListAccounts": {
          options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
          break;
        }
        case "Logout": {
          options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
          break;
        }
        default: {
          options.push(createAwsAuthSigv4HttpAuthOption(authParameters));
        }
      }
      return options;
    };
    exports2.defaultSSOHttpAuthSchemeProvider = defaultSSOHttpAuthSchemeProvider;
    var resolveHttpAuthSchemeConfig = (config) => {
      const config_0 = (0, core_1.resolveAwsSdkSigV4Config)(config);
      return {
        ...config_0
      };
    };
    exports2.resolveHttpAuthSchemeConfig = resolveHttpAuthSchemeConfig;
  }
});

// node_modules/@aws-sdk/client-sso/package.json
var require_package2 = __commonJS({
  "node_modules/@aws-sdk/client-sso/package.json"(exports2, module2) {
    module2.exports = {
      name: "@aws-sdk/client-sso",
      description: "AWS SDK for JavaScript Sso Client for Node.js, Browser and React Native",
      version: "3.645.0",
      scripts: {
        build: "concurrently 'yarn:build:cjs' 'yarn:build:es' 'yarn:build:types'",
        "build:cjs": "node ../../scripts/compilation/inline client-sso",
        "build:es": "tsc -p tsconfig.es.json",
        "build:include:deps": "lerna run --scope $npm_package_name --include-dependencies build",
        "build:types": "tsc -p tsconfig.types.json",
        "build:types:downlevel": "downlevel-dts dist-types dist-types/ts3.4",
        clean: "rimraf ./dist-* && rimraf *.tsbuildinfo",
        "extract:docs": "api-extractor run --local",
        "generate:client": "node ../../scripts/generate-clients/single-service --solo sso"
      },
      main: "./dist-cjs/index.js",
      types: "./dist-types/index.d.ts",
      module: "./dist-es/index.js",
      sideEffects: false,
      dependencies: {
        "@aws-crypto/sha256-browser": "5.2.0",
        "@aws-crypto/sha256-js": "5.2.0",
        "@aws-sdk/core": "3.635.0",
        "@aws-sdk/middleware-host-header": "3.620.0",
        "@aws-sdk/middleware-logger": "3.609.0",
        "@aws-sdk/middleware-recursion-detection": "3.620.0",
        "@aws-sdk/middleware-user-agent": "3.645.0",
        "@aws-sdk/region-config-resolver": "3.614.0",
        "@aws-sdk/types": "3.609.0",
        "@aws-sdk/util-endpoints": "3.645.0",
        "@aws-sdk/util-user-agent-browser": "3.609.0",
        "@aws-sdk/util-user-agent-node": "3.614.0",
        "@smithy/config-resolver": "^3.0.5",
        "@smithy/core": "^2.4.0",
        "@smithy/fetch-http-handler": "^3.2.4",
        "@smithy/hash-node": "^3.0.3",
        "@smithy/invalid-dependency": "^3.0.3",
        "@smithy/middleware-content-length": "^3.0.5",
        "@smithy/middleware-endpoint": "^3.1.0",
        "@smithy/middleware-retry": "^3.0.15",
        "@smithy/middleware-serde": "^3.0.3",
        "@smithy/middleware-stack": "^3.0.3",
        "@smithy/node-config-provider": "^3.1.4",
        "@smithy/node-http-handler": "^3.1.4",
        "@smithy/protocol-http": "^4.1.0",
        "@smithy/smithy-client": "^3.2.0",
        "@smithy/types": "^3.3.0",
        "@smithy/url-parser": "^3.0.3",
        "@smithy/util-base64": "^3.0.0",
        "@smithy/util-body-length-browser": "^3.0.0",
        "@smithy/util-body-length-node": "^3.0.0",
        "@smithy/util-defaults-mode-browser": "^3.0.15",
        "@smithy/util-defaults-mode-node": "^3.0.15",
        "@smithy/util-endpoints": "^2.0.5",
        "@smithy/util-middleware": "^3.0.3",
        "@smithy/util-retry": "^3.0.3",
        "@smithy/util-utf8": "^3.0.0",
        tslib: "^2.6.2"
      },
      devDependencies: {
        "@tsconfig/node16": "16.1.3",
        "@types/node": "^16.18.96",
        concurrently: "7.0.0",
        "downlevel-dts": "0.10.1",
        rimraf: "3.0.2",
        typescript: "~4.9.5"
      },
      engines: {
        node: ">=16.0.0"
      },
      typesVersions: {
        "<4.0": {
          "dist-types/*": [
            "dist-types/ts3.4/*"
          ]
        }
      },
      files: [
        "dist-*/**"
      ],
      author: {
        name: "AWS SDK for JavaScript Team",
        url: "https://aws.amazon.com/javascript/"
      },
      license: "Apache-2.0",
      browser: {
        "./dist-es/runtimeConfig": "./dist-es/runtimeConfig.browser"
      },
      "react-native": {
        "./dist-es/runtimeConfig": "./dist-es/runtimeConfig.native"
      },
      homepage: "https://github.com/aws/aws-sdk-js-v3/tree/main/clients/client-sso",
      repository: {
        type: "git",
        url: "https://github.com/aws/aws-sdk-js-v3.git",
        directory: "clients/client-sso"
      }
    };
  }
});

// node_modules/@aws-sdk/util-user-agent-node/dist-cjs/index.js
var require_dist_cjs39 = __commonJS({
  "node_modules/@aws-sdk/util-user-agent-node/dist-cjs/index.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      UA_APP_ID_ENV_NAME: () => UA_APP_ID_ENV_NAME,
      UA_APP_ID_INI_NAME: () => UA_APP_ID_INI_NAME,
      crtAvailability: () => crtAvailability,
      defaultUserAgent: () => defaultUserAgent
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_node_config_provider = require_dist_cjs14();
    var import_os = require("os");
    var import_process = require("process");
    var crtAvailability = {
      isCrtAvailable: false
    };
    var isCrtAvailable = /* @__PURE__ */ __name(() => {
      if (crtAvailability.isCrtAvailable) {
        return ["md/crt-avail"];
      }
      return null;
    }, "isCrtAvailable");
    var UA_APP_ID_ENV_NAME = "AWS_SDK_UA_APP_ID";
    var UA_APP_ID_INI_NAME = "sdk-ua-app-id";
    var defaultUserAgent = /* @__PURE__ */ __name(({ serviceId, clientVersion }) => {
      const sections = [
        // sdk-metadata
        ["aws-sdk-js", clientVersion],
        // ua-metadata
        ["ua", "2.0"],
        // os-metadata
        [`os/${(0, import_os.platform)()}`, (0, import_os.release)()],
        // language-metadata
        // ECMAScript edition doesn't matter in JS, so no version needed.
        ["lang/js"],
        ["md/nodejs", `${import_process.versions.node}`]
      ];
      const crtAvailable = isCrtAvailable();
      if (crtAvailable) {
        sections.push(crtAvailable);
      }
      if (serviceId) {
        sections.push([`api/${serviceId}`, clientVersion]);
      }
      if (import_process.env.AWS_EXECUTION_ENV) {
        sections.push([`exec-env/${import_process.env.AWS_EXECUTION_ENV}`]);
      }
      const appIdPromise = (0, import_node_config_provider.loadConfig)({
        environmentVariableSelector: (env2) => env2[UA_APP_ID_ENV_NAME],
        configFileSelector: (profile) => profile[UA_APP_ID_INI_NAME],
        default: void 0
      })();
      let resolvedUserAgent = void 0;
      return async () => {
        if (!resolvedUserAgent) {
          const appId = await appIdPromise;
          resolvedUserAgent = appId ? [...sections, [`app/${appId}`]] : [...sections];
        }
        return resolvedUserAgent;
      };
    }, "defaultUserAgent");
  }
});

// node_modules/@smithy/hash-node/dist-cjs/index.js
var require_dist_cjs40 = __commonJS({
  "node_modules/@smithy/hash-node/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      Hash: () => Hash
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_util_buffer_from = require_dist_cjs23();
    var import_util_utf8 = require_dist_cjs24();
    var import_buffer = require("buffer");
    var import_crypto5 = require("crypto");
    var _Hash = class _Hash {
      constructor(algorithmIdentifier, secret) {
        this.algorithmIdentifier = algorithmIdentifier;
        this.secret = secret;
        this.reset();
      }
      update(toHash, encoding) {
        this.hash.update((0, import_util_utf8.toUint8Array)(castSourceData(toHash, encoding)));
      }
      digest() {
        return Promise.resolve(this.hash.digest());
      }
      reset() {
        this.hash = this.secret ? (0, import_crypto5.createHmac)(this.algorithmIdentifier, castSourceData(this.secret)) : (0, import_crypto5.createHash)(this.algorithmIdentifier);
      }
    };
    __name(_Hash, "Hash");
    var Hash = _Hash;
    function castSourceData(toCast, encoding) {
      if (import_buffer.Buffer.isBuffer(toCast)) {
        return toCast;
      }
      if (typeof toCast === "string") {
        return (0, import_util_buffer_from.fromString)(toCast, encoding);
      }
      if (ArrayBuffer.isView(toCast)) {
        return (0, import_util_buffer_from.fromArrayBuffer)(toCast.buffer, toCast.byteOffset, toCast.byteLength);
      }
      return (0, import_util_buffer_from.fromArrayBuffer)(toCast);
    }
    __name(castSourceData, "castSourceData");
  }
});

// node_modules/@smithy/util-body-length-node/dist-cjs/index.js
var require_dist_cjs41 = __commonJS({
  "node_modules/@smithy/util-body-length-node/dist-cjs/index.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      calculateBodyLength: () => calculateBodyLength
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_fs = require("fs");
    var calculateBodyLength = /* @__PURE__ */ __name((body) => {
      if (!body) {
        return 0;
      }
      if (typeof body === "string") {
        return Buffer.byteLength(body);
      } else if (typeof body.byteLength === "number") {
        return body.byteLength;
      } else if (typeof body.size === "number") {
        return body.size;
      } else if (typeof body.start === "number" && typeof body.end === "number") {
        return body.end + 1 - body.start;
      } else if (typeof body.path === "string" || Buffer.isBuffer(body.path)) {
        return (0, import_fs.lstatSync)(body.path).size;
      } else if (typeof body.fd === "number") {
        return (0, import_fs.fstatSync)(body.fd).size;
      }
      throw new Error(`Body Length computation failed for ${body}`);
    }, "calculateBodyLength");
  }
});

// node_modules/@aws-sdk/client-sso/dist-cjs/endpoint/ruleset.js
var require_ruleset = __commonJS({
  "node_modules/@aws-sdk/client-sso/dist-cjs/endpoint/ruleset.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ruleSet = void 0;
    var u = "required";
    var v = "fn";
    var w = "argv";
    var x = "ref";
    var a = true;
    var b = "isSet";
    var c = "booleanEquals";
    var d = "error";
    var e = "endpoint";
    var f = "tree";
    var g = "PartitionResult";
    var h = "getAttr";
    var i = { [u]: false, "type": "String" };
    var j = { [u]: true, "default": false, "type": "Boolean" };
    var k = { [x]: "Endpoint" };
    var l = { [v]: c, [w]: [{ [x]: "UseFIPS" }, true] };
    var m = { [v]: c, [w]: [{ [x]: "UseDualStack" }, true] };
    var n = {};
    var o = { [v]: h, [w]: [{ [x]: g }, "supportsFIPS"] };
    var p = { [x]: g };
    var q = { [v]: c, [w]: [true, { [v]: h, [w]: [p, "supportsDualStack"] }] };
    var r = [l];
    var s = [m];
    var t = [{ [x]: "Region" }];
    var _data = { version: "1.0", parameters: { Region: i, UseDualStack: j, UseFIPS: j, Endpoint: i }, rules: [{ conditions: [{ [v]: b, [w]: [k] }], rules: [{ conditions: r, error: "Invalid Configuration: FIPS and custom endpoint are not supported", type: d }, { conditions: s, error: "Invalid Configuration: Dualstack and custom endpoint are not supported", type: d }, { endpoint: { url: k, properties: n, headers: n }, type: e }], type: f }, { conditions: [{ [v]: b, [w]: t }], rules: [{ conditions: [{ [v]: "aws.partition", [w]: t, assign: g }], rules: [{ conditions: [l, m], rules: [{ conditions: [{ [v]: c, [w]: [a, o] }, q], rules: [{ endpoint: { url: "https://portal.sso-fips.{Region}.{PartitionResult#dualStackDnsSuffix}", properties: n, headers: n }, type: e }], type: f }, { error: "FIPS and DualStack are enabled, but this partition does not support one or both", type: d }], type: f }, { conditions: r, rules: [{ conditions: [{ [v]: c, [w]: [o, a] }], rules: [{ conditions: [{ [v]: "stringEquals", [w]: [{ [v]: h, [w]: [p, "name"] }, "aws-us-gov"] }], endpoint: { url: "https://portal.sso.{Region}.amazonaws.com", properties: n, headers: n }, type: e }, { endpoint: { url: "https://portal.sso-fips.{Region}.{PartitionResult#dnsSuffix}", properties: n, headers: n }, type: e }], type: f }, { error: "FIPS is enabled but this partition does not support FIPS", type: d }], type: f }, { conditions: s, rules: [{ conditions: [q], rules: [{ endpoint: { url: "https://portal.sso.{Region}.{PartitionResult#dualStackDnsSuffix}", properties: n, headers: n }, type: e }], type: f }, { error: "DualStack is enabled but this partition does not support DualStack", type: d }], type: f }, { endpoint: { url: "https://portal.sso.{Region}.{PartitionResult#dnsSuffix}", properties: n, headers: n }, type: e }], type: f }], type: f }, { error: "Invalid Configuration: Missing Region", type: d }] };
    exports2.ruleSet = _data;
  }
});

// node_modules/@aws-sdk/client-sso/dist-cjs/endpoint/endpointResolver.js
var require_endpointResolver = __commonJS({
  "node_modules/@aws-sdk/client-sso/dist-cjs/endpoint/endpointResolver.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.defaultEndpointResolver = void 0;
    var util_endpoints_1 = require_dist_cjs7();
    var util_endpoints_2 = require_dist_cjs6();
    var ruleset_1 = require_ruleset();
    var defaultEndpointResolver = (endpointParams, context = {}) => {
      return (0, util_endpoints_2.resolveEndpoint)(ruleset_1.ruleSet, {
        endpointParams,
        logger: context.logger
      });
    };
    exports2.defaultEndpointResolver = defaultEndpointResolver;
    util_endpoints_2.customEndpointFunctions.aws = util_endpoints_1.awsEndpointFunctions;
  }
});

// node_modules/@aws-sdk/client-sso/dist-cjs/runtimeConfig.shared.js
var require_runtimeConfig_shared = __commonJS({
  "node_modules/@aws-sdk/client-sso/dist-cjs/runtimeConfig.shared.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getRuntimeConfig = void 0;
    var core_1 = (init_dist_es2(), __toCommonJS(dist_es_exports2));
    var core_2 = (init_dist_es(), __toCommonJS(dist_es_exports));
    var smithy_client_1 = require_dist_cjs32();
    var url_parser_1 = require_dist_cjs16();
    var util_base64_1 = require_dist_cjs25();
    var util_utf8_1 = require_dist_cjs24();
    var httpAuthSchemeProvider_1 = require_httpAuthSchemeProvider2();
    var endpointResolver_1 = require_endpointResolver();
    var getRuntimeConfig = (config) => {
      return {
        apiVersion: "2019-06-10",
        base64Decoder: config?.base64Decoder ?? util_base64_1.fromBase64,
        base64Encoder: config?.base64Encoder ?? util_base64_1.toBase64,
        disableHostPrefix: config?.disableHostPrefix ?? false,
        endpointProvider: config?.endpointProvider ?? endpointResolver_1.defaultEndpointResolver,
        extensions: config?.extensions ?? [],
        httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? httpAuthSchemeProvider_1.defaultSSOHttpAuthSchemeProvider,
        httpAuthSchemes: config?.httpAuthSchemes ?? [
          {
            schemeId: "aws.auth#sigv4",
            identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4"),
            signer: new core_1.AwsSdkSigV4Signer()
          },
          {
            schemeId: "smithy.api#noAuth",
            identityProvider: (ipc) => ipc.getIdentityProvider("smithy.api#noAuth") || (async () => ({})),
            signer: new core_2.NoAuthSigner()
          }
        ],
        logger: config?.logger ?? new smithy_client_1.NoOpLogger(),
        serviceId: config?.serviceId ?? "SSO",
        urlParser: config?.urlParser ?? url_parser_1.parseUrl,
        utf8Decoder: config?.utf8Decoder ?? util_utf8_1.fromUtf8,
        utf8Encoder: config?.utf8Encoder ?? util_utf8_1.toUtf8
      };
    };
    exports2.getRuntimeConfig = getRuntimeConfig;
  }
});

// node_modules/@smithy/util-defaults-mode-node/dist-cjs/index.js
var require_dist_cjs42 = __commonJS({
  "node_modules/@smithy/util-defaults-mode-node/dist-cjs/index.js"(exports2, module2) {
    var __create2 = Object.create;
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf2 = Object.getPrototypeOf;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      resolveDefaultsModeConfig: () => resolveDefaultsModeConfig
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_config_resolver = require_dist_cjs11();
    var import_node_config_provider = require_dist_cjs14();
    var import_property_provider2 = require_dist_cjs12();
    var AWS_EXECUTION_ENV = "AWS_EXECUTION_ENV";
    var AWS_REGION_ENV = "AWS_REGION";
    var AWS_DEFAULT_REGION_ENV = "AWS_DEFAULT_REGION";
    var ENV_IMDS_DISABLED = "AWS_EC2_METADATA_DISABLED";
    var DEFAULTS_MODE_OPTIONS = ["in-region", "cross-region", "mobile", "standard", "legacy"];
    var IMDS_REGION_PATH = "/latest/meta-data/placement/region";
    var AWS_DEFAULTS_MODE_ENV = "AWS_DEFAULTS_MODE";
    var AWS_DEFAULTS_MODE_CONFIG = "defaults_mode";
    var NODE_DEFAULTS_MODE_CONFIG_OPTIONS = {
      environmentVariableSelector: (env) => {
        return env[AWS_DEFAULTS_MODE_ENV];
      },
      configFileSelector: (profile) => {
        return profile[AWS_DEFAULTS_MODE_CONFIG];
      },
      default: "legacy"
    };
    var resolveDefaultsModeConfig = /* @__PURE__ */ __name(({
      region = (0, import_node_config_provider.loadConfig)(import_config_resolver.NODE_REGION_CONFIG_OPTIONS),
      defaultsMode = (0, import_node_config_provider.loadConfig)(NODE_DEFAULTS_MODE_CONFIG_OPTIONS)
    } = {}) => (0, import_property_provider2.memoize)(async () => {
      const mode = typeof defaultsMode === "function" ? await defaultsMode() : defaultsMode;
      switch (mode == null ? void 0 : mode.toLowerCase()) {
        case "auto":
          return resolveNodeDefaultsModeAuto(region);
        case "in-region":
        case "cross-region":
        case "mobile":
        case "standard":
        case "legacy":
          return Promise.resolve(mode == null ? void 0 : mode.toLocaleLowerCase());
        case void 0:
          return Promise.resolve("legacy");
        default:
          throw new Error(
            `Invalid parameter for "defaultsMode", expect ${DEFAULTS_MODE_OPTIONS.join(", ")}, got ${mode}`
          );
      }
    }), "resolveDefaultsModeConfig");
    var resolveNodeDefaultsModeAuto = /* @__PURE__ */ __name(async (clientRegion) => {
      if (clientRegion) {
        const resolvedRegion = typeof clientRegion === "function" ? await clientRegion() : clientRegion;
        const inferredRegion = await inferPhysicalRegion();
        if (!inferredRegion) {
          return "standard";
        }
        if (resolvedRegion === inferredRegion) {
          return "in-region";
        } else {
          return "cross-region";
        }
      }
      return "standard";
    }, "resolveNodeDefaultsModeAuto");
    var inferPhysicalRegion = /* @__PURE__ */ __name(async () => {
      if (process.env[AWS_EXECUTION_ENV] && (process.env[AWS_REGION_ENV] || process.env[AWS_DEFAULT_REGION_ENV])) {
        return process.env[AWS_REGION_ENV] ?? process.env[AWS_DEFAULT_REGION_ENV];
      }
      if (!process.env[ENV_IMDS_DISABLED]) {
        try {
          const { getInstanceMetadataEndpoint, httpRequest } = await Promise.resolve().then(() => __toESM2(require_dist_cjs37()));
          const endpoint = await getInstanceMetadataEndpoint();
          return (await httpRequest({ ...endpoint, path: IMDS_REGION_PATH })).toString();
        } catch (e) {
        }
      }
    }, "inferPhysicalRegion");
  }
});

// node_modules/@aws-sdk/client-sso/dist-cjs/runtimeConfig.js
var require_runtimeConfig = __commonJS({
  "node_modules/@aws-sdk/client-sso/dist-cjs/runtimeConfig.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getRuntimeConfig = void 0;
    var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
    var package_json_1 = tslib_1.__importDefault(require_package2());
    var core_1 = (init_dist_es2(), __toCommonJS(dist_es_exports2));
    var util_user_agent_node_1 = require_dist_cjs39();
    var config_resolver_1 = require_dist_cjs11();
    var hash_node_1 = require_dist_cjs40();
    var middleware_retry_1 = require_dist_cjs33();
    var node_config_provider_1 = require_dist_cjs14();
    var node_http_handler_1 = require_dist_cjs28();
    var util_body_length_node_1 = require_dist_cjs41();
    var util_retry_1 = require_dist_cjs20();
    var runtimeConfig_shared_1 = require_runtimeConfig_shared();
    var smithy_client_1 = require_dist_cjs32();
    var util_defaults_mode_node_1 = require_dist_cjs42();
    var smithy_client_2 = require_dist_cjs32();
    var getRuntimeConfig = (config) => {
      (0, smithy_client_2.emitWarningIfUnsupportedVersion)(process.version);
      const defaultsMode = (0, util_defaults_mode_node_1.resolveDefaultsModeConfig)(config);
      const defaultConfigProvider = () => defaultsMode().then(smithy_client_1.loadConfigsForDefaultMode);
      const clientSharedValues = (0, runtimeConfig_shared_1.getRuntimeConfig)(config);
      (0, core_1.emitWarningIfUnsupportedVersion)(process.version);
      return {
        ...clientSharedValues,
        ...config,
        runtime: "node",
        defaultsMode,
        bodyLengthChecker: config?.bodyLengthChecker ?? util_body_length_node_1.calculateBodyLength,
        defaultUserAgentProvider: config?.defaultUserAgentProvider ?? (0, util_user_agent_node_1.defaultUserAgent)({ serviceId: clientSharedValues.serviceId, clientVersion: package_json_1.default.version }),
        maxAttempts: config?.maxAttempts ?? (0, node_config_provider_1.loadConfig)(middleware_retry_1.NODE_MAX_ATTEMPT_CONFIG_OPTIONS),
        region: config?.region ?? (0, node_config_provider_1.loadConfig)(config_resolver_1.NODE_REGION_CONFIG_OPTIONS, config_resolver_1.NODE_REGION_CONFIG_FILE_OPTIONS),
        requestHandler: node_http_handler_1.NodeHttpHandler.create(config?.requestHandler ?? defaultConfigProvider),
        retryMode: config?.retryMode ?? (0, node_config_provider_1.loadConfig)({
          ...middleware_retry_1.NODE_RETRY_MODE_CONFIG_OPTIONS,
          default: async () => (await defaultConfigProvider()).retryMode || util_retry_1.DEFAULT_RETRY_MODE
        }),
        sha256: config?.sha256 ?? hash_node_1.Hash.bind(null, "sha256"),
        streamCollector: config?.streamCollector ?? node_http_handler_1.streamCollector,
        useDualstackEndpoint: config?.useDualstackEndpoint ?? (0, node_config_provider_1.loadConfig)(config_resolver_1.NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS),
        useFipsEndpoint: config?.useFipsEndpoint ?? (0, node_config_provider_1.loadConfig)(config_resolver_1.NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS)
      };
    };
    exports2.getRuntimeConfig = getRuntimeConfig;
  }
});

// node_modules/@aws-sdk/region-config-resolver/dist-cjs/index.js
var require_dist_cjs43 = __commonJS({
  "node_modules/@aws-sdk/region-config-resolver/dist-cjs/index.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      NODE_REGION_CONFIG_FILE_OPTIONS: () => NODE_REGION_CONFIG_FILE_OPTIONS,
      NODE_REGION_CONFIG_OPTIONS: () => NODE_REGION_CONFIG_OPTIONS,
      REGION_ENV_NAME: () => REGION_ENV_NAME,
      REGION_INI_NAME: () => REGION_INI_NAME,
      getAwsRegionExtensionConfiguration: () => getAwsRegionExtensionConfiguration,
      resolveAwsRegionExtensionConfiguration: () => resolveAwsRegionExtensionConfiguration,
      resolveRegionConfig: () => resolveRegionConfig
    });
    module2.exports = __toCommonJS2(src_exports);
    var getAwsRegionExtensionConfiguration = /* @__PURE__ */ __name((runtimeConfig) => {
      let runtimeConfigRegion = /* @__PURE__ */ __name(async () => {
        if (runtimeConfig.region === void 0) {
          throw new Error("Region is missing from runtimeConfig");
        }
        const region = runtimeConfig.region;
        if (typeof region === "string") {
          return region;
        }
        return region();
      }, "runtimeConfigRegion");
      return {
        setRegion(region) {
          runtimeConfigRegion = region;
        },
        region() {
          return runtimeConfigRegion;
        }
      };
    }, "getAwsRegionExtensionConfiguration");
    var resolveAwsRegionExtensionConfiguration = /* @__PURE__ */ __name((awsRegionExtensionConfiguration) => {
      return {
        region: awsRegionExtensionConfiguration.region()
      };
    }, "resolveAwsRegionExtensionConfiguration");
    var REGION_ENV_NAME = "AWS_REGION";
    var REGION_INI_NAME = "region";
    var NODE_REGION_CONFIG_OPTIONS = {
      environmentVariableSelector: (env) => env[REGION_ENV_NAME],
      configFileSelector: (profile) => profile[REGION_INI_NAME],
      default: () => {
        throw new Error("Region is missing");
      }
    };
    var NODE_REGION_CONFIG_FILE_OPTIONS = {
      preferredFile: "credentials"
    };
    var isFipsRegion = /* @__PURE__ */ __name((region) => typeof region === "string" && (region.startsWith("fips-") || region.endsWith("-fips")), "isFipsRegion");
    var getRealRegion = /* @__PURE__ */ __name((region) => isFipsRegion(region) ? ["fips-aws-global", "aws-fips"].includes(region) ? "us-east-1" : region.replace(/fips-(dkr-|prod-)?|-fips/, "") : region, "getRealRegion");
    var resolveRegionConfig = /* @__PURE__ */ __name((input) => {
      const { region, useFipsEndpoint } = input;
      if (!region) {
        throw new Error("Region is missing");
      }
      return {
        ...input,
        region: async () => {
          if (typeof region === "string") {
            return getRealRegion(region);
          }
          const providedRegion = await region();
          return getRealRegion(providedRegion);
        },
        useFipsEndpoint: async () => {
          const providedRegion = typeof region === "string" ? region : await region();
          if (isFipsRegion(providedRegion)) {
            return true;
          }
          return typeof useFipsEndpoint !== "function" ? Promise.resolve(!!useFipsEndpoint) : useFipsEndpoint();
        }
      };
    }, "resolveRegionConfig");
  }
});

// node_modules/@aws-sdk/client-sso/dist-cjs/index.js
var require_dist_cjs44 = __commonJS({
  "node_modules/@aws-sdk/client-sso/dist-cjs/index.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      GetRoleCredentialsCommand: () => GetRoleCredentialsCommand,
      GetRoleCredentialsRequestFilterSensitiveLog: () => GetRoleCredentialsRequestFilterSensitiveLog,
      GetRoleCredentialsResponseFilterSensitiveLog: () => GetRoleCredentialsResponseFilterSensitiveLog,
      InvalidRequestException: () => InvalidRequestException,
      ListAccountRolesCommand: () => ListAccountRolesCommand,
      ListAccountRolesRequestFilterSensitiveLog: () => ListAccountRolesRequestFilterSensitiveLog,
      ListAccountsCommand: () => ListAccountsCommand,
      ListAccountsRequestFilterSensitiveLog: () => ListAccountsRequestFilterSensitiveLog,
      LogoutCommand: () => LogoutCommand,
      LogoutRequestFilterSensitiveLog: () => LogoutRequestFilterSensitiveLog,
      ResourceNotFoundException: () => ResourceNotFoundException,
      RoleCredentialsFilterSensitiveLog: () => RoleCredentialsFilterSensitiveLog,
      SSO: () => SSO,
      SSOClient: () => SSOClient,
      SSOServiceException: () => SSOServiceException,
      TooManyRequestsException: () => TooManyRequestsException,
      UnauthorizedException: () => UnauthorizedException,
      __Client: () => import_smithy_client5.Client,
      paginateListAccountRoles: () => paginateListAccountRoles,
      paginateListAccounts: () => paginateListAccounts
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_middleware_host_header = require_dist_cjs3();
    var import_middleware_logger = require_dist_cjs4();
    var import_middleware_recursion_detection = require_dist_cjs5();
    var import_middleware_user_agent = require_dist_cjs8();
    var import_config_resolver = require_dist_cjs11();
    var import_core3 = (init_dist_es(), __toCommonJS(dist_es_exports));
    var import_middleware_content_length = require_dist_cjs34();
    var import_middleware_endpoint2 = require_dist_cjs18();
    var import_middleware_retry2 = require_dist_cjs33();
    var import_httpAuthSchemeProvider = require_httpAuthSchemeProvider2();
    var resolveClientEndpointParameters = /* @__PURE__ */ __name((options) => {
      return {
        ...options,
        useDualstackEndpoint: options.useDualstackEndpoint ?? false,
        useFipsEndpoint: options.useFipsEndpoint ?? false,
        defaultSigningName: "awsssoportal"
      };
    }, "resolveClientEndpointParameters");
    var commonParams = {
      UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
      Endpoint: { type: "builtInParams", name: "endpoint" },
      Region: { type: "builtInParams", name: "region" },
      UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" }
    };
    var import_runtimeConfig = require_runtimeConfig();
    var import_region_config_resolver = require_dist_cjs43();
    var import_protocol_http8 = require_dist_cjs2();
    var import_smithy_client5 = require_dist_cjs32();
    var getHttpAuthExtensionConfiguration = /* @__PURE__ */ __name((runtimeConfig) => {
      const _httpAuthSchemes = runtimeConfig.httpAuthSchemes;
      let _httpAuthSchemeProvider = runtimeConfig.httpAuthSchemeProvider;
      let _credentials = runtimeConfig.credentials;
      return {
        setHttpAuthScheme(httpAuthScheme) {
          const index = _httpAuthSchemes.findIndex((scheme) => scheme.schemeId === httpAuthScheme.schemeId);
          if (index === -1) {
            _httpAuthSchemes.push(httpAuthScheme);
          } else {
            _httpAuthSchemes.splice(index, 1, httpAuthScheme);
          }
        },
        httpAuthSchemes() {
          return _httpAuthSchemes;
        },
        setHttpAuthSchemeProvider(httpAuthSchemeProvider) {
          _httpAuthSchemeProvider = httpAuthSchemeProvider;
        },
        httpAuthSchemeProvider() {
          return _httpAuthSchemeProvider;
        },
        setCredentials(credentials) {
          _credentials = credentials;
        },
        credentials() {
          return _credentials;
        }
      };
    }, "getHttpAuthExtensionConfiguration");
    var resolveHttpAuthRuntimeConfig = /* @__PURE__ */ __name((config) => {
      return {
        httpAuthSchemes: config.httpAuthSchemes(),
        httpAuthSchemeProvider: config.httpAuthSchemeProvider(),
        credentials: config.credentials()
      };
    }, "resolveHttpAuthRuntimeConfig");
    var asPartial = /* @__PURE__ */ __name((t) => t, "asPartial");
    var resolveRuntimeExtensions = /* @__PURE__ */ __name((runtimeConfig, extensions) => {
      const extensionConfiguration = {
        ...asPartial((0, import_region_config_resolver.getAwsRegionExtensionConfiguration)(runtimeConfig)),
        ...asPartial((0, import_smithy_client5.getDefaultExtensionConfiguration)(runtimeConfig)),
        ...asPartial((0, import_protocol_http8.getHttpHandlerExtensionConfiguration)(runtimeConfig)),
        ...asPartial(getHttpAuthExtensionConfiguration(runtimeConfig))
      };
      extensions.forEach((extension) => extension.configure(extensionConfiguration));
      return {
        ...runtimeConfig,
        ...(0, import_region_config_resolver.resolveAwsRegionExtensionConfiguration)(extensionConfiguration),
        ...(0, import_smithy_client5.resolveDefaultRuntimeConfig)(extensionConfiguration),
        ...(0, import_protocol_http8.resolveHttpHandlerRuntimeConfig)(extensionConfiguration),
        ...resolveHttpAuthRuntimeConfig(extensionConfiguration)
      };
    }, "resolveRuntimeExtensions");
    var _SSOClient = class _SSOClient extends import_smithy_client5.Client {
      constructor(...[configuration]) {
        const _config_0 = (0, import_runtimeConfig.getRuntimeConfig)(configuration || {});
        const _config_1 = resolveClientEndpointParameters(_config_0);
        const _config_2 = (0, import_middleware_user_agent.resolveUserAgentConfig)(_config_1);
        const _config_3 = (0, import_middleware_retry2.resolveRetryConfig)(_config_2);
        const _config_4 = (0, import_config_resolver.resolveRegionConfig)(_config_3);
        const _config_5 = (0, import_middleware_host_header.resolveHostHeaderConfig)(_config_4);
        const _config_6 = (0, import_middleware_endpoint2.resolveEndpointConfig)(_config_5);
        const _config_7 = (0, import_httpAuthSchemeProvider.resolveHttpAuthSchemeConfig)(_config_6);
        const _config_8 = resolveRuntimeExtensions(_config_7, (configuration == null ? void 0 : configuration.extensions) || []);
        super(_config_8);
        this.config = _config_8;
        this.middlewareStack.use((0, import_middleware_user_agent.getUserAgentPlugin)(this.config));
        this.middlewareStack.use((0, import_middleware_retry2.getRetryPlugin)(this.config));
        this.middlewareStack.use((0, import_middleware_content_length.getContentLengthPlugin)(this.config));
        this.middlewareStack.use((0, import_middleware_host_header.getHostHeaderPlugin)(this.config));
        this.middlewareStack.use((0, import_middleware_logger.getLoggerPlugin)(this.config));
        this.middlewareStack.use((0, import_middleware_recursion_detection.getRecursionDetectionPlugin)(this.config));
        this.middlewareStack.use(
          (0, import_core3.getHttpAuthSchemeEndpointRuleSetPlugin)(this.config, {
            httpAuthSchemeParametersProvider: import_httpAuthSchemeProvider.defaultSSOHttpAuthSchemeParametersProvider,
            identityProviderConfigProvider: async (config) => new import_core3.DefaultIdentityProviderConfig({
              "aws.auth#sigv4": config.credentials
            })
          })
        );
        this.middlewareStack.use((0, import_core3.getHttpSigningPlugin)(this.config));
      }
      /**
       * Destroy underlying resources, like sockets. It's usually not necessary to do this.
       * However in Node.js, it's best to explicitly shut down the client's agent when it is no longer needed.
       * Otherwise, sockets might stay open for quite a long time before the server terminates them.
       */
      destroy() {
        super.destroy();
      }
    };
    __name(_SSOClient, "SSOClient");
    var SSOClient = _SSOClient;
    var import_middleware_serde2 = require_dist_cjs17();
    var _SSOServiceException = class _SSOServiceException2 extends import_smithy_client5.ServiceException {
      /**
       * @internal
       */
      constructor(options) {
        super(options);
        Object.setPrototypeOf(this, _SSOServiceException2.prototype);
      }
    };
    __name(_SSOServiceException, "SSOServiceException");
    var SSOServiceException = _SSOServiceException;
    var _InvalidRequestException = class _InvalidRequestException2 extends SSOServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "InvalidRequestException",
          $fault: "client",
          ...opts
        });
        this.name = "InvalidRequestException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _InvalidRequestException2.prototype);
      }
    };
    __name(_InvalidRequestException, "InvalidRequestException");
    var InvalidRequestException = _InvalidRequestException;
    var _ResourceNotFoundException = class _ResourceNotFoundException2 extends SSOServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "ResourceNotFoundException",
          $fault: "client",
          ...opts
        });
        this.name = "ResourceNotFoundException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _ResourceNotFoundException2.prototype);
      }
    };
    __name(_ResourceNotFoundException, "ResourceNotFoundException");
    var ResourceNotFoundException = _ResourceNotFoundException;
    var _TooManyRequestsException = class _TooManyRequestsException2 extends SSOServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "TooManyRequestsException",
          $fault: "client",
          ...opts
        });
        this.name = "TooManyRequestsException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _TooManyRequestsException2.prototype);
      }
    };
    __name(_TooManyRequestsException, "TooManyRequestsException");
    var TooManyRequestsException = _TooManyRequestsException;
    var _UnauthorizedException = class _UnauthorizedException2 extends SSOServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "UnauthorizedException",
          $fault: "client",
          ...opts
        });
        this.name = "UnauthorizedException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _UnauthorizedException2.prototype);
      }
    };
    __name(_UnauthorizedException, "UnauthorizedException");
    var UnauthorizedException = _UnauthorizedException;
    var GetRoleCredentialsRequestFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.accessToken && { accessToken: import_smithy_client5.SENSITIVE_STRING }
    }), "GetRoleCredentialsRequestFilterSensitiveLog");
    var RoleCredentialsFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.secretAccessKey && { secretAccessKey: import_smithy_client5.SENSITIVE_STRING },
      ...obj.sessionToken && { sessionToken: import_smithy_client5.SENSITIVE_STRING }
    }), "RoleCredentialsFilterSensitiveLog");
    var GetRoleCredentialsResponseFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.roleCredentials && { roleCredentials: RoleCredentialsFilterSensitiveLog(obj.roleCredentials) }
    }), "GetRoleCredentialsResponseFilterSensitiveLog");
    var ListAccountRolesRequestFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.accessToken && { accessToken: import_smithy_client5.SENSITIVE_STRING }
    }), "ListAccountRolesRequestFilterSensitiveLog");
    var ListAccountsRequestFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.accessToken && { accessToken: import_smithy_client5.SENSITIVE_STRING }
    }), "ListAccountsRequestFilterSensitiveLog");
    var LogoutRequestFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.accessToken && { accessToken: import_smithy_client5.SENSITIVE_STRING }
    }), "LogoutRequestFilterSensitiveLog");
    var import_core22 = (init_dist_es2(), __toCommonJS(dist_es_exports2));
    var se_GetRoleCredentialsCommand = /* @__PURE__ */ __name(async (input, context) => {
      const b = (0, import_core3.requestBuilder)(input, context);
      const headers = (0, import_smithy_client5.map)({}, isSerializableHeaderValue, {
        [_xasbt]: input[_aT]
      });
      b.bp("/federation/credentials");
      const query2 = (0, import_smithy_client5.map)({
        [_rn]: [, (0, import_smithy_client5.expectNonNull)(input[_rN], `roleName`)],
        [_ai]: [, (0, import_smithy_client5.expectNonNull)(input[_aI], `accountId`)]
      });
      let body;
      b.m("GET").h(headers).q(query2).b(body);
      return b.build();
    }, "se_GetRoleCredentialsCommand");
    var se_ListAccountRolesCommand = /* @__PURE__ */ __name(async (input, context) => {
      const b = (0, import_core3.requestBuilder)(input, context);
      const headers = (0, import_smithy_client5.map)({}, isSerializableHeaderValue, {
        [_xasbt]: input[_aT]
      });
      b.bp("/assignment/roles");
      const query2 = (0, import_smithy_client5.map)({
        [_nt]: [, input[_nT]],
        [_mr]: [() => input.maxResults !== void 0, () => input[_mR].toString()],
        [_ai]: [, (0, import_smithy_client5.expectNonNull)(input[_aI], `accountId`)]
      });
      let body;
      b.m("GET").h(headers).q(query2).b(body);
      return b.build();
    }, "se_ListAccountRolesCommand");
    var se_ListAccountsCommand = /* @__PURE__ */ __name(async (input, context) => {
      const b = (0, import_core3.requestBuilder)(input, context);
      const headers = (0, import_smithy_client5.map)({}, isSerializableHeaderValue, {
        [_xasbt]: input[_aT]
      });
      b.bp("/assignment/accounts");
      const query2 = (0, import_smithy_client5.map)({
        [_nt]: [, input[_nT]],
        [_mr]: [() => input.maxResults !== void 0, () => input[_mR].toString()]
      });
      let body;
      b.m("GET").h(headers).q(query2).b(body);
      return b.build();
    }, "se_ListAccountsCommand");
    var se_LogoutCommand = /* @__PURE__ */ __name(async (input, context) => {
      const b = (0, import_core3.requestBuilder)(input, context);
      const headers = (0, import_smithy_client5.map)({}, isSerializableHeaderValue, {
        [_xasbt]: input[_aT]
      });
      b.bp("/logout");
      let body;
      b.m("POST").h(headers).b(body);
      return b.build();
    }, "se_LogoutCommand");
    var de_GetRoleCredentialsCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const contents = (0, import_smithy_client5.map)({
        $metadata: deserializeMetadata(output)
      });
      const data = (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.expectObject)(await (0, import_core22.parseJsonBody)(output.body, context)), "body");
      const doc = (0, import_smithy_client5.take)(data, {
        roleCredentials: import_smithy_client5._json
      });
      Object.assign(contents, doc);
      return contents;
    }, "de_GetRoleCredentialsCommand");
    var de_ListAccountRolesCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const contents = (0, import_smithy_client5.map)({
        $metadata: deserializeMetadata(output)
      });
      const data = (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.expectObject)(await (0, import_core22.parseJsonBody)(output.body, context)), "body");
      const doc = (0, import_smithy_client5.take)(data, {
        nextToken: import_smithy_client5.expectString,
        roleList: import_smithy_client5._json
      });
      Object.assign(contents, doc);
      return contents;
    }, "de_ListAccountRolesCommand");
    var de_ListAccountsCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const contents = (0, import_smithy_client5.map)({
        $metadata: deserializeMetadata(output)
      });
      const data = (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.expectObject)(await (0, import_core22.parseJsonBody)(output.body, context)), "body");
      const doc = (0, import_smithy_client5.take)(data, {
        accountList: import_smithy_client5._json,
        nextToken: import_smithy_client5.expectString
      });
      Object.assign(contents, doc);
      return contents;
    }, "de_ListAccountsCommand");
    var de_LogoutCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const contents = (0, import_smithy_client5.map)({
        $metadata: deserializeMetadata(output)
      });
      await (0, import_smithy_client5.collectBody)(output.body, context);
      return contents;
    }, "de_LogoutCommand");
    var de_CommandError = /* @__PURE__ */ __name(async (output, context) => {
      const parsedOutput = {
        ...output,
        body: await (0, import_core22.parseJsonErrorBody)(output.body, context)
      };
      const errorCode = (0, import_core22.loadRestJsonErrorCode)(output, parsedOutput.body);
      switch (errorCode) {
        case "InvalidRequestException":
        case "com.amazonaws.sso#InvalidRequestException":
          throw await de_InvalidRequestExceptionRes(parsedOutput, context);
        case "ResourceNotFoundException":
        case "com.amazonaws.sso#ResourceNotFoundException":
          throw await de_ResourceNotFoundExceptionRes(parsedOutput, context);
        case "TooManyRequestsException":
        case "com.amazonaws.sso#TooManyRequestsException":
          throw await de_TooManyRequestsExceptionRes(parsedOutput, context);
        case "UnauthorizedException":
        case "com.amazonaws.sso#UnauthorizedException":
          throw await de_UnauthorizedExceptionRes(parsedOutput, context);
        default:
          const parsedBody = parsedOutput.body;
          return throwDefaultError({
            output,
            parsedBody,
            errorCode
          });
      }
    }, "de_CommandError");
    var throwDefaultError = (0, import_smithy_client5.withBaseException)(SSOServiceException);
    var de_InvalidRequestExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const contents = (0, import_smithy_client5.map)({});
      const data = parsedOutput.body;
      const doc = (0, import_smithy_client5.take)(data, {
        message: import_smithy_client5.expectString
      });
      Object.assign(contents, doc);
      const exception = new InvalidRequestException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, parsedOutput.body);
    }, "de_InvalidRequestExceptionRes");
    var de_ResourceNotFoundExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const contents = (0, import_smithy_client5.map)({});
      const data = parsedOutput.body;
      const doc = (0, import_smithy_client5.take)(data, {
        message: import_smithy_client5.expectString
      });
      Object.assign(contents, doc);
      const exception = new ResourceNotFoundException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, parsedOutput.body);
    }, "de_ResourceNotFoundExceptionRes");
    var de_TooManyRequestsExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const contents = (0, import_smithy_client5.map)({});
      const data = parsedOutput.body;
      const doc = (0, import_smithy_client5.take)(data, {
        message: import_smithy_client5.expectString
      });
      Object.assign(contents, doc);
      const exception = new TooManyRequestsException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, parsedOutput.body);
    }, "de_TooManyRequestsExceptionRes");
    var de_UnauthorizedExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const contents = (0, import_smithy_client5.map)({});
      const data = parsedOutput.body;
      const doc = (0, import_smithy_client5.take)(data, {
        message: import_smithy_client5.expectString
      });
      Object.assign(contents, doc);
      const exception = new UnauthorizedException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, parsedOutput.body);
    }, "de_UnauthorizedExceptionRes");
    var deserializeMetadata = /* @__PURE__ */ __name((output) => ({
      httpStatusCode: output.statusCode,
      requestId: output.headers["x-amzn-requestid"] ?? output.headers["x-amzn-request-id"] ?? output.headers["x-amz-request-id"],
      extendedRequestId: output.headers["x-amz-id-2"],
      cfId: output.headers["x-amz-cf-id"]
    }), "deserializeMetadata");
    var isSerializableHeaderValue = /* @__PURE__ */ __name((value) => value !== void 0 && value !== null && value !== "" && (!Object.getOwnPropertyNames(value).includes("length") || value.length != 0) && (!Object.getOwnPropertyNames(value).includes("size") || value.size != 0), "isSerializableHeaderValue");
    var _aI = "accountId";
    var _aT = "accessToken";
    var _ai = "account_id";
    var _mR = "maxResults";
    var _mr = "max_result";
    var _nT = "nextToken";
    var _nt = "next_token";
    var _rN = "roleName";
    var _rn = "role_name";
    var _xasbt = "x-amz-sso_bearer_token";
    var _GetRoleCredentialsCommand = class _GetRoleCredentialsCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("SWBPortalService", "GetRoleCredentials", {}).n("SSOClient", "GetRoleCredentialsCommand").f(GetRoleCredentialsRequestFilterSensitiveLog, GetRoleCredentialsResponseFilterSensitiveLog).ser(se_GetRoleCredentialsCommand).de(de_GetRoleCredentialsCommand).build() {
    };
    __name(_GetRoleCredentialsCommand, "GetRoleCredentialsCommand");
    var GetRoleCredentialsCommand = _GetRoleCredentialsCommand;
    var _ListAccountRolesCommand = class _ListAccountRolesCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("SWBPortalService", "ListAccountRoles", {}).n("SSOClient", "ListAccountRolesCommand").f(ListAccountRolesRequestFilterSensitiveLog, void 0).ser(se_ListAccountRolesCommand).de(de_ListAccountRolesCommand).build() {
    };
    __name(_ListAccountRolesCommand, "ListAccountRolesCommand");
    var ListAccountRolesCommand = _ListAccountRolesCommand;
    var _ListAccountsCommand = class _ListAccountsCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("SWBPortalService", "ListAccounts", {}).n("SSOClient", "ListAccountsCommand").f(ListAccountsRequestFilterSensitiveLog, void 0).ser(se_ListAccountsCommand).de(de_ListAccountsCommand).build() {
    };
    __name(_ListAccountsCommand, "ListAccountsCommand");
    var ListAccountsCommand = _ListAccountsCommand;
    var _LogoutCommand = class _LogoutCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("SWBPortalService", "Logout", {}).n("SSOClient", "LogoutCommand").f(LogoutRequestFilterSensitiveLog, void 0).ser(se_LogoutCommand).de(de_LogoutCommand).build() {
    };
    __name(_LogoutCommand, "LogoutCommand");
    var LogoutCommand = _LogoutCommand;
    var commands = {
      GetRoleCredentialsCommand,
      ListAccountRolesCommand,
      ListAccountsCommand,
      LogoutCommand
    };
    var _SSO = class _SSO extends SSOClient {
    };
    __name(_SSO, "SSO");
    var SSO = _SSO;
    (0, import_smithy_client5.createAggregatedClient)(commands, SSO);
    var paginateListAccountRoles = (0, import_core3.createPaginator)(SSOClient, ListAccountRolesCommand, "nextToken", "nextToken", "maxResults");
    var paginateListAccounts = (0, import_core3.createPaginator)(SSOClient, ListAccountsCommand, "nextToken", "nextToken", "maxResults");
  }
});

// node_modules/@aws-sdk/client-sso-oidc/dist-cjs/auth/httpAuthSchemeProvider.js
var require_httpAuthSchemeProvider3 = __commonJS({
  "node_modules/@aws-sdk/client-sso-oidc/dist-cjs/auth/httpAuthSchemeProvider.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.resolveHttpAuthSchemeConfig = exports2.defaultSSOOIDCHttpAuthSchemeProvider = exports2.defaultSSOOIDCHttpAuthSchemeParametersProvider = void 0;
    var core_1 = (init_dist_es2(), __toCommonJS(dist_es_exports2));
    var util_middleware_1 = require_dist_cjs10();
    var defaultSSOOIDCHttpAuthSchemeParametersProvider = async (config, context, input) => {
      return {
        operation: (0, util_middleware_1.getSmithyContext)(context).operation,
        region: await (0, util_middleware_1.normalizeProvider)(config.region)() || (() => {
          throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
        })()
      };
    };
    exports2.defaultSSOOIDCHttpAuthSchemeParametersProvider = defaultSSOOIDCHttpAuthSchemeParametersProvider;
    function createAwsAuthSigv4HttpAuthOption(authParameters) {
      return {
        schemeId: "aws.auth#sigv4",
        signingProperties: {
          name: "sso-oauth",
          region: authParameters.region
        },
        propertiesExtractor: (config, context) => ({
          signingProperties: {
            config,
            context
          }
        })
      };
    }
    function createSmithyApiNoAuthHttpAuthOption(authParameters) {
      return {
        schemeId: "smithy.api#noAuth"
      };
    }
    var defaultSSOOIDCHttpAuthSchemeProvider = (authParameters) => {
      const options = [];
      switch (authParameters.operation) {
        case "CreateToken": {
          options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
          break;
        }
        case "RegisterClient": {
          options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
          break;
        }
        case "StartDeviceAuthorization": {
          options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
          break;
        }
        default: {
          options.push(createAwsAuthSigv4HttpAuthOption(authParameters));
        }
      }
      return options;
    };
    exports2.defaultSSOOIDCHttpAuthSchemeProvider = defaultSSOOIDCHttpAuthSchemeProvider;
    var resolveHttpAuthSchemeConfig = (config) => {
      const config_0 = (0, core_1.resolveAwsSdkSigV4Config)(config);
      return {
        ...config_0
      };
    };
    exports2.resolveHttpAuthSchemeConfig = resolveHttpAuthSchemeConfig;
  }
});

// node_modules/@aws-sdk/client-sso-oidc/package.json
var require_package3 = __commonJS({
  "node_modules/@aws-sdk/client-sso-oidc/package.json"(exports2, module2) {
    module2.exports = {
      name: "@aws-sdk/client-sso-oidc",
      description: "AWS SDK for JavaScript Sso Oidc Client for Node.js, Browser and React Native",
      version: "3.645.0",
      scripts: {
        build: "concurrently 'yarn:build:cjs' 'yarn:build:es' 'yarn:build:types'",
        "build:cjs": "node ../../scripts/compilation/inline client-sso-oidc",
        "build:es": "tsc -p tsconfig.es.json",
        "build:include:deps": "lerna run --scope $npm_package_name --include-dependencies build",
        "build:types": "tsc -p tsconfig.types.json",
        "build:types:downlevel": "downlevel-dts dist-types dist-types/ts3.4",
        clean: "rimraf ./dist-* && rimraf *.tsbuildinfo",
        "extract:docs": "api-extractor run --local",
        "generate:client": "node ../../scripts/generate-clients/single-service --solo sso-oidc"
      },
      main: "./dist-cjs/index.js",
      types: "./dist-types/index.d.ts",
      module: "./dist-es/index.js",
      sideEffects: false,
      dependencies: {
        "@aws-crypto/sha256-browser": "5.2.0",
        "@aws-crypto/sha256-js": "5.2.0",
        "@aws-sdk/core": "3.635.0",
        "@aws-sdk/credential-provider-node": "3.645.0",
        "@aws-sdk/middleware-host-header": "3.620.0",
        "@aws-sdk/middleware-logger": "3.609.0",
        "@aws-sdk/middleware-recursion-detection": "3.620.0",
        "@aws-sdk/middleware-user-agent": "3.645.0",
        "@aws-sdk/region-config-resolver": "3.614.0",
        "@aws-sdk/types": "3.609.0",
        "@aws-sdk/util-endpoints": "3.645.0",
        "@aws-sdk/util-user-agent-browser": "3.609.0",
        "@aws-sdk/util-user-agent-node": "3.614.0",
        "@smithy/config-resolver": "^3.0.5",
        "@smithy/core": "^2.4.0",
        "@smithy/fetch-http-handler": "^3.2.4",
        "@smithy/hash-node": "^3.0.3",
        "@smithy/invalid-dependency": "^3.0.3",
        "@smithy/middleware-content-length": "^3.0.5",
        "@smithy/middleware-endpoint": "^3.1.0",
        "@smithy/middleware-retry": "^3.0.15",
        "@smithy/middleware-serde": "^3.0.3",
        "@smithy/middleware-stack": "^3.0.3",
        "@smithy/node-config-provider": "^3.1.4",
        "@smithy/node-http-handler": "^3.1.4",
        "@smithy/protocol-http": "^4.1.0",
        "@smithy/smithy-client": "^3.2.0",
        "@smithy/types": "^3.3.0",
        "@smithy/url-parser": "^3.0.3",
        "@smithy/util-base64": "^3.0.0",
        "@smithy/util-body-length-browser": "^3.0.0",
        "@smithy/util-body-length-node": "^3.0.0",
        "@smithy/util-defaults-mode-browser": "^3.0.15",
        "@smithy/util-defaults-mode-node": "^3.0.15",
        "@smithy/util-endpoints": "^2.0.5",
        "@smithy/util-middleware": "^3.0.3",
        "@smithy/util-retry": "^3.0.3",
        "@smithy/util-utf8": "^3.0.0",
        tslib: "^2.6.2"
      },
      devDependencies: {
        "@tsconfig/node16": "16.1.3",
        "@types/node": "^16.18.96",
        concurrently: "7.0.0",
        "downlevel-dts": "0.10.1",
        rimraf: "3.0.2",
        typescript: "~4.9.5"
      },
      engines: {
        node: ">=16.0.0"
      },
      typesVersions: {
        "<4.0": {
          "dist-types/*": [
            "dist-types/ts3.4/*"
          ]
        }
      },
      files: [
        "dist-*/**"
      ],
      author: {
        name: "AWS SDK for JavaScript Team",
        url: "https://aws.amazon.com/javascript/"
      },
      license: "Apache-2.0",
      peerDependencies: {
        "@aws-sdk/client-sts": "^3.645.0"
      },
      browser: {
        "./dist-es/runtimeConfig": "./dist-es/runtimeConfig.browser"
      },
      "react-native": {
        "./dist-es/runtimeConfig": "./dist-es/runtimeConfig.native"
      },
      homepage: "https://github.com/aws/aws-sdk-js-v3/tree/main/clients/client-sso-oidc",
      repository: {
        type: "git",
        url: "https://github.com/aws/aws-sdk-js-v3.git",
        directory: "clients/client-sso-oidc"
      }
    };
  }
});

// node_modules/@aws-sdk/client-sso-oidc/dist-cjs/endpoint/ruleset.js
var require_ruleset2 = __commonJS({
  "node_modules/@aws-sdk/client-sso-oidc/dist-cjs/endpoint/ruleset.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ruleSet = void 0;
    var u = "required";
    var v = "fn";
    var w = "argv";
    var x = "ref";
    var a = true;
    var b = "isSet";
    var c = "booleanEquals";
    var d = "error";
    var e = "endpoint";
    var f = "tree";
    var g = "PartitionResult";
    var h = "getAttr";
    var i = { [u]: false, "type": "String" };
    var j = { [u]: true, "default": false, "type": "Boolean" };
    var k = { [x]: "Endpoint" };
    var l = { [v]: c, [w]: [{ [x]: "UseFIPS" }, true] };
    var m = { [v]: c, [w]: [{ [x]: "UseDualStack" }, true] };
    var n = {};
    var o = { [v]: h, [w]: [{ [x]: g }, "supportsFIPS"] };
    var p = { [x]: g };
    var q = { [v]: c, [w]: [true, { [v]: h, [w]: [p, "supportsDualStack"] }] };
    var r = [l];
    var s = [m];
    var t = [{ [x]: "Region" }];
    var _data = { version: "1.0", parameters: { Region: i, UseDualStack: j, UseFIPS: j, Endpoint: i }, rules: [{ conditions: [{ [v]: b, [w]: [k] }], rules: [{ conditions: r, error: "Invalid Configuration: FIPS and custom endpoint are not supported", type: d }, { conditions: s, error: "Invalid Configuration: Dualstack and custom endpoint are not supported", type: d }, { endpoint: { url: k, properties: n, headers: n }, type: e }], type: f }, { conditions: [{ [v]: b, [w]: t }], rules: [{ conditions: [{ [v]: "aws.partition", [w]: t, assign: g }], rules: [{ conditions: [l, m], rules: [{ conditions: [{ [v]: c, [w]: [a, o] }, q], rules: [{ endpoint: { url: "https://oidc-fips.{Region}.{PartitionResult#dualStackDnsSuffix}", properties: n, headers: n }, type: e }], type: f }, { error: "FIPS and DualStack are enabled, but this partition does not support one or both", type: d }], type: f }, { conditions: r, rules: [{ conditions: [{ [v]: c, [w]: [o, a] }], rules: [{ conditions: [{ [v]: "stringEquals", [w]: [{ [v]: h, [w]: [p, "name"] }, "aws-us-gov"] }], endpoint: { url: "https://oidc.{Region}.amazonaws.com", properties: n, headers: n }, type: e }, { endpoint: { url: "https://oidc-fips.{Region}.{PartitionResult#dnsSuffix}", properties: n, headers: n }, type: e }], type: f }, { error: "FIPS is enabled but this partition does not support FIPS", type: d }], type: f }, { conditions: s, rules: [{ conditions: [q], rules: [{ endpoint: { url: "https://oidc.{Region}.{PartitionResult#dualStackDnsSuffix}", properties: n, headers: n }, type: e }], type: f }, { error: "DualStack is enabled but this partition does not support DualStack", type: d }], type: f }, { endpoint: { url: "https://oidc.{Region}.{PartitionResult#dnsSuffix}", properties: n, headers: n }, type: e }], type: f }], type: f }, { error: "Invalid Configuration: Missing Region", type: d }] };
    exports2.ruleSet = _data;
  }
});

// node_modules/@aws-sdk/client-sso-oidc/dist-cjs/endpoint/endpointResolver.js
var require_endpointResolver2 = __commonJS({
  "node_modules/@aws-sdk/client-sso-oidc/dist-cjs/endpoint/endpointResolver.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.defaultEndpointResolver = void 0;
    var util_endpoints_1 = require_dist_cjs7();
    var util_endpoints_2 = require_dist_cjs6();
    var ruleset_1 = require_ruleset2();
    var defaultEndpointResolver = (endpointParams, context = {}) => {
      return (0, util_endpoints_2.resolveEndpoint)(ruleset_1.ruleSet, {
        endpointParams,
        logger: context.logger
      });
    };
    exports2.defaultEndpointResolver = defaultEndpointResolver;
    util_endpoints_2.customEndpointFunctions.aws = util_endpoints_1.awsEndpointFunctions;
  }
});

// node_modules/@aws-sdk/client-sso-oidc/dist-cjs/runtimeConfig.shared.js
var require_runtimeConfig_shared2 = __commonJS({
  "node_modules/@aws-sdk/client-sso-oidc/dist-cjs/runtimeConfig.shared.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getRuntimeConfig = void 0;
    var core_1 = (init_dist_es2(), __toCommonJS(dist_es_exports2));
    var core_2 = (init_dist_es(), __toCommonJS(dist_es_exports));
    var smithy_client_1 = require_dist_cjs32();
    var url_parser_1 = require_dist_cjs16();
    var util_base64_1 = require_dist_cjs25();
    var util_utf8_1 = require_dist_cjs24();
    var httpAuthSchemeProvider_1 = require_httpAuthSchemeProvider3();
    var endpointResolver_1 = require_endpointResolver2();
    var getRuntimeConfig = (config) => {
      return {
        apiVersion: "2019-06-10",
        base64Decoder: config?.base64Decoder ?? util_base64_1.fromBase64,
        base64Encoder: config?.base64Encoder ?? util_base64_1.toBase64,
        disableHostPrefix: config?.disableHostPrefix ?? false,
        endpointProvider: config?.endpointProvider ?? endpointResolver_1.defaultEndpointResolver,
        extensions: config?.extensions ?? [],
        httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? httpAuthSchemeProvider_1.defaultSSOOIDCHttpAuthSchemeProvider,
        httpAuthSchemes: config?.httpAuthSchemes ?? [
          {
            schemeId: "aws.auth#sigv4",
            identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4"),
            signer: new core_1.AwsSdkSigV4Signer()
          },
          {
            schemeId: "smithy.api#noAuth",
            identityProvider: (ipc) => ipc.getIdentityProvider("smithy.api#noAuth") || (async () => ({})),
            signer: new core_2.NoAuthSigner()
          }
        ],
        logger: config?.logger ?? new smithy_client_1.NoOpLogger(),
        serviceId: config?.serviceId ?? "SSO OIDC",
        urlParser: config?.urlParser ?? url_parser_1.parseUrl,
        utf8Decoder: config?.utf8Decoder ?? util_utf8_1.fromUtf8,
        utf8Encoder: config?.utf8Encoder ?? util_utf8_1.toUtf8
      };
    };
    exports2.getRuntimeConfig = getRuntimeConfig;
  }
});

// node_modules/@aws-sdk/client-sso-oidc/dist-cjs/runtimeConfig.js
var require_runtimeConfig2 = __commonJS({
  "node_modules/@aws-sdk/client-sso-oidc/dist-cjs/runtimeConfig.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getRuntimeConfig = void 0;
    var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
    var package_json_1 = tslib_1.__importDefault(require_package3());
    var core_1 = (init_dist_es2(), __toCommonJS(dist_es_exports2));
    var credential_provider_node_1 = require_dist_cjs52();
    var util_user_agent_node_1 = require_dist_cjs39();
    var config_resolver_1 = require_dist_cjs11();
    var hash_node_1 = require_dist_cjs40();
    var middleware_retry_1 = require_dist_cjs33();
    var node_config_provider_1 = require_dist_cjs14();
    var node_http_handler_1 = require_dist_cjs28();
    var util_body_length_node_1 = require_dist_cjs41();
    var util_retry_1 = require_dist_cjs20();
    var runtimeConfig_shared_1 = require_runtimeConfig_shared2();
    var smithy_client_1 = require_dist_cjs32();
    var util_defaults_mode_node_1 = require_dist_cjs42();
    var smithy_client_2 = require_dist_cjs32();
    var getRuntimeConfig = (config) => {
      (0, smithy_client_2.emitWarningIfUnsupportedVersion)(process.version);
      const defaultsMode = (0, util_defaults_mode_node_1.resolveDefaultsModeConfig)(config);
      const defaultConfigProvider = () => defaultsMode().then(smithy_client_1.loadConfigsForDefaultMode);
      const clientSharedValues = (0, runtimeConfig_shared_1.getRuntimeConfig)(config);
      (0, core_1.emitWarningIfUnsupportedVersion)(process.version);
      return {
        ...clientSharedValues,
        ...config,
        runtime: "node",
        defaultsMode,
        bodyLengthChecker: config?.bodyLengthChecker ?? util_body_length_node_1.calculateBodyLength,
        credentialDefaultProvider: config?.credentialDefaultProvider ?? credential_provider_node_1.defaultProvider,
        defaultUserAgentProvider: config?.defaultUserAgentProvider ?? (0, util_user_agent_node_1.defaultUserAgent)({ serviceId: clientSharedValues.serviceId, clientVersion: package_json_1.default.version }),
        maxAttempts: config?.maxAttempts ?? (0, node_config_provider_1.loadConfig)(middleware_retry_1.NODE_MAX_ATTEMPT_CONFIG_OPTIONS),
        region: config?.region ?? (0, node_config_provider_1.loadConfig)(config_resolver_1.NODE_REGION_CONFIG_OPTIONS, config_resolver_1.NODE_REGION_CONFIG_FILE_OPTIONS),
        requestHandler: node_http_handler_1.NodeHttpHandler.create(config?.requestHandler ?? defaultConfigProvider),
        retryMode: config?.retryMode ?? (0, node_config_provider_1.loadConfig)({
          ...middleware_retry_1.NODE_RETRY_MODE_CONFIG_OPTIONS,
          default: async () => (await defaultConfigProvider()).retryMode || util_retry_1.DEFAULT_RETRY_MODE
        }),
        sha256: config?.sha256 ?? hash_node_1.Hash.bind(null, "sha256"),
        streamCollector: config?.streamCollector ?? node_http_handler_1.streamCollector,
        useDualstackEndpoint: config?.useDualstackEndpoint ?? (0, node_config_provider_1.loadConfig)(config_resolver_1.NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS),
        useFipsEndpoint: config?.useFipsEndpoint ?? (0, node_config_provider_1.loadConfig)(config_resolver_1.NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS)
      };
    };
    exports2.getRuntimeConfig = getRuntimeConfig;
  }
});

// node_modules/@aws-sdk/client-sso-oidc/dist-cjs/index.js
var require_dist_cjs45 = __commonJS({
  "node_modules/@aws-sdk/client-sso-oidc/dist-cjs/index.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      AccessDeniedException: () => AccessDeniedException,
      AuthorizationPendingException: () => AuthorizationPendingException,
      CreateTokenCommand: () => CreateTokenCommand,
      CreateTokenRequestFilterSensitiveLog: () => CreateTokenRequestFilterSensitiveLog,
      CreateTokenResponseFilterSensitiveLog: () => CreateTokenResponseFilterSensitiveLog,
      CreateTokenWithIAMCommand: () => CreateTokenWithIAMCommand,
      CreateTokenWithIAMRequestFilterSensitiveLog: () => CreateTokenWithIAMRequestFilterSensitiveLog,
      CreateTokenWithIAMResponseFilterSensitiveLog: () => CreateTokenWithIAMResponseFilterSensitiveLog,
      ExpiredTokenException: () => ExpiredTokenException,
      InternalServerException: () => InternalServerException,
      InvalidClientException: () => InvalidClientException,
      InvalidClientMetadataException: () => InvalidClientMetadataException,
      InvalidGrantException: () => InvalidGrantException,
      InvalidRedirectUriException: () => InvalidRedirectUriException,
      InvalidRequestException: () => InvalidRequestException,
      InvalidRequestRegionException: () => InvalidRequestRegionException,
      InvalidScopeException: () => InvalidScopeException,
      RegisterClientCommand: () => RegisterClientCommand,
      RegisterClientResponseFilterSensitiveLog: () => RegisterClientResponseFilterSensitiveLog,
      SSOOIDC: () => SSOOIDC,
      SSOOIDCClient: () => SSOOIDCClient,
      SSOOIDCServiceException: () => SSOOIDCServiceException,
      SlowDownException: () => SlowDownException,
      StartDeviceAuthorizationCommand: () => StartDeviceAuthorizationCommand,
      StartDeviceAuthorizationRequestFilterSensitiveLog: () => StartDeviceAuthorizationRequestFilterSensitiveLog,
      UnauthorizedClientException: () => UnauthorizedClientException,
      UnsupportedGrantTypeException: () => UnsupportedGrantTypeException,
      __Client: () => import_smithy_client5.Client
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_middleware_host_header = require_dist_cjs3();
    var import_middleware_logger = require_dist_cjs4();
    var import_middleware_recursion_detection = require_dist_cjs5();
    var import_middleware_user_agent = require_dist_cjs8();
    var import_config_resolver = require_dist_cjs11();
    var import_core3 = (init_dist_es(), __toCommonJS(dist_es_exports));
    var import_middleware_content_length = require_dist_cjs34();
    var import_middleware_endpoint2 = require_dist_cjs18();
    var import_middleware_retry2 = require_dist_cjs33();
    var import_httpAuthSchemeProvider = require_httpAuthSchemeProvider3();
    var resolveClientEndpointParameters = /* @__PURE__ */ __name((options) => {
      return {
        ...options,
        useDualstackEndpoint: options.useDualstackEndpoint ?? false,
        useFipsEndpoint: options.useFipsEndpoint ?? false,
        defaultSigningName: "sso-oauth"
      };
    }, "resolveClientEndpointParameters");
    var commonParams = {
      UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
      Endpoint: { type: "builtInParams", name: "endpoint" },
      Region: { type: "builtInParams", name: "region" },
      UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" }
    };
    var import_runtimeConfig = require_runtimeConfig2();
    var import_region_config_resolver = require_dist_cjs43();
    var import_protocol_http8 = require_dist_cjs2();
    var import_smithy_client5 = require_dist_cjs32();
    var getHttpAuthExtensionConfiguration = /* @__PURE__ */ __name((runtimeConfig) => {
      const _httpAuthSchemes = runtimeConfig.httpAuthSchemes;
      let _httpAuthSchemeProvider = runtimeConfig.httpAuthSchemeProvider;
      let _credentials = runtimeConfig.credentials;
      return {
        setHttpAuthScheme(httpAuthScheme) {
          const index = _httpAuthSchemes.findIndex((scheme) => scheme.schemeId === httpAuthScheme.schemeId);
          if (index === -1) {
            _httpAuthSchemes.push(httpAuthScheme);
          } else {
            _httpAuthSchemes.splice(index, 1, httpAuthScheme);
          }
        },
        httpAuthSchemes() {
          return _httpAuthSchemes;
        },
        setHttpAuthSchemeProvider(httpAuthSchemeProvider) {
          _httpAuthSchemeProvider = httpAuthSchemeProvider;
        },
        httpAuthSchemeProvider() {
          return _httpAuthSchemeProvider;
        },
        setCredentials(credentials) {
          _credentials = credentials;
        },
        credentials() {
          return _credentials;
        }
      };
    }, "getHttpAuthExtensionConfiguration");
    var resolveHttpAuthRuntimeConfig = /* @__PURE__ */ __name((config) => {
      return {
        httpAuthSchemes: config.httpAuthSchemes(),
        httpAuthSchemeProvider: config.httpAuthSchemeProvider(),
        credentials: config.credentials()
      };
    }, "resolveHttpAuthRuntimeConfig");
    var asPartial = /* @__PURE__ */ __name((t) => t, "asPartial");
    var resolveRuntimeExtensions = /* @__PURE__ */ __name((runtimeConfig, extensions) => {
      const extensionConfiguration = {
        ...asPartial((0, import_region_config_resolver.getAwsRegionExtensionConfiguration)(runtimeConfig)),
        ...asPartial((0, import_smithy_client5.getDefaultExtensionConfiguration)(runtimeConfig)),
        ...asPartial((0, import_protocol_http8.getHttpHandlerExtensionConfiguration)(runtimeConfig)),
        ...asPartial(getHttpAuthExtensionConfiguration(runtimeConfig))
      };
      extensions.forEach((extension) => extension.configure(extensionConfiguration));
      return {
        ...runtimeConfig,
        ...(0, import_region_config_resolver.resolveAwsRegionExtensionConfiguration)(extensionConfiguration),
        ...(0, import_smithy_client5.resolveDefaultRuntimeConfig)(extensionConfiguration),
        ...(0, import_protocol_http8.resolveHttpHandlerRuntimeConfig)(extensionConfiguration),
        ...resolveHttpAuthRuntimeConfig(extensionConfiguration)
      };
    }, "resolveRuntimeExtensions");
    var _SSOOIDCClient = class _SSOOIDCClient extends import_smithy_client5.Client {
      constructor(...[configuration]) {
        const _config_0 = (0, import_runtimeConfig.getRuntimeConfig)(configuration || {});
        const _config_1 = resolveClientEndpointParameters(_config_0);
        const _config_2 = (0, import_middleware_user_agent.resolveUserAgentConfig)(_config_1);
        const _config_3 = (0, import_middleware_retry2.resolveRetryConfig)(_config_2);
        const _config_4 = (0, import_config_resolver.resolveRegionConfig)(_config_3);
        const _config_5 = (0, import_middleware_host_header.resolveHostHeaderConfig)(_config_4);
        const _config_6 = (0, import_middleware_endpoint2.resolveEndpointConfig)(_config_5);
        const _config_7 = (0, import_httpAuthSchemeProvider.resolveHttpAuthSchemeConfig)(_config_6);
        const _config_8 = resolveRuntimeExtensions(_config_7, (configuration == null ? void 0 : configuration.extensions) || []);
        super(_config_8);
        this.config = _config_8;
        this.middlewareStack.use((0, import_middleware_user_agent.getUserAgentPlugin)(this.config));
        this.middlewareStack.use((0, import_middleware_retry2.getRetryPlugin)(this.config));
        this.middlewareStack.use((0, import_middleware_content_length.getContentLengthPlugin)(this.config));
        this.middlewareStack.use((0, import_middleware_host_header.getHostHeaderPlugin)(this.config));
        this.middlewareStack.use((0, import_middleware_logger.getLoggerPlugin)(this.config));
        this.middlewareStack.use((0, import_middleware_recursion_detection.getRecursionDetectionPlugin)(this.config));
        this.middlewareStack.use(
          (0, import_core3.getHttpAuthSchemeEndpointRuleSetPlugin)(this.config, {
            httpAuthSchemeParametersProvider: import_httpAuthSchemeProvider.defaultSSOOIDCHttpAuthSchemeParametersProvider,
            identityProviderConfigProvider: async (config) => new import_core3.DefaultIdentityProviderConfig({
              "aws.auth#sigv4": config.credentials
            })
          })
        );
        this.middlewareStack.use((0, import_core3.getHttpSigningPlugin)(this.config));
      }
      /**
       * Destroy underlying resources, like sockets. It's usually not necessary to do this.
       * However in Node.js, it's best to explicitly shut down the client's agent when it is no longer needed.
       * Otherwise, sockets might stay open for quite a long time before the server terminates them.
       */
      destroy() {
        super.destroy();
      }
    };
    __name(_SSOOIDCClient, "SSOOIDCClient");
    var SSOOIDCClient = _SSOOIDCClient;
    var import_middleware_serde2 = require_dist_cjs17();
    var _SSOOIDCServiceException = class _SSOOIDCServiceException2 extends import_smithy_client5.ServiceException {
      /**
       * @internal
       */
      constructor(options) {
        super(options);
        Object.setPrototypeOf(this, _SSOOIDCServiceException2.prototype);
      }
    };
    __name(_SSOOIDCServiceException, "SSOOIDCServiceException");
    var SSOOIDCServiceException = _SSOOIDCServiceException;
    var _AccessDeniedException = class _AccessDeniedException2 extends SSOOIDCServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "AccessDeniedException",
          $fault: "client",
          ...opts
        });
        this.name = "AccessDeniedException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _AccessDeniedException2.prototype);
        this.error = opts.error;
        this.error_description = opts.error_description;
      }
    };
    __name(_AccessDeniedException, "AccessDeniedException");
    var AccessDeniedException = _AccessDeniedException;
    var _AuthorizationPendingException = class _AuthorizationPendingException2 extends SSOOIDCServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "AuthorizationPendingException",
          $fault: "client",
          ...opts
        });
        this.name = "AuthorizationPendingException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _AuthorizationPendingException2.prototype);
        this.error = opts.error;
        this.error_description = opts.error_description;
      }
    };
    __name(_AuthorizationPendingException, "AuthorizationPendingException");
    var AuthorizationPendingException = _AuthorizationPendingException;
    var _ExpiredTokenException = class _ExpiredTokenException2 extends SSOOIDCServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "ExpiredTokenException",
          $fault: "client",
          ...opts
        });
        this.name = "ExpiredTokenException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _ExpiredTokenException2.prototype);
        this.error = opts.error;
        this.error_description = opts.error_description;
      }
    };
    __name(_ExpiredTokenException, "ExpiredTokenException");
    var ExpiredTokenException = _ExpiredTokenException;
    var _InternalServerException = class _InternalServerException2 extends SSOOIDCServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "InternalServerException",
          $fault: "server",
          ...opts
        });
        this.name = "InternalServerException";
        this.$fault = "server";
        Object.setPrototypeOf(this, _InternalServerException2.prototype);
        this.error = opts.error;
        this.error_description = opts.error_description;
      }
    };
    __name(_InternalServerException, "InternalServerException");
    var InternalServerException = _InternalServerException;
    var _InvalidClientException = class _InvalidClientException2 extends SSOOIDCServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "InvalidClientException",
          $fault: "client",
          ...opts
        });
        this.name = "InvalidClientException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _InvalidClientException2.prototype);
        this.error = opts.error;
        this.error_description = opts.error_description;
      }
    };
    __name(_InvalidClientException, "InvalidClientException");
    var InvalidClientException = _InvalidClientException;
    var _InvalidGrantException = class _InvalidGrantException2 extends SSOOIDCServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "InvalidGrantException",
          $fault: "client",
          ...opts
        });
        this.name = "InvalidGrantException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _InvalidGrantException2.prototype);
        this.error = opts.error;
        this.error_description = opts.error_description;
      }
    };
    __name(_InvalidGrantException, "InvalidGrantException");
    var InvalidGrantException = _InvalidGrantException;
    var _InvalidRequestException = class _InvalidRequestException2 extends SSOOIDCServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "InvalidRequestException",
          $fault: "client",
          ...opts
        });
        this.name = "InvalidRequestException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _InvalidRequestException2.prototype);
        this.error = opts.error;
        this.error_description = opts.error_description;
      }
    };
    __name(_InvalidRequestException, "InvalidRequestException");
    var InvalidRequestException = _InvalidRequestException;
    var _InvalidScopeException = class _InvalidScopeException2 extends SSOOIDCServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "InvalidScopeException",
          $fault: "client",
          ...opts
        });
        this.name = "InvalidScopeException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _InvalidScopeException2.prototype);
        this.error = opts.error;
        this.error_description = opts.error_description;
      }
    };
    __name(_InvalidScopeException, "InvalidScopeException");
    var InvalidScopeException = _InvalidScopeException;
    var _SlowDownException = class _SlowDownException2 extends SSOOIDCServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "SlowDownException",
          $fault: "client",
          ...opts
        });
        this.name = "SlowDownException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _SlowDownException2.prototype);
        this.error = opts.error;
        this.error_description = opts.error_description;
      }
    };
    __name(_SlowDownException, "SlowDownException");
    var SlowDownException = _SlowDownException;
    var _UnauthorizedClientException = class _UnauthorizedClientException2 extends SSOOIDCServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "UnauthorizedClientException",
          $fault: "client",
          ...opts
        });
        this.name = "UnauthorizedClientException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _UnauthorizedClientException2.prototype);
        this.error = opts.error;
        this.error_description = opts.error_description;
      }
    };
    __name(_UnauthorizedClientException, "UnauthorizedClientException");
    var UnauthorizedClientException = _UnauthorizedClientException;
    var _UnsupportedGrantTypeException = class _UnsupportedGrantTypeException2 extends SSOOIDCServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "UnsupportedGrantTypeException",
          $fault: "client",
          ...opts
        });
        this.name = "UnsupportedGrantTypeException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _UnsupportedGrantTypeException2.prototype);
        this.error = opts.error;
        this.error_description = opts.error_description;
      }
    };
    __name(_UnsupportedGrantTypeException, "UnsupportedGrantTypeException");
    var UnsupportedGrantTypeException = _UnsupportedGrantTypeException;
    var _InvalidRequestRegionException = class _InvalidRequestRegionException2 extends SSOOIDCServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "InvalidRequestRegionException",
          $fault: "client",
          ...opts
        });
        this.name = "InvalidRequestRegionException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _InvalidRequestRegionException2.prototype);
        this.error = opts.error;
        this.error_description = opts.error_description;
        this.endpoint = opts.endpoint;
        this.region = opts.region;
      }
    };
    __name(_InvalidRequestRegionException, "InvalidRequestRegionException");
    var InvalidRequestRegionException = _InvalidRequestRegionException;
    var _InvalidClientMetadataException = class _InvalidClientMetadataException2 extends SSOOIDCServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "InvalidClientMetadataException",
          $fault: "client",
          ...opts
        });
        this.name = "InvalidClientMetadataException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _InvalidClientMetadataException2.prototype);
        this.error = opts.error;
        this.error_description = opts.error_description;
      }
    };
    __name(_InvalidClientMetadataException, "InvalidClientMetadataException");
    var InvalidClientMetadataException = _InvalidClientMetadataException;
    var _InvalidRedirectUriException = class _InvalidRedirectUriException2 extends SSOOIDCServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "InvalidRedirectUriException",
          $fault: "client",
          ...opts
        });
        this.name = "InvalidRedirectUriException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _InvalidRedirectUriException2.prototype);
        this.error = opts.error;
        this.error_description = opts.error_description;
      }
    };
    __name(_InvalidRedirectUriException, "InvalidRedirectUriException");
    var InvalidRedirectUriException = _InvalidRedirectUriException;
    var CreateTokenRequestFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.clientSecret && { clientSecret: import_smithy_client5.SENSITIVE_STRING },
      ...obj.refreshToken && { refreshToken: import_smithy_client5.SENSITIVE_STRING },
      ...obj.codeVerifier && { codeVerifier: import_smithy_client5.SENSITIVE_STRING }
    }), "CreateTokenRequestFilterSensitiveLog");
    var CreateTokenResponseFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.accessToken && { accessToken: import_smithy_client5.SENSITIVE_STRING },
      ...obj.refreshToken && { refreshToken: import_smithy_client5.SENSITIVE_STRING },
      ...obj.idToken && { idToken: import_smithy_client5.SENSITIVE_STRING }
    }), "CreateTokenResponseFilterSensitiveLog");
    var CreateTokenWithIAMRequestFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.refreshToken && { refreshToken: import_smithy_client5.SENSITIVE_STRING },
      ...obj.assertion && { assertion: import_smithy_client5.SENSITIVE_STRING },
      ...obj.subjectToken && { subjectToken: import_smithy_client5.SENSITIVE_STRING },
      ...obj.codeVerifier && { codeVerifier: import_smithy_client5.SENSITIVE_STRING }
    }), "CreateTokenWithIAMRequestFilterSensitiveLog");
    var CreateTokenWithIAMResponseFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.accessToken && { accessToken: import_smithy_client5.SENSITIVE_STRING },
      ...obj.refreshToken && { refreshToken: import_smithy_client5.SENSITIVE_STRING },
      ...obj.idToken && { idToken: import_smithy_client5.SENSITIVE_STRING }
    }), "CreateTokenWithIAMResponseFilterSensitiveLog");
    var RegisterClientResponseFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.clientSecret && { clientSecret: import_smithy_client5.SENSITIVE_STRING }
    }), "RegisterClientResponseFilterSensitiveLog");
    var StartDeviceAuthorizationRequestFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.clientSecret && { clientSecret: import_smithy_client5.SENSITIVE_STRING }
    }), "StartDeviceAuthorizationRequestFilterSensitiveLog");
    var import_core22 = (init_dist_es2(), __toCommonJS(dist_es_exports2));
    var se_CreateTokenCommand = /* @__PURE__ */ __name(async (input, context) => {
      const b = (0, import_core3.requestBuilder)(input, context);
      const headers = {
        "content-type": "application/json"
      };
      b.bp("/token");
      let body;
      body = JSON.stringify(
        (0, import_smithy_client5.take)(input, {
          clientId: [],
          clientSecret: [],
          code: [],
          codeVerifier: [],
          deviceCode: [],
          grantType: [],
          redirectUri: [],
          refreshToken: [],
          scope: (_) => (0, import_smithy_client5._json)(_)
        })
      );
      b.m("POST").h(headers).b(body);
      return b.build();
    }, "se_CreateTokenCommand");
    var se_CreateTokenWithIAMCommand = /* @__PURE__ */ __name(async (input, context) => {
      const b = (0, import_core3.requestBuilder)(input, context);
      const headers = {
        "content-type": "application/json"
      };
      b.bp("/token");
      const query2 = (0, import_smithy_client5.map)({
        [_ai]: [, "t"]
      });
      let body;
      body = JSON.stringify(
        (0, import_smithy_client5.take)(input, {
          assertion: [],
          clientId: [],
          code: [],
          codeVerifier: [],
          grantType: [],
          redirectUri: [],
          refreshToken: [],
          requestedTokenType: [],
          scope: (_) => (0, import_smithy_client5._json)(_),
          subjectToken: [],
          subjectTokenType: []
        })
      );
      b.m("POST").h(headers).q(query2).b(body);
      return b.build();
    }, "se_CreateTokenWithIAMCommand");
    var se_RegisterClientCommand = /* @__PURE__ */ __name(async (input, context) => {
      const b = (0, import_core3.requestBuilder)(input, context);
      const headers = {
        "content-type": "application/json"
      };
      b.bp("/client/register");
      let body;
      body = JSON.stringify(
        (0, import_smithy_client5.take)(input, {
          clientName: [],
          clientType: [],
          entitledApplicationArn: [],
          grantTypes: (_) => (0, import_smithy_client5._json)(_),
          issuerUrl: [],
          redirectUris: (_) => (0, import_smithy_client5._json)(_),
          scopes: (_) => (0, import_smithy_client5._json)(_)
        })
      );
      b.m("POST").h(headers).b(body);
      return b.build();
    }, "se_RegisterClientCommand");
    var se_StartDeviceAuthorizationCommand = /* @__PURE__ */ __name(async (input, context) => {
      const b = (0, import_core3.requestBuilder)(input, context);
      const headers = {
        "content-type": "application/json"
      };
      b.bp("/device_authorization");
      let body;
      body = JSON.stringify(
        (0, import_smithy_client5.take)(input, {
          clientId: [],
          clientSecret: [],
          startUrl: []
        })
      );
      b.m("POST").h(headers).b(body);
      return b.build();
    }, "se_StartDeviceAuthorizationCommand");
    var de_CreateTokenCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const contents = (0, import_smithy_client5.map)({
        $metadata: deserializeMetadata(output)
      });
      const data = (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.expectObject)(await (0, import_core22.parseJsonBody)(output.body, context)), "body");
      const doc = (0, import_smithy_client5.take)(data, {
        accessToken: import_smithy_client5.expectString,
        expiresIn: import_smithy_client5.expectInt32,
        idToken: import_smithy_client5.expectString,
        refreshToken: import_smithy_client5.expectString,
        tokenType: import_smithy_client5.expectString
      });
      Object.assign(contents, doc);
      return contents;
    }, "de_CreateTokenCommand");
    var de_CreateTokenWithIAMCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const contents = (0, import_smithy_client5.map)({
        $metadata: deserializeMetadata(output)
      });
      const data = (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.expectObject)(await (0, import_core22.parseJsonBody)(output.body, context)), "body");
      const doc = (0, import_smithy_client5.take)(data, {
        accessToken: import_smithy_client5.expectString,
        expiresIn: import_smithy_client5.expectInt32,
        idToken: import_smithy_client5.expectString,
        issuedTokenType: import_smithy_client5.expectString,
        refreshToken: import_smithy_client5.expectString,
        scope: import_smithy_client5._json,
        tokenType: import_smithy_client5.expectString
      });
      Object.assign(contents, doc);
      return contents;
    }, "de_CreateTokenWithIAMCommand");
    var de_RegisterClientCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const contents = (0, import_smithy_client5.map)({
        $metadata: deserializeMetadata(output)
      });
      const data = (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.expectObject)(await (0, import_core22.parseJsonBody)(output.body, context)), "body");
      const doc = (0, import_smithy_client5.take)(data, {
        authorizationEndpoint: import_smithy_client5.expectString,
        clientId: import_smithy_client5.expectString,
        clientIdIssuedAt: import_smithy_client5.expectLong,
        clientSecret: import_smithy_client5.expectString,
        clientSecretExpiresAt: import_smithy_client5.expectLong,
        tokenEndpoint: import_smithy_client5.expectString
      });
      Object.assign(contents, doc);
      return contents;
    }, "de_RegisterClientCommand");
    var de_StartDeviceAuthorizationCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode !== 200 && output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const contents = (0, import_smithy_client5.map)({
        $metadata: deserializeMetadata(output)
      });
      const data = (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.expectObject)(await (0, import_core22.parseJsonBody)(output.body, context)), "body");
      const doc = (0, import_smithy_client5.take)(data, {
        deviceCode: import_smithy_client5.expectString,
        expiresIn: import_smithy_client5.expectInt32,
        interval: import_smithy_client5.expectInt32,
        userCode: import_smithy_client5.expectString,
        verificationUri: import_smithy_client5.expectString,
        verificationUriComplete: import_smithy_client5.expectString
      });
      Object.assign(contents, doc);
      return contents;
    }, "de_StartDeviceAuthorizationCommand");
    var de_CommandError = /* @__PURE__ */ __name(async (output, context) => {
      const parsedOutput = {
        ...output,
        body: await (0, import_core22.parseJsonErrorBody)(output.body, context)
      };
      const errorCode = (0, import_core22.loadRestJsonErrorCode)(output, parsedOutput.body);
      switch (errorCode) {
        case "AccessDeniedException":
        case "com.amazonaws.ssooidc#AccessDeniedException":
          throw await de_AccessDeniedExceptionRes(parsedOutput, context);
        case "AuthorizationPendingException":
        case "com.amazonaws.ssooidc#AuthorizationPendingException":
          throw await de_AuthorizationPendingExceptionRes(parsedOutput, context);
        case "ExpiredTokenException":
        case "com.amazonaws.ssooidc#ExpiredTokenException":
          throw await de_ExpiredTokenExceptionRes(parsedOutput, context);
        case "InternalServerException":
        case "com.amazonaws.ssooidc#InternalServerException":
          throw await de_InternalServerExceptionRes(parsedOutput, context);
        case "InvalidClientException":
        case "com.amazonaws.ssooidc#InvalidClientException":
          throw await de_InvalidClientExceptionRes(parsedOutput, context);
        case "InvalidGrantException":
        case "com.amazonaws.ssooidc#InvalidGrantException":
          throw await de_InvalidGrantExceptionRes(parsedOutput, context);
        case "InvalidRequestException":
        case "com.amazonaws.ssooidc#InvalidRequestException":
          throw await de_InvalidRequestExceptionRes(parsedOutput, context);
        case "InvalidScopeException":
        case "com.amazonaws.ssooidc#InvalidScopeException":
          throw await de_InvalidScopeExceptionRes(parsedOutput, context);
        case "SlowDownException":
        case "com.amazonaws.ssooidc#SlowDownException":
          throw await de_SlowDownExceptionRes(parsedOutput, context);
        case "UnauthorizedClientException":
        case "com.amazonaws.ssooidc#UnauthorizedClientException":
          throw await de_UnauthorizedClientExceptionRes(parsedOutput, context);
        case "UnsupportedGrantTypeException":
        case "com.amazonaws.ssooidc#UnsupportedGrantTypeException":
          throw await de_UnsupportedGrantTypeExceptionRes(parsedOutput, context);
        case "InvalidRequestRegionException":
        case "com.amazonaws.ssooidc#InvalidRequestRegionException":
          throw await de_InvalidRequestRegionExceptionRes(parsedOutput, context);
        case "InvalidClientMetadataException":
        case "com.amazonaws.ssooidc#InvalidClientMetadataException":
          throw await de_InvalidClientMetadataExceptionRes(parsedOutput, context);
        case "InvalidRedirectUriException":
        case "com.amazonaws.ssooidc#InvalidRedirectUriException":
          throw await de_InvalidRedirectUriExceptionRes(parsedOutput, context);
        default:
          const parsedBody = parsedOutput.body;
          return throwDefaultError({
            output,
            parsedBody,
            errorCode
          });
      }
    }, "de_CommandError");
    var throwDefaultError = (0, import_smithy_client5.withBaseException)(SSOOIDCServiceException);
    var de_AccessDeniedExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const contents = (0, import_smithy_client5.map)({});
      const data = parsedOutput.body;
      const doc = (0, import_smithy_client5.take)(data, {
        error: import_smithy_client5.expectString,
        error_description: import_smithy_client5.expectString
      });
      Object.assign(contents, doc);
      const exception = new AccessDeniedException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, parsedOutput.body);
    }, "de_AccessDeniedExceptionRes");
    var de_AuthorizationPendingExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const contents = (0, import_smithy_client5.map)({});
      const data = parsedOutput.body;
      const doc = (0, import_smithy_client5.take)(data, {
        error: import_smithy_client5.expectString,
        error_description: import_smithy_client5.expectString
      });
      Object.assign(contents, doc);
      const exception = new AuthorizationPendingException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, parsedOutput.body);
    }, "de_AuthorizationPendingExceptionRes");
    var de_ExpiredTokenExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const contents = (0, import_smithy_client5.map)({});
      const data = parsedOutput.body;
      const doc = (0, import_smithy_client5.take)(data, {
        error: import_smithy_client5.expectString,
        error_description: import_smithy_client5.expectString
      });
      Object.assign(contents, doc);
      const exception = new ExpiredTokenException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, parsedOutput.body);
    }, "de_ExpiredTokenExceptionRes");
    var de_InternalServerExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const contents = (0, import_smithy_client5.map)({});
      const data = parsedOutput.body;
      const doc = (0, import_smithy_client5.take)(data, {
        error: import_smithy_client5.expectString,
        error_description: import_smithy_client5.expectString
      });
      Object.assign(contents, doc);
      const exception = new InternalServerException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, parsedOutput.body);
    }, "de_InternalServerExceptionRes");
    var de_InvalidClientExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const contents = (0, import_smithy_client5.map)({});
      const data = parsedOutput.body;
      const doc = (0, import_smithy_client5.take)(data, {
        error: import_smithy_client5.expectString,
        error_description: import_smithy_client5.expectString
      });
      Object.assign(contents, doc);
      const exception = new InvalidClientException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, parsedOutput.body);
    }, "de_InvalidClientExceptionRes");
    var de_InvalidClientMetadataExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const contents = (0, import_smithy_client5.map)({});
      const data = parsedOutput.body;
      const doc = (0, import_smithy_client5.take)(data, {
        error: import_smithy_client5.expectString,
        error_description: import_smithy_client5.expectString
      });
      Object.assign(contents, doc);
      const exception = new InvalidClientMetadataException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, parsedOutput.body);
    }, "de_InvalidClientMetadataExceptionRes");
    var de_InvalidGrantExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const contents = (0, import_smithy_client5.map)({});
      const data = parsedOutput.body;
      const doc = (0, import_smithy_client5.take)(data, {
        error: import_smithy_client5.expectString,
        error_description: import_smithy_client5.expectString
      });
      Object.assign(contents, doc);
      const exception = new InvalidGrantException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, parsedOutput.body);
    }, "de_InvalidGrantExceptionRes");
    var de_InvalidRedirectUriExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const contents = (0, import_smithy_client5.map)({});
      const data = parsedOutput.body;
      const doc = (0, import_smithy_client5.take)(data, {
        error: import_smithy_client5.expectString,
        error_description: import_smithy_client5.expectString
      });
      Object.assign(contents, doc);
      const exception = new InvalidRedirectUriException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, parsedOutput.body);
    }, "de_InvalidRedirectUriExceptionRes");
    var de_InvalidRequestExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const contents = (0, import_smithy_client5.map)({});
      const data = parsedOutput.body;
      const doc = (0, import_smithy_client5.take)(data, {
        error: import_smithy_client5.expectString,
        error_description: import_smithy_client5.expectString
      });
      Object.assign(contents, doc);
      const exception = new InvalidRequestException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, parsedOutput.body);
    }, "de_InvalidRequestExceptionRes");
    var de_InvalidRequestRegionExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const contents = (0, import_smithy_client5.map)({});
      const data = parsedOutput.body;
      const doc = (0, import_smithy_client5.take)(data, {
        endpoint: import_smithy_client5.expectString,
        error: import_smithy_client5.expectString,
        error_description: import_smithy_client5.expectString,
        region: import_smithy_client5.expectString
      });
      Object.assign(contents, doc);
      const exception = new InvalidRequestRegionException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, parsedOutput.body);
    }, "de_InvalidRequestRegionExceptionRes");
    var de_InvalidScopeExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const contents = (0, import_smithy_client5.map)({});
      const data = parsedOutput.body;
      const doc = (0, import_smithy_client5.take)(data, {
        error: import_smithy_client5.expectString,
        error_description: import_smithy_client5.expectString
      });
      Object.assign(contents, doc);
      const exception = new InvalidScopeException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, parsedOutput.body);
    }, "de_InvalidScopeExceptionRes");
    var de_SlowDownExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const contents = (0, import_smithy_client5.map)({});
      const data = parsedOutput.body;
      const doc = (0, import_smithy_client5.take)(data, {
        error: import_smithy_client5.expectString,
        error_description: import_smithy_client5.expectString
      });
      Object.assign(contents, doc);
      const exception = new SlowDownException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, parsedOutput.body);
    }, "de_SlowDownExceptionRes");
    var de_UnauthorizedClientExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const contents = (0, import_smithy_client5.map)({});
      const data = parsedOutput.body;
      const doc = (0, import_smithy_client5.take)(data, {
        error: import_smithy_client5.expectString,
        error_description: import_smithy_client5.expectString
      });
      Object.assign(contents, doc);
      const exception = new UnauthorizedClientException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, parsedOutput.body);
    }, "de_UnauthorizedClientExceptionRes");
    var de_UnsupportedGrantTypeExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const contents = (0, import_smithy_client5.map)({});
      const data = parsedOutput.body;
      const doc = (0, import_smithy_client5.take)(data, {
        error: import_smithy_client5.expectString,
        error_description: import_smithy_client5.expectString
      });
      Object.assign(contents, doc);
      const exception = new UnsupportedGrantTypeException({
        $metadata: deserializeMetadata(parsedOutput),
        ...contents
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, parsedOutput.body);
    }, "de_UnsupportedGrantTypeExceptionRes");
    var deserializeMetadata = /* @__PURE__ */ __name((output) => ({
      httpStatusCode: output.statusCode,
      requestId: output.headers["x-amzn-requestid"] ?? output.headers["x-amzn-request-id"] ?? output.headers["x-amz-request-id"],
      extendedRequestId: output.headers["x-amz-id-2"],
      cfId: output.headers["x-amz-cf-id"]
    }), "deserializeMetadata");
    var _ai = "aws_iam";
    var _CreateTokenCommand = class _CreateTokenCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("AWSSSOOIDCService", "CreateToken", {}).n("SSOOIDCClient", "CreateTokenCommand").f(CreateTokenRequestFilterSensitiveLog, CreateTokenResponseFilterSensitiveLog).ser(se_CreateTokenCommand).de(de_CreateTokenCommand).build() {
    };
    __name(_CreateTokenCommand, "CreateTokenCommand");
    var CreateTokenCommand = _CreateTokenCommand;
    var _CreateTokenWithIAMCommand = class _CreateTokenWithIAMCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("AWSSSOOIDCService", "CreateTokenWithIAM", {}).n("SSOOIDCClient", "CreateTokenWithIAMCommand").f(CreateTokenWithIAMRequestFilterSensitiveLog, CreateTokenWithIAMResponseFilterSensitiveLog).ser(se_CreateTokenWithIAMCommand).de(de_CreateTokenWithIAMCommand).build() {
    };
    __name(_CreateTokenWithIAMCommand, "CreateTokenWithIAMCommand");
    var CreateTokenWithIAMCommand = _CreateTokenWithIAMCommand;
    var _RegisterClientCommand = class _RegisterClientCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("AWSSSOOIDCService", "RegisterClient", {}).n("SSOOIDCClient", "RegisterClientCommand").f(void 0, RegisterClientResponseFilterSensitiveLog).ser(se_RegisterClientCommand).de(de_RegisterClientCommand).build() {
    };
    __name(_RegisterClientCommand, "RegisterClientCommand");
    var RegisterClientCommand = _RegisterClientCommand;
    var _StartDeviceAuthorizationCommand = class _StartDeviceAuthorizationCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("AWSSSOOIDCService", "StartDeviceAuthorization", {}).n("SSOOIDCClient", "StartDeviceAuthorizationCommand").f(StartDeviceAuthorizationRequestFilterSensitiveLog, void 0).ser(se_StartDeviceAuthorizationCommand).de(de_StartDeviceAuthorizationCommand).build() {
    };
    __name(_StartDeviceAuthorizationCommand, "StartDeviceAuthorizationCommand");
    var StartDeviceAuthorizationCommand = _StartDeviceAuthorizationCommand;
    var commands = {
      CreateTokenCommand,
      CreateTokenWithIAMCommand,
      RegisterClientCommand,
      StartDeviceAuthorizationCommand
    };
    var _SSOOIDC = class _SSOOIDC extends SSOOIDCClient {
    };
    __name(_SSOOIDC, "SSOOIDC");
    var SSOOIDC = _SSOOIDC;
    (0, import_smithy_client5.createAggregatedClient)(commands, SSOOIDC);
  }
});

// node_modules/@aws-sdk/token-providers/dist-cjs/index.js
var require_dist_cjs46 = __commonJS({
  "node_modules/@aws-sdk/token-providers/dist-cjs/index.js"(exports2, module2) {
    "use strict";
    var __create2 = Object.create;
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf2 = Object.getPrototypeOf;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      fromSso: () => fromSso,
      fromStatic: () => fromStatic,
      nodeProvider: () => nodeProvider
    });
    module2.exports = __toCommonJS2(src_exports);
    var EXPIRE_WINDOW_MS = 5 * 60 * 1e3;
    var REFRESH_MESSAGE = `To refresh this SSO session run 'aws sso login' with the corresponding profile.`;
    var ssoOidcClientsHash = {};
    var getSsoOidcClient = /* @__PURE__ */ __name(async (ssoRegion) => {
      const { SSOOIDCClient } = await Promise.resolve().then(() => __toESM2(require_dist_cjs45()));
      if (ssoOidcClientsHash[ssoRegion]) {
        return ssoOidcClientsHash[ssoRegion];
      }
      const ssoOidcClient = new SSOOIDCClient({ region: ssoRegion });
      ssoOidcClientsHash[ssoRegion] = ssoOidcClient;
      return ssoOidcClient;
    }, "getSsoOidcClient");
    var getNewSsoOidcToken = /* @__PURE__ */ __name(async (ssoToken, ssoRegion) => {
      const { CreateTokenCommand } = await Promise.resolve().then(() => __toESM2(require_dist_cjs45()));
      const ssoOidcClient = await getSsoOidcClient(ssoRegion);
      return ssoOidcClient.send(
        new CreateTokenCommand({
          clientId: ssoToken.clientId,
          clientSecret: ssoToken.clientSecret,
          refreshToken: ssoToken.refreshToken,
          grantType: "refresh_token"
        })
      );
    }, "getNewSsoOidcToken");
    var import_property_provider2 = require_dist_cjs12();
    var validateTokenExpiry = /* @__PURE__ */ __name((token) => {
      if (token.expiration && token.expiration.getTime() < Date.now()) {
        throw new import_property_provider2.TokenProviderError(`Token is expired. ${REFRESH_MESSAGE}`, false);
      }
    }, "validateTokenExpiry");
    var validateTokenKey = /* @__PURE__ */ __name((key, value, forRefresh = false) => {
      if (typeof value === "undefined") {
        throw new import_property_provider2.TokenProviderError(
          `Value not present for '${key}' in SSO Token${forRefresh ? ". Cannot refresh" : ""}. ${REFRESH_MESSAGE}`,
          false
        );
      }
    }, "validateTokenKey");
    var import_shared_ini_file_loader = require_dist_cjs13();
    var import_fs = require("fs");
    var { writeFile } = import_fs.promises;
    var writeSSOTokenToFile = /* @__PURE__ */ __name((id, ssoToken) => {
      const tokenFilepath = (0, import_shared_ini_file_loader.getSSOTokenFilepath)(id);
      const tokenString = JSON.stringify(ssoToken, null, 2);
      return writeFile(tokenFilepath, tokenString);
    }, "writeSSOTokenToFile");
    var lastRefreshAttemptTime = /* @__PURE__ */ new Date(0);
    var fromSso = /* @__PURE__ */ __name((init = {}) => async () => {
      var _a;
      (_a = init.logger) == null ? void 0 : _a.debug("@aws-sdk/token-providers - fromSso");
      const profiles = await (0, import_shared_ini_file_loader.parseKnownFiles)(init);
      const profileName = (0, import_shared_ini_file_loader.getProfileName)(init);
      const profile = profiles[profileName];
      if (!profile) {
        throw new import_property_provider2.TokenProviderError(`Profile '${profileName}' could not be found in shared credentials file.`, false);
      } else if (!profile["sso_session"]) {
        throw new import_property_provider2.TokenProviderError(`Profile '${profileName}' is missing required property 'sso_session'.`);
      }
      const ssoSessionName = profile["sso_session"];
      const ssoSessions = await (0, import_shared_ini_file_loader.loadSsoSessionData)(init);
      const ssoSession = ssoSessions[ssoSessionName];
      if (!ssoSession) {
        throw new import_property_provider2.TokenProviderError(
          `Sso session '${ssoSessionName}' could not be found in shared credentials file.`,
          false
        );
      }
      for (const ssoSessionRequiredKey of ["sso_start_url", "sso_region"]) {
        if (!ssoSession[ssoSessionRequiredKey]) {
          throw new import_property_provider2.TokenProviderError(
            `Sso session '${ssoSessionName}' is missing required property '${ssoSessionRequiredKey}'.`,
            false
          );
        }
      }
      const ssoStartUrl = ssoSession["sso_start_url"];
      const ssoRegion = ssoSession["sso_region"];
      let ssoToken;
      try {
        ssoToken = await (0, import_shared_ini_file_loader.getSSOTokenFromFile)(ssoSessionName);
      } catch (e) {
        throw new import_property_provider2.TokenProviderError(
          `The SSO session token associated with profile=${profileName} was not found or is invalid. ${REFRESH_MESSAGE}`,
          false
        );
      }
      validateTokenKey("accessToken", ssoToken.accessToken);
      validateTokenKey("expiresAt", ssoToken.expiresAt);
      const { accessToken, expiresAt } = ssoToken;
      const existingToken = { token: accessToken, expiration: new Date(expiresAt) };
      if (existingToken.expiration.getTime() - Date.now() > EXPIRE_WINDOW_MS) {
        return existingToken;
      }
      if (Date.now() - lastRefreshAttemptTime.getTime() < 30 * 1e3) {
        validateTokenExpiry(existingToken);
        return existingToken;
      }
      validateTokenKey("clientId", ssoToken.clientId, true);
      validateTokenKey("clientSecret", ssoToken.clientSecret, true);
      validateTokenKey("refreshToken", ssoToken.refreshToken, true);
      try {
        lastRefreshAttemptTime.setTime(Date.now());
        const newSsoOidcToken = await getNewSsoOidcToken(ssoToken, ssoRegion);
        validateTokenKey("accessToken", newSsoOidcToken.accessToken);
        validateTokenKey("expiresIn", newSsoOidcToken.expiresIn);
        const newTokenExpiration = new Date(Date.now() + newSsoOidcToken.expiresIn * 1e3);
        try {
          await writeSSOTokenToFile(ssoSessionName, {
            ...ssoToken,
            accessToken: newSsoOidcToken.accessToken,
            expiresAt: newTokenExpiration.toISOString(),
            refreshToken: newSsoOidcToken.refreshToken
          });
        } catch (error) {
        }
        return {
          token: newSsoOidcToken.accessToken,
          expiration: newTokenExpiration
        };
      } catch (error) {
        validateTokenExpiry(existingToken);
        return existingToken;
      }
    }, "fromSso");
    var fromStatic = /* @__PURE__ */ __name(({ token, logger }) => async () => {
      logger == null ? void 0 : logger.debug("@aws-sdk/token-providers - fromStatic");
      if (!token || !token.token) {
        throw new import_property_provider2.TokenProviderError(`Please pass a valid token to fromStatic`, false);
      }
      return token;
    }, "fromStatic");
    var nodeProvider = /* @__PURE__ */ __name((init = {}) => (0, import_property_provider2.memoize)(
      (0, import_property_provider2.chain)(fromSso(init), async () => {
        throw new import_property_provider2.TokenProviderError("Could not load token from any providers", false);
      }),
      (token) => token.expiration !== void 0 && token.expiration.getTime() - Date.now() < 3e5,
      (token) => token.expiration !== void 0
    ), "nodeProvider");
  }
});

// node_modules/@aws-sdk/credential-provider-sso/dist-cjs/index.js
var require_dist_cjs47 = __commonJS({
  "node_modules/@aws-sdk/credential-provider-sso/dist-cjs/index.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __esm2 = (fn, res) => function __init() {
      return fn && (res = (0, fn[__getOwnPropNames2(fn)[0]])(fn = 0)), res;
    };
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var loadSso_exports = {};
    __export2(loadSso_exports, {
      GetRoleCredentialsCommand: () => import_client_sso.GetRoleCredentialsCommand,
      SSOClient: () => import_client_sso.SSOClient
    });
    var import_client_sso;
    var init_loadSso = __esm2({
      "src/loadSso.ts"() {
        "use strict";
        import_client_sso = require_dist_cjs44();
      }
    });
    var src_exports = {};
    __export2(src_exports, {
      fromSSO: () => fromSSO,
      isSsoProfile: () => isSsoProfile,
      validateSsoProfile: () => validateSsoProfile
    });
    module2.exports = __toCommonJS2(src_exports);
    var isSsoProfile = /* @__PURE__ */ __name((arg) => arg && (typeof arg.sso_start_url === "string" || typeof arg.sso_account_id === "string" || typeof arg.sso_session === "string" || typeof arg.sso_region === "string" || typeof arg.sso_role_name === "string"), "isSsoProfile");
    var import_token_providers = require_dist_cjs46();
    var import_property_provider2 = require_dist_cjs12();
    var import_shared_ini_file_loader = require_dist_cjs13();
    var SHOULD_FAIL_CREDENTIAL_CHAIN = false;
    var resolveSSOCredentials = /* @__PURE__ */ __name(async ({
      ssoStartUrl,
      ssoSession,
      ssoAccountId,
      ssoRegion,
      ssoRoleName,
      ssoClient,
      clientConfig,
      profile,
      logger
    }) => {
      let token;
      const refreshMessage = `To refresh this SSO session run aws sso login with the corresponding profile.`;
      if (ssoSession) {
        try {
          const _token = await (0, import_token_providers.fromSso)({ profile })();
          token = {
            accessToken: _token.token,
            expiresAt: new Date(_token.expiration).toISOString()
          };
        } catch (e) {
          throw new import_property_provider2.CredentialsProviderError(e.message, {
            tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
            logger
          });
        }
      } else {
        try {
          token = await (0, import_shared_ini_file_loader.getSSOTokenFromFile)(ssoStartUrl);
        } catch (e) {
          throw new import_property_provider2.CredentialsProviderError(`The SSO session associated with this profile is invalid. ${refreshMessage}`, {
            tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
            logger
          });
        }
      }
      if (new Date(token.expiresAt).getTime() - Date.now() <= 0) {
        throw new import_property_provider2.CredentialsProviderError(`The SSO session associated with this profile has expired. ${refreshMessage}`, {
          tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
          logger
        });
      }
      const { accessToken } = token;
      const { SSOClient: SSOClient2, GetRoleCredentialsCommand: GetRoleCredentialsCommand2 } = await Promise.resolve().then(() => (init_loadSso(), loadSso_exports));
      const sso = ssoClient || new SSOClient2(
        Object.assign({}, clientConfig ?? {}, {
          region: (clientConfig == null ? void 0 : clientConfig.region) ?? ssoRegion
        })
      );
      let ssoResp;
      try {
        ssoResp = await sso.send(
          new GetRoleCredentialsCommand2({
            accountId: ssoAccountId,
            roleName: ssoRoleName,
            accessToken
          })
        );
      } catch (e) {
        throw new import_property_provider2.CredentialsProviderError(e, {
          tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
          logger
        });
      }
      const {
        roleCredentials: { accessKeyId, secretAccessKey, sessionToken, expiration, credentialScope, accountId } = {}
      } = ssoResp;
      if (!accessKeyId || !secretAccessKey || !sessionToken || !expiration) {
        throw new import_property_provider2.CredentialsProviderError("SSO returns an invalid temporary credential.", {
          tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
          logger
        });
      }
      return {
        accessKeyId,
        secretAccessKey,
        sessionToken,
        expiration: new Date(expiration),
        ...credentialScope && { credentialScope },
        ...accountId && { accountId }
      };
    }, "resolveSSOCredentials");
    var validateSsoProfile = /* @__PURE__ */ __name((profile, logger) => {
      const { sso_start_url, sso_account_id, sso_region, sso_role_name } = profile;
      if (!sso_start_url || !sso_account_id || !sso_region || !sso_role_name) {
        throw new import_property_provider2.CredentialsProviderError(
          `Profile is configured with invalid SSO credentials. Required parameters "sso_account_id", "sso_region", "sso_role_name", "sso_start_url". Got ${Object.keys(profile).join(
            ", "
          )}
Reference: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html`,
          { tryNextLink: false, logger }
        );
      }
      return profile;
    }, "validateSsoProfile");
    var fromSSO = /* @__PURE__ */ __name((init = {}) => async () => {
      var _a;
      (_a = init.logger) == null ? void 0 : _a.debug("@aws-sdk/credential-provider-sso - fromSSO");
      const { ssoStartUrl, ssoAccountId, ssoRegion, ssoRoleName, ssoSession } = init;
      const { ssoClient } = init;
      const profileName = (0, import_shared_ini_file_loader.getProfileName)(init);
      if (!ssoStartUrl && !ssoAccountId && !ssoRegion && !ssoRoleName && !ssoSession) {
        const profiles = await (0, import_shared_ini_file_loader.parseKnownFiles)(init);
        const profile = profiles[profileName];
        if (!profile) {
          throw new import_property_provider2.CredentialsProviderError(`Profile ${profileName} was not found.`, { logger: init.logger });
        }
        if (!isSsoProfile(profile)) {
          throw new import_property_provider2.CredentialsProviderError(`Profile ${profileName} is not configured with SSO credentials.`, {
            logger: init.logger
          });
        }
        if (profile == null ? void 0 : profile.sso_session) {
          const ssoSessions = await (0, import_shared_ini_file_loader.loadSsoSessionData)(init);
          const session = ssoSessions[profile.sso_session];
          const conflictMsg = ` configurations in profile ${profileName} and sso-session ${profile.sso_session}`;
          if (ssoRegion && ssoRegion !== session.sso_region) {
            throw new import_property_provider2.CredentialsProviderError(`Conflicting SSO region` + conflictMsg, {
              tryNextLink: false,
              logger: init.logger
            });
          }
          if (ssoStartUrl && ssoStartUrl !== session.sso_start_url) {
            throw new import_property_provider2.CredentialsProviderError(`Conflicting SSO start_url` + conflictMsg, {
              tryNextLink: false,
              logger: init.logger
            });
          }
          profile.sso_region = session.sso_region;
          profile.sso_start_url = session.sso_start_url;
        }
        const { sso_start_url, sso_account_id, sso_region, sso_role_name, sso_session } = validateSsoProfile(
          profile,
          init.logger
        );
        return resolveSSOCredentials({
          ssoStartUrl: sso_start_url,
          ssoSession: sso_session,
          ssoAccountId: sso_account_id,
          ssoRegion: sso_region,
          ssoRoleName: sso_role_name,
          ssoClient,
          clientConfig: init.clientConfig,
          profile: profileName
        });
      } else if (!ssoStartUrl || !ssoAccountId || !ssoRegion || !ssoRoleName) {
        throw new import_property_provider2.CredentialsProviderError(
          'Incomplete configuration. The fromSSO() argument hash must include "ssoStartUrl", "ssoAccountId", "ssoRegion", "ssoRoleName"',
          { tryNextLink: false, logger: init.logger }
        );
      } else {
        return resolveSSOCredentials({
          ssoStartUrl,
          ssoSession,
          ssoAccountId,
          ssoRegion,
          ssoRoleName,
          ssoClient,
          clientConfig: init.clientConfig,
          profile: profileName
        });
      }
    }, "fromSSO");
  }
});

// node_modules/@aws-sdk/client-sts/dist-cjs/auth/httpAuthSchemeProvider.js
var require_httpAuthSchemeProvider4 = __commonJS({
  "node_modules/@aws-sdk/client-sts/dist-cjs/auth/httpAuthSchemeProvider.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.resolveHttpAuthSchemeConfig = exports2.resolveStsAuthConfig = exports2.defaultSTSHttpAuthSchemeProvider = exports2.defaultSTSHttpAuthSchemeParametersProvider = void 0;
    var core_1 = (init_dist_es2(), __toCommonJS(dist_es_exports2));
    var util_middleware_1 = require_dist_cjs10();
    var STSClient_1 = require_STSClient();
    var defaultSTSHttpAuthSchemeParametersProvider = async (config, context, input) => {
      return {
        operation: (0, util_middleware_1.getSmithyContext)(context).operation,
        region: await (0, util_middleware_1.normalizeProvider)(config.region)() || (() => {
          throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
        })()
      };
    };
    exports2.defaultSTSHttpAuthSchemeParametersProvider = defaultSTSHttpAuthSchemeParametersProvider;
    function createAwsAuthSigv4HttpAuthOption(authParameters) {
      return {
        schemeId: "aws.auth#sigv4",
        signingProperties: {
          name: "sts",
          region: authParameters.region
        },
        propertiesExtractor: (config, context) => ({
          signingProperties: {
            config,
            context
          }
        })
      };
    }
    function createSmithyApiNoAuthHttpAuthOption(authParameters) {
      return {
        schemeId: "smithy.api#noAuth"
      };
    }
    var defaultSTSHttpAuthSchemeProvider = (authParameters) => {
      const options = [];
      switch (authParameters.operation) {
        case "AssumeRoleWithSAML": {
          options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
          break;
        }
        case "AssumeRoleWithWebIdentity": {
          options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
          break;
        }
        default: {
          options.push(createAwsAuthSigv4HttpAuthOption(authParameters));
        }
      }
      return options;
    };
    exports2.defaultSTSHttpAuthSchemeProvider = defaultSTSHttpAuthSchemeProvider;
    var resolveStsAuthConfig = (input) => ({
      ...input,
      stsClientCtor: STSClient_1.STSClient
    });
    exports2.resolveStsAuthConfig = resolveStsAuthConfig;
    var resolveHttpAuthSchemeConfig = (config) => {
      const config_0 = (0, exports2.resolveStsAuthConfig)(config);
      const config_1 = (0, core_1.resolveAwsSdkSigV4Config)(config_0);
      return {
        ...config_1
      };
    };
    exports2.resolveHttpAuthSchemeConfig = resolveHttpAuthSchemeConfig;
  }
});

// node_modules/@aws-sdk/client-sts/dist-cjs/endpoint/EndpointParameters.js
var require_EndpointParameters = __commonJS({
  "node_modules/@aws-sdk/client-sts/dist-cjs/endpoint/EndpointParameters.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.commonParams = exports2.resolveClientEndpointParameters = void 0;
    var resolveClientEndpointParameters = (options) => {
      return {
        ...options,
        useDualstackEndpoint: options.useDualstackEndpoint ?? false,
        useFipsEndpoint: options.useFipsEndpoint ?? false,
        useGlobalEndpoint: options.useGlobalEndpoint ?? false,
        defaultSigningName: "sts"
      };
    };
    exports2.resolveClientEndpointParameters = resolveClientEndpointParameters;
    exports2.commonParams = {
      UseGlobalEndpoint: { type: "builtInParams", name: "useGlobalEndpoint" },
      UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
      Endpoint: { type: "builtInParams", name: "endpoint" },
      Region: { type: "builtInParams", name: "region" },
      UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" }
    };
  }
});

// node_modules/@aws-sdk/client-sts/package.json
var require_package4 = __commonJS({
  "node_modules/@aws-sdk/client-sts/package.json"(exports2, module2) {
    module2.exports = {
      name: "@aws-sdk/client-sts",
      description: "AWS SDK for JavaScript Sts Client for Node.js, Browser and React Native",
      version: "3.645.0",
      scripts: {
        build: "concurrently 'yarn:build:cjs' 'yarn:build:es' 'yarn:build:types'",
        "build:cjs": "node ../../scripts/compilation/inline client-sts",
        "build:es": "tsc -p tsconfig.es.json",
        "build:include:deps": "lerna run --scope $npm_package_name --include-dependencies build",
        "build:types": "rimraf ./dist-types tsconfig.types.tsbuildinfo && tsc -p tsconfig.types.json",
        "build:types:downlevel": "downlevel-dts dist-types dist-types/ts3.4",
        clean: "rimraf ./dist-* && rimraf *.tsbuildinfo",
        "extract:docs": "api-extractor run --local",
        "generate:client": "node ../../scripts/generate-clients/single-service --solo sts",
        test: "yarn test:unit",
        "test:unit": "jest"
      },
      main: "./dist-cjs/index.js",
      types: "./dist-types/index.d.ts",
      module: "./dist-es/index.js",
      sideEffects: false,
      dependencies: {
        "@aws-crypto/sha256-browser": "5.2.0",
        "@aws-crypto/sha256-js": "5.2.0",
        "@aws-sdk/client-sso-oidc": "3.645.0",
        "@aws-sdk/core": "3.635.0",
        "@aws-sdk/credential-provider-node": "3.645.0",
        "@aws-sdk/middleware-host-header": "3.620.0",
        "@aws-sdk/middleware-logger": "3.609.0",
        "@aws-sdk/middleware-recursion-detection": "3.620.0",
        "@aws-sdk/middleware-user-agent": "3.645.0",
        "@aws-sdk/region-config-resolver": "3.614.0",
        "@aws-sdk/types": "3.609.0",
        "@aws-sdk/util-endpoints": "3.645.0",
        "@aws-sdk/util-user-agent-browser": "3.609.0",
        "@aws-sdk/util-user-agent-node": "3.614.0",
        "@smithy/config-resolver": "^3.0.5",
        "@smithy/core": "^2.4.0",
        "@smithy/fetch-http-handler": "^3.2.4",
        "@smithy/hash-node": "^3.0.3",
        "@smithy/invalid-dependency": "^3.0.3",
        "@smithy/middleware-content-length": "^3.0.5",
        "@smithy/middleware-endpoint": "^3.1.0",
        "@smithy/middleware-retry": "^3.0.15",
        "@smithy/middleware-serde": "^3.0.3",
        "@smithy/middleware-stack": "^3.0.3",
        "@smithy/node-config-provider": "^3.1.4",
        "@smithy/node-http-handler": "^3.1.4",
        "@smithy/protocol-http": "^4.1.0",
        "@smithy/smithy-client": "^3.2.0",
        "@smithy/types": "^3.3.0",
        "@smithy/url-parser": "^3.0.3",
        "@smithy/util-base64": "^3.0.0",
        "@smithy/util-body-length-browser": "^3.0.0",
        "@smithy/util-body-length-node": "^3.0.0",
        "@smithy/util-defaults-mode-browser": "^3.0.15",
        "@smithy/util-defaults-mode-node": "^3.0.15",
        "@smithy/util-endpoints": "^2.0.5",
        "@smithy/util-middleware": "^3.0.3",
        "@smithy/util-retry": "^3.0.3",
        "@smithy/util-utf8": "^3.0.0",
        tslib: "^2.6.2"
      },
      devDependencies: {
        "@tsconfig/node16": "16.1.3",
        "@types/node": "^16.18.96",
        concurrently: "7.0.0",
        "downlevel-dts": "0.10.1",
        rimraf: "3.0.2",
        typescript: "~4.9.5"
      },
      engines: {
        node: ">=16.0.0"
      },
      typesVersions: {
        "<4.0": {
          "dist-types/*": [
            "dist-types/ts3.4/*"
          ]
        }
      },
      files: [
        "dist-*/**"
      ],
      author: {
        name: "AWS SDK for JavaScript Team",
        url: "https://aws.amazon.com/javascript/"
      },
      license: "Apache-2.0",
      browser: {
        "./dist-es/runtimeConfig": "./dist-es/runtimeConfig.browser"
      },
      "react-native": {
        "./dist-es/runtimeConfig": "./dist-es/runtimeConfig.native"
      },
      homepage: "https://github.com/aws/aws-sdk-js-v3/tree/main/clients/client-sts",
      repository: {
        type: "git",
        url: "https://github.com/aws/aws-sdk-js-v3.git",
        directory: "clients/client-sts"
      }
    };
  }
});

// node_modules/@aws-sdk/client-sts/dist-cjs/endpoint/ruleset.js
var require_ruleset3 = __commonJS({
  "node_modules/@aws-sdk/client-sts/dist-cjs/endpoint/ruleset.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ruleSet = void 0;
    var F = "required";
    var G = "type";
    var H = "fn";
    var I = "argv";
    var J = "ref";
    var a = false;
    var b = true;
    var c = "booleanEquals";
    var d = "stringEquals";
    var e = "sigv4";
    var f = "sts";
    var g = "us-east-1";
    var h = "endpoint";
    var i = "https://sts.{Region}.{PartitionResult#dnsSuffix}";
    var j = "tree";
    var k = "error";
    var l = "getAttr";
    var m = { [F]: false, [G]: "String" };
    var n = { [F]: true, "default": false, [G]: "Boolean" };
    var o = { [J]: "Endpoint" };
    var p = { [H]: "isSet", [I]: [{ [J]: "Region" }] };
    var q = { [J]: "Region" };
    var r = { [H]: "aws.partition", [I]: [q], "assign": "PartitionResult" };
    var s = { [J]: "UseFIPS" };
    var t = { [J]: "UseDualStack" };
    var u = { "url": "https://sts.amazonaws.com", "properties": { "authSchemes": [{ "name": e, "signingName": f, "signingRegion": g }] }, "headers": {} };
    var v = {};
    var w = { "conditions": [{ [H]: d, [I]: [q, "aws-global"] }], [h]: u, [G]: h };
    var x = { [H]: c, [I]: [s, true] };
    var y = { [H]: c, [I]: [t, true] };
    var z = { [H]: l, [I]: [{ [J]: "PartitionResult" }, "supportsFIPS"] };
    var A = { [J]: "PartitionResult" };
    var B = { [H]: c, [I]: [true, { [H]: l, [I]: [A, "supportsDualStack"] }] };
    var C = [{ [H]: "isSet", [I]: [o] }];
    var D = [x];
    var E = [y];
    var _data = { version: "1.0", parameters: { Region: m, UseDualStack: n, UseFIPS: n, Endpoint: m, UseGlobalEndpoint: n }, rules: [{ conditions: [{ [H]: c, [I]: [{ [J]: "UseGlobalEndpoint" }, b] }, { [H]: "not", [I]: C }, p, r, { [H]: c, [I]: [s, a] }, { [H]: c, [I]: [t, a] }], rules: [{ conditions: [{ [H]: d, [I]: [q, "ap-northeast-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "ap-south-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "ap-southeast-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "ap-southeast-2"] }], endpoint: u, [G]: h }, w, { conditions: [{ [H]: d, [I]: [q, "ca-central-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "eu-central-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "eu-north-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "eu-west-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "eu-west-2"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "eu-west-3"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "sa-east-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, g] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "us-east-2"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "us-west-1"] }], endpoint: u, [G]: h }, { conditions: [{ [H]: d, [I]: [q, "us-west-2"] }], endpoint: u, [G]: h }, { endpoint: { url: i, properties: { authSchemes: [{ name: e, signingName: f, signingRegion: "{Region}" }] }, headers: v }, [G]: h }], [G]: j }, { conditions: C, rules: [{ conditions: D, error: "Invalid Configuration: FIPS and custom endpoint are not supported", [G]: k }, { conditions: E, error: "Invalid Configuration: Dualstack and custom endpoint are not supported", [G]: k }, { endpoint: { url: o, properties: v, headers: v }, [G]: h }], [G]: j }, { conditions: [p], rules: [{ conditions: [r], rules: [{ conditions: [x, y], rules: [{ conditions: [{ [H]: c, [I]: [b, z] }, B], rules: [{ endpoint: { url: "https://sts-fips.{Region}.{PartitionResult#dualStackDnsSuffix}", properties: v, headers: v }, [G]: h }], [G]: j }, { error: "FIPS and DualStack are enabled, but this partition does not support one or both", [G]: k }], [G]: j }, { conditions: D, rules: [{ conditions: [{ [H]: c, [I]: [z, b] }], rules: [{ conditions: [{ [H]: d, [I]: [{ [H]: l, [I]: [A, "name"] }, "aws-us-gov"] }], endpoint: { url: "https://sts.{Region}.amazonaws.com", properties: v, headers: v }, [G]: h }, { endpoint: { url: "https://sts-fips.{Region}.{PartitionResult#dnsSuffix}", properties: v, headers: v }, [G]: h }], [G]: j }, { error: "FIPS is enabled but this partition does not support FIPS", [G]: k }], [G]: j }, { conditions: E, rules: [{ conditions: [B], rules: [{ endpoint: { url: "https://sts.{Region}.{PartitionResult#dualStackDnsSuffix}", properties: v, headers: v }, [G]: h }], [G]: j }, { error: "DualStack is enabled but this partition does not support DualStack", [G]: k }], [G]: j }, w, { endpoint: { url: i, properties: v, headers: v }, [G]: h }], [G]: j }], [G]: j }, { error: "Invalid Configuration: Missing Region", [G]: k }] };
    exports2.ruleSet = _data;
  }
});

// node_modules/@aws-sdk/client-sts/dist-cjs/endpoint/endpointResolver.js
var require_endpointResolver3 = __commonJS({
  "node_modules/@aws-sdk/client-sts/dist-cjs/endpoint/endpointResolver.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.defaultEndpointResolver = void 0;
    var util_endpoints_1 = require_dist_cjs7();
    var util_endpoints_2 = require_dist_cjs6();
    var ruleset_1 = require_ruleset3();
    var defaultEndpointResolver = (endpointParams, context = {}) => {
      return (0, util_endpoints_2.resolveEndpoint)(ruleset_1.ruleSet, {
        endpointParams,
        logger: context.logger
      });
    };
    exports2.defaultEndpointResolver = defaultEndpointResolver;
    util_endpoints_2.customEndpointFunctions.aws = util_endpoints_1.awsEndpointFunctions;
  }
});

// node_modules/@aws-sdk/client-sts/dist-cjs/runtimeConfig.shared.js
var require_runtimeConfig_shared3 = __commonJS({
  "node_modules/@aws-sdk/client-sts/dist-cjs/runtimeConfig.shared.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getRuntimeConfig = void 0;
    var core_1 = (init_dist_es2(), __toCommonJS(dist_es_exports2));
    var core_2 = (init_dist_es(), __toCommonJS(dist_es_exports));
    var smithy_client_1 = require_dist_cjs32();
    var url_parser_1 = require_dist_cjs16();
    var util_base64_1 = require_dist_cjs25();
    var util_utf8_1 = require_dist_cjs24();
    var httpAuthSchemeProvider_1 = require_httpAuthSchemeProvider4();
    var endpointResolver_1 = require_endpointResolver3();
    var getRuntimeConfig = (config) => {
      return {
        apiVersion: "2011-06-15",
        base64Decoder: config?.base64Decoder ?? util_base64_1.fromBase64,
        base64Encoder: config?.base64Encoder ?? util_base64_1.toBase64,
        disableHostPrefix: config?.disableHostPrefix ?? false,
        endpointProvider: config?.endpointProvider ?? endpointResolver_1.defaultEndpointResolver,
        extensions: config?.extensions ?? [],
        httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? httpAuthSchemeProvider_1.defaultSTSHttpAuthSchemeProvider,
        httpAuthSchemes: config?.httpAuthSchemes ?? [
          {
            schemeId: "aws.auth#sigv4",
            identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4"),
            signer: new core_1.AwsSdkSigV4Signer()
          },
          {
            schemeId: "smithy.api#noAuth",
            identityProvider: (ipc) => ipc.getIdentityProvider("smithy.api#noAuth") || (async () => ({})),
            signer: new core_2.NoAuthSigner()
          }
        ],
        logger: config?.logger ?? new smithy_client_1.NoOpLogger(),
        serviceId: config?.serviceId ?? "STS",
        urlParser: config?.urlParser ?? url_parser_1.parseUrl,
        utf8Decoder: config?.utf8Decoder ?? util_utf8_1.fromUtf8,
        utf8Encoder: config?.utf8Encoder ?? util_utf8_1.toUtf8
      };
    };
    exports2.getRuntimeConfig = getRuntimeConfig;
  }
});

// node_modules/@aws-sdk/client-sts/dist-cjs/runtimeConfig.js
var require_runtimeConfig3 = __commonJS({
  "node_modules/@aws-sdk/client-sts/dist-cjs/runtimeConfig.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getRuntimeConfig = void 0;
    var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
    var package_json_1 = tslib_1.__importDefault(require_package4());
    var core_1 = (init_dist_es2(), __toCommonJS(dist_es_exports2));
    var credential_provider_node_1 = require_dist_cjs52();
    var util_user_agent_node_1 = require_dist_cjs39();
    var config_resolver_1 = require_dist_cjs11();
    var core_2 = (init_dist_es(), __toCommonJS(dist_es_exports));
    var hash_node_1 = require_dist_cjs40();
    var middleware_retry_1 = require_dist_cjs33();
    var node_config_provider_1 = require_dist_cjs14();
    var node_http_handler_1 = require_dist_cjs28();
    var util_body_length_node_1 = require_dist_cjs41();
    var util_retry_1 = require_dist_cjs20();
    var runtimeConfig_shared_1 = require_runtimeConfig_shared3();
    var smithy_client_1 = require_dist_cjs32();
    var util_defaults_mode_node_1 = require_dist_cjs42();
    var smithy_client_2 = require_dist_cjs32();
    var getRuntimeConfig = (config) => {
      (0, smithy_client_2.emitWarningIfUnsupportedVersion)(process.version);
      const defaultsMode = (0, util_defaults_mode_node_1.resolveDefaultsModeConfig)(config);
      const defaultConfigProvider = () => defaultsMode().then(smithy_client_1.loadConfigsForDefaultMode);
      const clientSharedValues = (0, runtimeConfig_shared_1.getRuntimeConfig)(config);
      (0, core_1.emitWarningIfUnsupportedVersion)(process.version);
      return {
        ...clientSharedValues,
        ...config,
        runtime: "node",
        defaultsMode,
        bodyLengthChecker: config?.bodyLengthChecker ?? util_body_length_node_1.calculateBodyLength,
        credentialDefaultProvider: config?.credentialDefaultProvider ?? credential_provider_node_1.defaultProvider,
        defaultUserAgentProvider: config?.defaultUserAgentProvider ?? (0, util_user_agent_node_1.defaultUserAgent)({ serviceId: clientSharedValues.serviceId, clientVersion: package_json_1.default.version }),
        httpAuthSchemes: config?.httpAuthSchemes ?? [
          {
            schemeId: "aws.auth#sigv4",
            identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4") || (async (idProps) => await (0, credential_provider_node_1.defaultProvider)(idProps?.__config || {})()),
            signer: new core_1.AwsSdkSigV4Signer()
          },
          {
            schemeId: "smithy.api#noAuth",
            identityProvider: (ipc) => ipc.getIdentityProvider("smithy.api#noAuth") || (async () => ({})),
            signer: new core_2.NoAuthSigner()
          }
        ],
        maxAttempts: config?.maxAttempts ?? (0, node_config_provider_1.loadConfig)(middleware_retry_1.NODE_MAX_ATTEMPT_CONFIG_OPTIONS),
        region: config?.region ?? (0, node_config_provider_1.loadConfig)(config_resolver_1.NODE_REGION_CONFIG_OPTIONS, config_resolver_1.NODE_REGION_CONFIG_FILE_OPTIONS),
        requestHandler: node_http_handler_1.NodeHttpHandler.create(config?.requestHandler ?? defaultConfigProvider),
        retryMode: config?.retryMode ?? (0, node_config_provider_1.loadConfig)({
          ...middleware_retry_1.NODE_RETRY_MODE_CONFIG_OPTIONS,
          default: async () => (await defaultConfigProvider()).retryMode || util_retry_1.DEFAULT_RETRY_MODE
        }),
        sha256: config?.sha256 ?? hash_node_1.Hash.bind(null, "sha256"),
        streamCollector: config?.streamCollector ?? node_http_handler_1.streamCollector,
        useDualstackEndpoint: config?.useDualstackEndpoint ?? (0, node_config_provider_1.loadConfig)(config_resolver_1.NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS),
        useFipsEndpoint: config?.useFipsEndpoint ?? (0, node_config_provider_1.loadConfig)(config_resolver_1.NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS)
      };
    };
    exports2.getRuntimeConfig = getRuntimeConfig;
  }
});

// node_modules/@aws-sdk/client-sts/dist-cjs/auth/httpAuthExtensionConfiguration.js
var require_httpAuthExtensionConfiguration = __commonJS({
  "node_modules/@aws-sdk/client-sts/dist-cjs/auth/httpAuthExtensionConfiguration.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.resolveHttpAuthRuntimeConfig = exports2.getHttpAuthExtensionConfiguration = void 0;
    var getHttpAuthExtensionConfiguration = (runtimeConfig) => {
      const _httpAuthSchemes = runtimeConfig.httpAuthSchemes;
      let _httpAuthSchemeProvider = runtimeConfig.httpAuthSchemeProvider;
      let _credentials = runtimeConfig.credentials;
      return {
        setHttpAuthScheme(httpAuthScheme) {
          const index = _httpAuthSchemes.findIndex((scheme) => scheme.schemeId === httpAuthScheme.schemeId);
          if (index === -1) {
            _httpAuthSchemes.push(httpAuthScheme);
          } else {
            _httpAuthSchemes.splice(index, 1, httpAuthScheme);
          }
        },
        httpAuthSchemes() {
          return _httpAuthSchemes;
        },
        setHttpAuthSchemeProvider(httpAuthSchemeProvider) {
          _httpAuthSchemeProvider = httpAuthSchemeProvider;
        },
        httpAuthSchemeProvider() {
          return _httpAuthSchemeProvider;
        },
        setCredentials(credentials) {
          _credentials = credentials;
        },
        credentials() {
          return _credentials;
        }
      };
    };
    exports2.getHttpAuthExtensionConfiguration = getHttpAuthExtensionConfiguration;
    var resolveHttpAuthRuntimeConfig = (config) => {
      return {
        httpAuthSchemes: config.httpAuthSchemes(),
        httpAuthSchemeProvider: config.httpAuthSchemeProvider(),
        credentials: config.credentials()
      };
    };
    exports2.resolveHttpAuthRuntimeConfig = resolveHttpAuthRuntimeConfig;
  }
});

// node_modules/@aws-sdk/client-sts/dist-cjs/runtimeExtensions.js
var require_runtimeExtensions = __commonJS({
  "node_modules/@aws-sdk/client-sts/dist-cjs/runtimeExtensions.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.resolveRuntimeExtensions = void 0;
    var region_config_resolver_1 = require_dist_cjs43();
    var protocol_http_1 = require_dist_cjs2();
    var smithy_client_1 = require_dist_cjs32();
    var httpAuthExtensionConfiguration_1 = require_httpAuthExtensionConfiguration();
    var asPartial = (t) => t;
    var resolveRuntimeExtensions = (runtimeConfig, extensions) => {
      const extensionConfiguration = {
        ...asPartial((0, region_config_resolver_1.getAwsRegionExtensionConfiguration)(runtimeConfig)),
        ...asPartial((0, smithy_client_1.getDefaultExtensionConfiguration)(runtimeConfig)),
        ...asPartial((0, protocol_http_1.getHttpHandlerExtensionConfiguration)(runtimeConfig)),
        ...asPartial((0, httpAuthExtensionConfiguration_1.getHttpAuthExtensionConfiguration)(runtimeConfig))
      };
      extensions.forEach((extension) => extension.configure(extensionConfiguration));
      return {
        ...runtimeConfig,
        ...(0, region_config_resolver_1.resolveAwsRegionExtensionConfiguration)(extensionConfiguration),
        ...(0, smithy_client_1.resolveDefaultRuntimeConfig)(extensionConfiguration),
        ...(0, protocol_http_1.resolveHttpHandlerRuntimeConfig)(extensionConfiguration),
        ...(0, httpAuthExtensionConfiguration_1.resolveHttpAuthRuntimeConfig)(extensionConfiguration)
      };
    };
    exports2.resolveRuntimeExtensions = resolveRuntimeExtensions;
  }
});

// node_modules/@aws-sdk/client-sts/dist-cjs/STSClient.js
var require_STSClient = __commonJS({
  "node_modules/@aws-sdk/client-sts/dist-cjs/STSClient.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.STSClient = exports2.__Client = void 0;
    var middleware_host_header_1 = require_dist_cjs3();
    var middleware_logger_1 = require_dist_cjs4();
    var middleware_recursion_detection_1 = require_dist_cjs5();
    var middleware_user_agent_1 = require_dist_cjs8();
    var config_resolver_1 = require_dist_cjs11();
    var core_1 = (init_dist_es(), __toCommonJS(dist_es_exports));
    var middleware_content_length_1 = require_dist_cjs34();
    var middleware_endpoint_1 = require_dist_cjs18();
    var middleware_retry_1 = require_dist_cjs33();
    var smithy_client_1 = require_dist_cjs32();
    Object.defineProperty(exports2, "__Client", { enumerable: true, get: function() {
      return smithy_client_1.Client;
    } });
    var httpAuthSchemeProvider_1 = require_httpAuthSchemeProvider4();
    var EndpointParameters_1 = require_EndpointParameters();
    var runtimeConfig_1 = require_runtimeConfig3();
    var runtimeExtensions_1 = require_runtimeExtensions();
    var STSClient2 = class extends smithy_client_1.Client {
      constructor(...[configuration]) {
        const _config_0 = (0, runtimeConfig_1.getRuntimeConfig)(configuration || {});
        const _config_1 = (0, EndpointParameters_1.resolveClientEndpointParameters)(_config_0);
        const _config_2 = (0, middleware_user_agent_1.resolveUserAgentConfig)(_config_1);
        const _config_3 = (0, middleware_retry_1.resolveRetryConfig)(_config_2);
        const _config_4 = (0, config_resolver_1.resolveRegionConfig)(_config_3);
        const _config_5 = (0, middleware_host_header_1.resolveHostHeaderConfig)(_config_4);
        const _config_6 = (0, middleware_endpoint_1.resolveEndpointConfig)(_config_5);
        const _config_7 = (0, httpAuthSchemeProvider_1.resolveHttpAuthSchemeConfig)(_config_6);
        const _config_8 = (0, runtimeExtensions_1.resolveRuntimeExtensions)(_config_7, configuration?.extensions || []);
        super(_config_8);
        this.config = _config_8;
        this.middlewareStack.use((0, middleware_user_agent_1.getUserAgentPlugin)(this.config));
        this.middlewareStack.use((0, middleware_retry_1.getRetryPlugin)(this.config));
        this.middlewareStack.use((0, middleware_content_length_1.getContentLengthPlugin)(this.config));
        this.middlewareStack.use((0, middleware_host_header_1.getHostHeaderPlugin)(this.config));
        this.middlewareStack.use((0, middleware_logger_1.getLoggerPlugin)(this.config));
        this.middlewareStack.use((0, middleware_recursion_detection_1.getRecursionDetectionPlugin)(this.config));
        this.middlewareStack.use((0, core_1.getHttpAuthSchemeEndpointRuleSetPlugin)(this.config, {
          httpAuthSchemeParametersProvider: httpAuthSchemeProvider_1.defaultSTSHttpAuthSchemeParametersProvider,
          identityProviderConfigProvider: async (config) => new core_1.DefaultIdentityProviderConfig({
            "aws.auth#sigv4": config.credentials
          })
        }));
        this.middlewareStack.use((0, core_1.getHttpSigningPlugin)(this.config));
      }
      destroy() {
        super.destroy();
      }
    };
    exports2.STSClient = STSClient2;
  }
});

// node_modules/@aws-sdk/client-sts/dist-cjs/index.js
var require_dist_cjs48 = __commonJS({
  "node_modules/@aws-sdk/client-sts/dist-cjs/index.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __reExport = (target, mod, secondTarget) => (__copyProps2(target, mod, "default"), secondTarget && __copyProps2(secondTarget, mod, "default"));
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      AssumeRoleCommand: () => AssumeRoleCommand,
      AssumeRoleResponseFilterSensitiveLog: () => AssumeRoleResponseFilterSensitiveLog,
      AssumeRoleWithSAMLCommand: () => AssumeRoleWithSAMLCommand,
      AssumeRoleWithSAMLRequestFilterSensitiveLog: () => AssumeRoleWithSAMLRequestFilterSensitiveLog,
      AssumeRoleWithSAMLResponseFilterSensitiveLog: () => AssumeRoleWithSAMLResponseFilterSensitiveLog,
      AssumeRoleWithWebIdentityCommand: () => AssumeRoleWithWebIdentityCommand,
      AssumeRoleWithWebIdentityRequestFilterSensitiveLog: () => AssumeRoleWithWebIdentityRequestFilterSensitiveLog,
      AssumeRoleWithWebIdentityResponseFilterSensitiveLog: () => AssumeRoleWithWebIdentityResponseFilterSensitiveLog,
      ClientInputEndpointParameters: () => import_EndpointParameters9.ClientInputEndpointParameters,
      CredentialsFilterSensitiveLog: () => CredentialsFilterSensitiveLog,
      DecodeAuthorizationMessageCommand: () => DecodeAuthorizationMessageCommand,
      ExpiredTokenException: () => ExpiredTokenException,
      GetAccessKeyInfoCommand: () => GetAccessKeyInfoCommand,
      GetCallerIdentityCommand: () => GetCallerIdentityCommand,
      GetFederationTokenCommand: () => GetFederationTokenCommand,
      GetFederationTokenResponseFilterSensitiveLog: () => GetFederationTokenResponseFilterSensitiveLog,
      GetSessionTokenCommand: () => GetSessionTokenCommand,
      GetSessionTokenResponseFilterSensitiveLog: () => GetSessionTokenResponseFilterSensitiveLog,
      IDPCommunicationErrorException: () => IDPCommunicationErrorException,
      IDPRejectedClaimException: () => IDPRejectedClaimException,
      InvalidAuthorizationMessageException: () => InvalidAuthorizationMessageException,
      InvalidIdentityTokenException: () => InvalidIdentityTokenException,
      MalformedPolicyDocumentException: () => MalformedPolicyDocumentException,
      PackedPolicyTooLargeException: () => PackedPolicyTooLargeException,
      RegionDisabledException: () => RegionDisabledException,
      STS: () => STS,
      STSServiceException: () => STSServiceException,
      decorateDefaultCredentialProvider: () => decorateDefaultCredentialProvider,
      getDefaultRoleAssumer: () => getDefaultRoleAssumer2,
      getDefaultRoleAssumerWithWebIdentity: () => getDefaultRoleAssumerWithWebIdentity2
    });
    module2.exports = __toCommonJS2(src_exports);
    __reExport(src_exports, require_STSClient(), module2.exports);
    var import_middleware_endpoint2 = require_dist_cjs18();
    var import_middleware_serde2 = require_dist_cjs17();
    var import_EndpointParameters = require_EndpointParameters();
    var import_smithy_client5 = require_dist_cjs32();
    var _STSServiceException = class _STSServiceException2 extends import_smithy_client5.ServiceException {
      /**
       * @internal
       */
      constructor(options) {
        super(options);
        Object.setPrototypeOf(this, _STSServiceException2.prototype);
      }
    };
    __name(_STSServiceException, "STSServiceException");
    var STSServiceException = _STSServiceException;
    var _ExpiredTokenException = class _ExpiredTokenException2 extends STSServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "ExpiredTokenException",
          $fault: "client",
          ...opts
        });
        this.name = "ExpiredTokenException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _ExpiredTokenException2.prototype);
      }
    };
    __name(_ExpiredTokenException, "ExpiredTokenException");
    var ExpiredTokenException = _ExpiredTokenException;
    var _MalformedPolicyDocumentException = class _MalformedPolicyDocumentException2 extends STSServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "MalformedPolicyDocumentException",
          $fault: "client",
          ...opts
        });
        this.name = "MalformedPolicyDocumentException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _MalformedPolicyDocumentException2.prototype);
      }
    };
    __name(_MalformedPolicyDocumentException, "MalformedPolicyDocumentException");
    var MalformedPolicyDocumentException = _MalformedPolicyDocumentException;
    var _PackedPolicyTooLargeException = class _PackedPolicyTooLargeException2 extends STSServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "PackedPolicyTooLargeException",
          $fault: "client",
          ...opts
        });
        this.name = "PackedPolicyTooLargeException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _PackedPolicyTooLargeException2.prototype);
      }
    };
    __name(_PackedPolicyTooLargeException, "PackedPolicyTooLargeException");
    var PackedPolicyTooLargeException = _PackedPolicyTooLargeException;
    var _RegionDisabledException = class _RegionDisabledException2 extends STSServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "RegionDisabledException",
          $fault: "client",
          ...opts
        });
        this.name = "RegionDisabledException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _RegionDisabledException2.prototype);
      }
    };
    __name(_RegionDisabledException, "RegionDisabledException");
    var RegionDisabledException = _RegionDisabledException;
    var _IDPRejectedClaimException = class _IDPRejectedClaimException2 extends STSServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "IDPRejectedClaimException",
          $fault: "client",
          ...opts
        });
        this.name = "IDPRejectedClaimException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _IDPRejectedClaimException2.prototype);
      }
    };
    __name(_IDPRejectedClaimException, "IDPRejectedClaimException");
    var IDPRejectedClaimException = _IDPRejectedClaimException;
    var _InvalidIdentityTokenException = class _InvalidIdentityTokenException2 extends STSServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "InvalidIdentityTokenException",
          $fault: "client",
          ...opts
        });
        this.name = "InvalidIdentityTokenException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _InvalidIdentityTokenException2.prototype);
      }
    };
    __name(_InvalidIdentityTokenException, "InvalidIdentityTokenException");
    var InvalidIdentityTokenException = _InvalidIdentityTokenException;
    var _IDPCommunicationErrorException = class _IDPCommunicationErrorException2 extends STSServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "IDPCommunicationErrorException",
          $fault: "client",
          ...opts
        });
        this.name = "IDPCommunicationErrorException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _IDPCommunicationErrorException2.prototype);
      }
    };
    __name(_IDPCommunicationErrorException, "IDPCommunicationErrorException");
    var IDPCommunicationErrorException = _IDPCommunicationErrorException;
    var _InvalidAuthorizationMessageException = class _InvalidAuthorizationMessageException2 extends STSServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "InvalidAuthorizationMessageException",
          $fault: "client",
          ...opts
        });
        this.name = "InvalidAuthorizationMessageException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _InvalidAuthorizationMessageException2.prototype);
      }
    };
    __name(_InvalidAuthorizationMessageException, "InvalidAuthorizationMessageException");
    var InvalidAuthorizationMessageException = _InvalidAuthorizationMessageException;
    var CredentialsFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.SecretAccessKey && { SecretAccessKey: import_smithy_client5.SENSITIVE_STRING }
    }), "CredentialsFilterSensitiveLog");
    var AssumeRoleResponseFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.Credentials && { Credentials: CredentialsFilterSensitiveLog(obj.Credentials) }
    }), "AssumeRoleResponseFilterSensitiveLog");
    var AssumeRoleWithSAMLRequestFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.SAMLAssertion && { SAMLAssertion: import_smithy_client5.SENSITIVE_STRING }
    }), "AssumeRoleWithSAMLRequestFilterSensitiveLog");
    var AssumeRoleWithSAMLResponseFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.Credentials && { Credentials: CredentialsFilterSensitiveLog(obj.Credentials) }
    }), "AssumeRoleWithSAMLResponseFilterSensitiveLog");
    var AssumeRoleWithWebIdentityRequestFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.WebIdentityToken && { WebIdentityToken: import_smithy_client5.SENSITIVE_STRING }
    }), "AssumeRoleWithWebIdentityRequestFilterSensitiveLog");
    var AssumeRoleWithWebIdentityResponseFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.Credentials && { Credentials: CredentialsFilterSensitiveLog(obj.Credentials) }
    }), "AssumeRoleWithWebIdentityResponseFilterSensitiveLog");
    var GetFederationTokenResponseFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.Credentials && { Credentials: CredentialsFilterSensitiveLog(obj.Credentials) }
    }), "GetFederationTokenResponseFilterSensitiveLog");
    var GetSessionTokenResponseFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.Credentials && { Credentials: CredentialsFilterSensitiveLog(obj.Credentials) }
    }), "GetSessionTokenResponseFilterSensitiveLog");
    var import_core3 = (init_dist_es2(), __toCommonJS(dist_es_exports2));
    var import_protocol_http8 = require_dist_cjs2();
    var se_AssumeRoleCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = SHARED_HEADERS;
      let body;
      body = buildFormUrlencodedString({
        ...se_AssumeRoleRequest(input, context),
        [_A]: _AR,
        [_V]: _
      });
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_AssumeRoleCommand");
    var se_AssumeRoleWithSAMLCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = SHARED_HEADERS;
      let body;
      body = buildFormUrlencodedString({
        ...se_AssumeRoleWithSAMLRequest(input, context),
        [_A]: _ARWSAML,
        [_V]: _
      });
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_AssumeRoleWithSAMLCommand");
    var se_AssumeRoleWithWebIdentityCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = SHARED_HEADERS;
      let body;
      body = buildFormUrlencodedString({
        ...se_AssumeRoleWithWebIdentityRequest(input, context),
        [_A]: _ARWWI,
        [_V]: _
      });
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_AssumeRoleWithWebIdentityCommand");
    var se_DecodeAuthorizationMessageCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = SHARED_HEADERS;
      let body;
      body = buildFormUrlencodedString({
        ...se_DecodeAuthorizationMessageRequest(input, context),
        [_A]: _DAM,
        [_V]: _
      });
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_DecodeAuthorizationMessageCommand");
    var se_GetAccessKeyInfoCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = SHARED_HEADERS;
      let body;
      body = buildFormUrlencodedString({
        ...se_GetAccessKeyInfoRequest(input, context),
        [_A]: _GAKI,
        [_V]: _
      });
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_GetAccessKeyInfoCommand");
    var se_GetCallerIdentityCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = SHARED_HEADERS;
      let body;
      body = buildFormUrlencodedString({
        ...se_GetCallerIdentityRequest(input, context),
        [_A]: _GCI,
        [_V]: _
      });
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_GetCallerIdentityCommand");
    var se_GetFederationTokenCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = SHARED_HEADERS;
      let body;
      body = buildFormUrlencodedString({
        ...se_GetFederationTokenRequest(input, context),
        [_A]: _GFT,
        [_V]: _
      });
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_GetFederationTokenCommand");
    var se_GetSessionTokenCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = SHARED_HEADERS;
      let body;
      body = buildFormUrlencodedString({
        ...se_GetSessionTokenRequest(input, context),
        [_A]: _GST,
        [_V]: _
      });
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_GetSessionTokenCommand");
    var de_AssumeRoleCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core3.parseXmlBody)(output.body, context);
      let contents = {};
      contents = de_AssumeRoleResponse(data.AssumeRoleResult, context);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_AssumeRoleCommand");
    var de_AssumeRoleWithSAMLCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core3.parseXmlBody)(output.body, context);
      let contents = {};
      contents = de_AssumeRoleWithSAMLResponse(data.AssumeRoleWithSAMLResult, context);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_AssumeRoleWithSAMLCommand");
    var de_AssumeRoleWithWebIdentityCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core3.parseXmlBody)(output.body, context);
      let contents = {};
      contents = de_AssumeRoleWithWebIdentityResponse(data.AssumeRoleWithWebIdentityResult, context);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_AssumeRoleWithWebIdentityCommand");
    var de_DecodeAuthorizationMessageCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core3.parseXmlBody)(output.body, context);
      let contents = {};
      contents = de_DecodeAuthorizationMessageResponse(data.DecodeAuthorizationMessageResult, context);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_DecodeAuthorizationMessageCommand");
    var de_GetAccessKeyInfoCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core3.parseXmlBody)(output.body, context);
      let contents = {};
      contents = de_GetAccessKeyInfoResponse(data.GetAccessKeyInfoResult, context);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_GetAccessKeyInfoCommand");
    var de_GetCallerIdentityCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core3.parseXmlBody)(output.body, context);
      let contents = {};
      contents = de_GetCallerIdentityResponse(data.GetCallerIdentityResult, context);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_GetCallerIdentityCommand");
    var de_GetFederationTokenCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core3.parseXmlBody)(output.body, context);
      let contents = {};
      contents = de_GetFederationTokenResponse(data.GetFederationTokenResult, context);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_GetFederationTokenCommand");
    var de_GetSessionTokenCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core3.parseXmlBody)(output.body, context);
      let contents = {};
      contents = de_GetSessionTokenResponse(data.GetSessionTokenResult, context);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_GetSessionTokenCommand");
    var de_CommandError = /* @__PURE__ */ __name(async (output, context) => {
      const parsedOutput = {
        ...output,
        body: await (0, import_core3.parseXmlErrorBody)(output.body, context)
      };
      const errorCode = loadQueryErrorCode(output, parsedOutput.body);
      switch (errorCode) {
        case "ExpiredTokenException":
        case "com.amazonaws.sts#ExpiredTokenException":
          throw await de_ExpiredTokenExceptionRes(parsedOutput, context);
        case "MalformedPolicyDocument":
        case "com.amazonaws.sts#MalformedPolicyDocumentException":
          throw await de_MalformedPolicyDocumentExceptionRes(parsedOutput, context);
        case "PackedPolicyTooLarge":
        case "com.amazonaws.sts#PackedPolicyTooLargeException":
          throw await de_PackedPolicyTooLargeExceptionRes(parsedOutput, context);
        case "RegionDisabledException":
        case "com.amazonaws.sts#RegionDisabledException":
          throw await de_RegionDisabledExceptionRes(parsedOutput, context);
        case "IDPRejectedClaim":
        case "com.amazonaws.sts#IDPRejectedClaimException":
          throw await de_IDPRejectedClaimExceptionRes(parsedOutput, context);
        case "InvalidIdentityToken":
        case "com.amazonaws.sts#InvalidIdentityTokenException":
          throw await de_InvalidIdentityTokenExceptionRes(parsedOutput, context);
        case "IDPCommunicationError":
        case "com.amazonaws.sts#IDPCommunicationErrorException":
          throw await de_IDPCommunicationErrorExceptionRes(parsedOutput, context);
        case "InvalidAuthorizationMessageException":
        case "com.amazonaws.sts#InvalidAuthorizationMessageException":
          throw await de_InvalidAuthorizationMessageExceptionRes(parsedOutput, context);
        default:
          const parsedBody = parsedOutput.body;
          return throwDefaultError({
            output,
            parsedBody: parsedBody.Error,
            errorCode
          });
      }
    }, "de_CommandError");
    var de_ExpiredTokenExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const body = parsedOutput.body;
      const deserialized = de_ExpiredTokenException(body.Error, context);
      const exception = new ExpiredTokenException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, body);
    }, "de_ExpiredTokenExceptionRes");
    var de_IDPCommunicationErrorExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const body = parsedOutput.body;
      const deserialized = de_IDPCommunicationErrorException(body.Error, context);
      const exception = new IDPCommunicationErrorException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, body);
    }, "de_IDPCommunicationErrorExceptionRes");
    var de_IDPRejectedClaimExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const body = parsedOutput.body;
      const deserialized = de_IDPRejectedClaimException(body.Error, context);
      const exception = new IDPRejectedClaimException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, body);
    }, "de_IDPRejectedClaimExceptionRes");
    var de_InvalidAuthorizationMessageExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const body = parsedOutput.body;
      const deserialized = de_InvalidAuthorizationMessageException(body.Error, context);
      const exception = new InvalidAuthorizationMessageException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, body);
    }, "de_InvalidAuthorizationMessageExceptionRes");
    var de_InvalidIdentityTokenExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const body = parsedOutput.body;
      const deserialized = de_InvalidIdentityTokenException(body.Error, context);
      const exception = new InvalidIdentityTokenException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, body);
    }, "de_InvalidIdentityTokenExceptionRes");
    var de_MalformedPolicyDocumentExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const body = parsedOutput.body;
      const deserialized = de_MalformedPolicyDocumentException(body.Error, context);
      const exception = new MalformedPolicyDocumentException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, body);
    }, "de_MalformedPolicyDocumentExceptionRes");
    var de_PackedPolicyTooLargeExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const body = parsedOutput.body;
      const deserialized = de_PackedPolicyTooLargeException(body.Error, context);
      const exception = new PackedPolicyTooLargeException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, body);
    }, "de_PackedPolicyTooLargeExceptionRes");
    var de_RegionDisabledExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const body = parsedOutput.body;
      const deserialized = de_RegionDisabledException(body.Error, context);
      const exception = new RegionDisabledException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, body);
    }, "de_RegionDisabledExceptionRes");
    var se_AssumeRoleRequest = /* @__PURE__ */ __name((input, context) => {
      var _a2, _b, _c, _d;
      const entries = {};
      if (input[_RA] != null) {
        entries[_RA] = input[_RA];
      }
      if (input[_RSN] != null) {
        entries[_RSN] = input[_RSN];
      }
      if (input[_PA] != null) {
        const memberEntries = se_policyDescriptorListType(input[_PA], context);
        if (((_a2 = input[_PA]) == null ? void 0 : _a2.length) === 0) {
          entries.PolicyArns = [];
        }
        Object.entries(memberEntries).forEach(([key, value]) => {
          const loc = `PolicyArns.${key}`;
          entries[loc] = value;
        });
      }
      if (input[_P] != null) {
        entries[_P] = input[_P];
      }
      if (input[_DS] != null) {
        entries[_DS] = input[_DS];
      }
      if (input[_T] != null) {
        const memberEntries = se_tagListType(input[_T], context);
        if (((_b = input[_T]) == null ? void 0 : _b.length) === 0) {
          entries.Tags = [];
        }
        Object.entries(memberEntries).forEach(([key, value]) => {
          const loc = `Tags.${key}`;
          entries[loc] = value;
        });
      }
      if (input[_TTK] != null) {
        const memberEntries = se_tagKeyListType(input[_TTK], context);
        if (((_c = input[_TTK]) == null ? void 0 : _c.length) === 0) {
          entries.TransitiveTagKeys = [];
        }
        Object.entries(memberEntries).forEach(([key, value]) => {
          const loc = `TransitiveTagKeys.${key}`;
          entries[loc] = value;
        });
      }
      if (input[_EI] != null) {
        entries[_EI] = input[_EI];
      }
      if (input[_SN] != null) {
        entries[_SN] = input[_SN];
      }
      if (input[_TC] != null) {
        entries[_TC] = input[_TC];
      }
      if (input[_SI] != null) {
        entries[_SI] = input[_SI];
      }
      if (input[_PC] != null) {
        const memberEntries = se_ProvidedContextsListType(input[_PC], context);
        if (((_d = input[_PC]) == null ? void 0 : _d.length) === 0) {
          entries.ProvidedContexts = [];
        }
        Object.entries(memberEntries).forEach(([key, value]) => {
          const loc = `ProvidedContexts.${key}`;
          entries[loc] = value;
        });
      }
      return entries;
    }, "se_AssumeRoleRequest");
    var se_AssumeRoleWithSAMLRequest = /* @__PURE__ */ __name((input, context) => {
      var _a2;
      const entries = {};
      if (input[_RA] != null) {
        entries[_RA] = input[_RA];
      }
      if (input[_PAr] != null) {
        entries[_PAr] = input[_PAr];
      }
      if (input[_SAMLA] != null) {
        entries[_SAMLA] = input[_SAMLA];
      }
      if (input[_PA] != null) {
        const memberEntries = se_policyDescriptorListType(input[_PA], context);
        if (((_a2 = input[_PA]) == null ? void 0 : _a2.length) === 0) {
          entries.PolicyArns = [];
        }
        Object.entries(memberEntries).forEach(([key, value]) => {
          const loc = `PolicyArns.${key}`;
          entries[loc] = value;
        });
      }
      if (input[_P] != null) {
        entries[_P] = input[_P];
      }
      if (input[_DS] != null) {
        entries[_DS] = input[_DS];
      }
      return entries;
    }, "se_AssumeRoleWithSAMLRequest");
    var se_AssumeRoleWithWebIdentityRequest = /* @__PURE__ */ __name((input, context) => {
      var _a2;
      const entries = {};
      if (input[_RA] != null) {
        entries[_RA] = input[_RA];
      }
      if (input[_RSN] != null) {
        entries[_RSN] = input[_RSN];
      }
      if (input[_WIT] != null) {
        entries[_WIT] = input[_WIT];
      }
      if (input[_PI] != null) {
        entries[_PI] = input[_PI];
      }
      if (input[_PA] != null) {
        const memberEntries = se_policyDescriptorListType(input[_PA], context);
        if (((_a2 = input[_PA]) == null ? void 0 : _a2.length) === 0) {
          entries.PolicyArns = [];
        }
        Object.entries(memberEntries).forEach(([key, value]) => {
          const loc = `PolicyArns.${key}`;
          entries[loc] = value;
        });
      }
      if (input[_P] != null) {
        entries[_P] = input[_P];
      }
      if (input[_DS] != null) {
        entries[_DS] = input[_DS];
      }
      return entries;
    }, "se_AssumeRoleWithWebIdentityRequest");
    var se_DecodeAuthorizationMessageRequest = /* @__PURE__ */ __name((input, context) => {
      const entries = {};
      if (input[_EM] != null) {
        entries[_EM] = input[_EM];
      }
      return entries;
    }, "se_DecodeAuthorizationMessageRequest");
    var se_GetAccessKeyInfoRequest = /* @__PURE__ */ __name((input, context) => {
      const entries = {};
      if (input[_AKI] != null) {
        entries[_AKI] = input[_AKI];
      }
      return entries;
    }, "se_GetAccessKeyInfoRequest");
    var se_GetCallerIdentityRequest = /* @__PURE__ */ __name((input, context) => {
      const entries = {};
      return entries;
    }, "se_GetCallerIdentityRequest");
    var se_GetFederationTokenRequest = /* @__PURE__ */ __name((input, context) => {
      var _a2, _b;
      const entries = {};
      if (input[_N] != null) {
        entries[_N] = input[_N];
      }
      if (input[_P] != null) {
        entries[_P] = input[_P];
      }
      if (input[_PA] != null) {
        const memberEntries = se_policyDescriptorListType(input[_PA], context);
        if (((_a2 = input[_PA]) == null ? void 0 : _a2.length) === 0) {
          entries.PolicyArns = [];
        }
        Object.entries(memberEntries).forEach(([key, value]) => {
          const loc = `PolicyArns.${key}`;
          entries[loc] = value;
        });
      }
      if (input[_DS] != null) {
        entries[_DS] = input[_DS];
      }
      if (input[_T] != null) {
        const memberEntries = se_tagListType(input[_T], context);
        if (((_b = input[_T]) == null ? void 0 : _b.length) === 0) {
          entries.Tags = [];
        }
        Object.entries(memberEntries).forEach(([key, value]) => {
          const loc = `Tags.${key}`;
          entries[loc] = value;
        });
      }
      return entries;
    }, "se_GetFederationTokenRequest");
    var se_GetSessionTokenRequest = /* @__PURE__ */ __name((input, context) => {
      const entries = {};
      if (input[_DS] != null) {
        entries[_DS] = input[_DS];
      }
      if (input[_SN] != null) {
        entries[_SN] = input[_SN];
      }
      if (input[_TC] != null) {
        entries[_TC] = input[_TC];
      }
      return entries;
    }, "se_GetSessionTokenRequest");
    var se_policyDescriptorListType = /* @__PURE__ */ __name((input, context) => {
      const entries = {};
      let counter = 1;
      for (const entry of input) {
        if (entry === null) {
          continue;
        }
        const memberEntries = se_PolicyDescriptorType(entry, context);
        Object.entries(memberEntries).forEach(([key, value]) => {
          entries[`member.${counter}.${key}`] = value;
        });
        counter++;
      }
      return entries;
    }, "se_policyDescriptorListType");
    var se_PolicyDescriptorType = /* @__PURE__ */ __name((input, context) => {
      const entries = {};
      if (input[_a] != null) {
        entries[_a] = input[_a];
      }
      return entries;
    }, "se_PolicyDescriptorType");
    var se_ProvidedContext = /* @__PURE__ */ __name((input, context) => {
      const entries = {};
      if (input[_PAro] != null) {
        entries[_PAro] = input[_PAro];
      }
      if (input[_CA] != null) {
        entries[_CA] = input[_CA];
      }
      return entries;
    }, "se_ProvidedContext");
    var se_ProvidedContextsListType = /* @__PURE__ */ __name((input, context) => {
      const entries = {};
      let counter = 1;
      for (const entry of input) {
        if (entry === null) {
          continue;
        }
        const memberEntries = se_ProvidedContext(entry, context);
        Object.entries(memberEntries).forEach(([key, value]) => {
          entries[`member.${counter}.${key}`] = value;
        });
        counter++;
      }
      return entries;
    }, "se_ProvidedContextsListType");
    var se_Tag = /* @__PURE__ */ __name((input, context) => {
      const entries = {};
      if (input[_K] != null) {
        entries[_K] = input[_K];
      }
      if (input[_Va] != null) {
        entries[_Va] = input[_Va];
      }
      return entries;
    }, "se_Tag");
    var se_tagKeyListType = /* @__PURE__ */ __name((input, context) => {
      const entries = {};
      let counter = 1;
      for (const entry of input) {
        if (entry === null) {
          continue;
        }
        entries[`member.${counter}`] = entry;
        counter++;
      }
      return entries;
    }, "se_tagKeyListType");
    var se_tagListType = /* @__PURE__ */ __name((input, context) => {
      const entries = {};
      let counter = 1;
      for (const entry of input) {
        if (entry === null) {
          continue;
        }
        const memberEntries = se_Tag(entry, context);
        Object.entries(memberEntries).forEach(([key, value]) => {
          entries[`member.${counter}.${key}`] = value;
        });
        counter++;
      }
      return entries;
    }, "se_tagListType");
    var de_AssumedRoleUser = /* @__PURE__ */ __name((output, context) => {
      const contents = {};
      if (output[_ARI] != null) {
        contents[_ARI] = (0, import_smithy_client5.expectString)(output[_ARI]);
      }
      if (output[_Ar] != null) {
        contents[_Ar] = (0, import_smithy_client5.expectString)(output[_Ar]);
      }
      return contents;
    }, "de_AssumedRoleUser");
    var de_AssumeRoleResponse = /* @__PURE__ */ __name((output, context) => {
      const contents = {};
      if (output[_C] != null) {
        contents[_C] = de_Credentials(output[_C], context);
      }
      if (output[_ARU] != null) {
        contents[_ARU] = de_AssumedRoleUser(output[_ARU], context);
      }
      if (output[_PPS] != null) {
        contents[_PPS] = (0, import_smithy_client5.strictParseInt32)(output[_PPS]);
      }
      if (output[_SI] != null) {
        contents[_SI] = (0, import_smithy_client5.expectString)(output[_SI]);
      }
      return contents;
    }, "de_AssumeRoleResponse");
    var de_AssumeRoleWithSAMLResponse = /* @__PURE__ */ __name((output, context) => {
      const contents = {};
      if (output[_C] != null) {
        contents[_C] = de_Credentials(output[_C], context);
      }
      if (output[_ARU] != null) {
        contents[_ARU] = de_AssumedRoleUser(output[_ARU], context);
      }
      if (output[_PPS] != null) {
        contents[_PPS] = (0, import_smithy_client5.strictParseInt32)(output[_PPS]);
      }
      if (output[_S] != null) {
        contents[_S] = (0, import_smithy_client5.expectString)(output[_S]);
      }
      if (output[_ST] != null) {
        contents[_ST] = (0, import_smithy_client5.expectString)(output[_ST]);
      }
      if (output[_I] != null) {
        contents[_I] = (0, import_smithy_client5.expectString)(output[_I]);
      }
      if (output[_Au] != null) {
        contents[_Au] = (0, import_smithy_client5.expectString)(output[_Au]);
      }
      if (output[_NQ] != null) {
        contents[_NQ] = (0, import_smithy_client5.expectString)(output[_NQ]);
      }
      if (output[_SI] != null) {
        contents[_SI] = (0, import_smithy_client5.expectString)(output[_SI]);
      }
      return contents;
    }, "de_AssumeRoleWithSAMLResponse");
    var de_AssumeRoleWithWebIdentityResponse = /* @__PURE__ */ __name((output, context) => {
      const contents = {};
      if (output[_C] != null) {
        contents[_C] = de_Credentials(output[_C], context);
      }
      if (output[_SFWIT] != null) {
        contents[_SFWIT] = (0, import_smithy_client5.expectString)(output[_SFWIT]);
      }
      if (output[_ARU] != null) {
        contents[_ARU] = de_AssumedRoleUser(output[_ARU], context);
      }
      if (output[_PPS] != null) {
        contents[_PPS] = (0, import_smithy_client5.strictParseInt32)(output[_PPS]);
      }
      if (output[_Pr] != null) {
        contents[_Pr] = (0, import_smithy_client5.expectString)(output[_Pr]);
      }
      if (output[_Au] != null) {
        contents[_Au] = (0, import_smithy_client5.expectString)(output[_Au]);
      }
      if (output[_SI] != null) {
        contents[_SI] = (0, import_smithy_client5.expectString)(output[_SI]);
      }
      return contents;
    }, "de_AssumeRoleWithWebIdentityResponse");
    var de_Credentials = /* @__PURE__ */ __name((output, context) => {
      const contents = {};
      if (output[_AKI] != null) {
        contents[_AKI] = (0, import_smithy_client5.expectString)(output[_AKI]);
      }
      if (output[_SAK] != null) {
        contents[_SAK] = (0, import_smithy_client5.expectString)(output[_SAK]);
      }
      if (output[_STe] != null) {
        contents[_STe] = (0, import_smithy_client5.expectString)(output[_STe]);
      }
      if (output[_E] != null) {
        contents[_E] = (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.parseRfc3339DateTimeWithOffset)(output[_E]));
      }
      return contents;
    }, "de_Credentials");
    var de_DecodeAuthorizationMessageResponse = /* @__PURE__ */ __name((output, context) => {
      const contents = {};
      if (output[_DM] != null) {
        contents[_DM] = (0, import_smithy_client5.expectString)(output[_DM]);
      }
      return contents;
    }, "de_DecodeAuthorizationMessageResponse");
    var de_ExpiredTokenException = /* @__PURE__ */ __name((output, context) => {
      const contents = {};
      if (output[_m] != null) {
        contents[_m] = (0, import_smithy_client5.expectString)(output[_m]);
      }
      return contents;
    }, "de_ExpiredTokenException");
    var de_FederatedUser = /* @__PURE__ */ __name((output, context) => {
      const contents = {};
      if (output[_FUI] != null) {
        contents[_FUI] = (0, import_smithy_client5.expectString)(output[_FUI]);
      }
      if (output[_Ar] != null) {
        contents[_Ar] = (0, import_smithy_client5.expectString)(output[_Ar]);
      }
      return contents;
    }, "de_FederatedUser");
    var de_GetAccessKeyInfoResponse = /* @__PURE__ */ __name((output, context) => {
      const contents = {};
      if (output[_Ac] != null) {
        contents[_Ac] = (0, import_smithy_client5.expectString)(output[_Ac]);
      }
      return contents;
    }, "de_GetAccessKeyInfoResponse");
    var de_GetCallerIdentityResponse = /* @__PURE__ */ __name((output, context) => {
      const contents = {};
      if (output[_UI] != null) {
        contents[_UI] = (0, import_smithy_client5.expectString)(output[_UI]);
      }
      if (output[_Ac] != null) {
        contents[_Ac] = (0, import_smithy_client5.expectString)(output[_Ac]);
      }
      if (output[_Ar] != null) {
        contents[_Ar] = (0, import_smithy_client5.expectString)(output[_Ar]);
      }
      return contents;
    }, "de_GetCallerIdentityResponse");
    var de_GetFederationTokenResponse = /* @__PURE__ */ __name((output, context) => {
      const contents = {};
      if (output[_C] != null) {
        contents[_C] = de_Credentials(output[_C], context);
      }
      if (output[_FU] != null) {
        contents[_FU] = de_FederatedUser(output[_FU], context);
      }
      if (output[_PPS] != null) {
        contents[_PPS] = (0, import_smithy_client5.strictParseInt32)(output[_PPS]);
      }
      return contents;
    }, "de_GetFederationTokenResponse");
    var de_GetSessionTokenResponse = /* @__PURE__ */ __name((output, context) => {
      const contents = {};
      if (output[_C] != null) {
        contents[_C] = de_Credentials(output[_C], context);
      }
      return contents;
    }, "de_GetSessionTokenResponse");
    var de_IDPCommunicationErrorException = /* @__PURE__ */ __name((output, context) => {
      const contents = {};
      if (output[_m] != null) {
        contents[_m] = (0, import_smithy_client5.expectString)(output[_m]);
      }
      return contents;
    }, "de_IDPCommunicationErrorException");
    var de_IDPRejectedClaimException = /* @__PURE__ */ __name((output, context) => {
      const contents = {};
      if (output[_m] != null) {
        contents[_m] = (0, import_smithy_client5.expectString)(output[_m]);
      }
      return contents;
    }, "de_IDPRejectedClaimException");
    var de_InvalidAuthorizationMessageException = /* @__PURE__ */ __name((output, context) => {
      const contents = {};
      if (output[_m] != null) {
        contents[_m] = (0, import_smithy_client5.expectString)(output[_m]);
      }
      return contents;
    }, "de_InvalidAuthorizationMessageException");
    var de_InvalidIdentityTokenException = /* @__PURE__ */ __name((output, context) => {
      const contents = {};
      if (output[_m] != null) {
        contents[_m] = (0, import_smithy_client5.expectString)(output[_m]);
      }
      return contents;
    }, "de_InvalidIdentityTokenException");
    var de_MalformedPolicyDocumentException = /* @__PURE__ */ __name((output, context) => {
      const contents = {};
      if (output[_m] != null) {
        contents[_m] = (0, import_smithy_client5.expectString)(output[_m]);
      }
      return contents;
    }, "de_MalformedPolicyDocumentException");
    var de_PackedPolicyTooLargeException = /* @__PURE__ */ __name((output, context) => {
      const contents = {};
      if (output[_m] != null) {
        contents[_m] = (0, import_smithy_client5.expectString)(output[_m]);
      }
      return contents;
    }, "de_PackedPolicyTooLargeException");
    var de_RegionDisabledException = /* @__PURE__ */ __name((output, context) => {
      const contents = {};
      if (output[_m] != null) {
        contents[_m] = (0, import_smithy_client5.expectString)(output[_m]);
      }
      return contents;
    }, "de_RegionDisabledException");
    var deserializeMetadata = /* @__PURE__ */ __name((output) => ({
      httpStatusCode: output.statusCode,
      requestId: output.headers["x-amzn-requestid"] ?? output.headers["x-amzn-request-id"] ?? output.headers["x-amz-request-id"],
      extendedRequestId: output.headers["x-amz-id-2"],
      cfId: output.headers["x-amz-cf-id"]
    }), "deserializeMetadata");
    var throwDefaultError = (0, import_smithy_client5.withBaseException)(STSServiceException);
    var buildHttpRpcRequest = /* @__PURE__ */ __name(async (context, headers, path, resolvedHostname, body) => {
      const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
      const contents = {
        protocol,
        hostname,
        port,
        method: "POST",
        path: basePath.endsWith("/") ? basePath.slice(0, -1) + path : basePath + path,
        headers
      };
      if (resolvedHostname !== void 0) {
        contents.hostname = resolvedHostname;
      }
      if (body !== void 0) {
        contents.body = body;
      }
      return new import_protocol_http8.HttpRequest(contents);
    }, "buildHttpRpcRequest");
    var SHARED_HEADERS = {
      "content-type": "application/x-www-form-urlencoded"
    };
    var _ = "2011-06-15";
    var _A = "Action";
    var _AKI = "AccessKeyId";
    var _AR = "AssumeRole";
    var _ARI = "AssumedRoleId";
    var _ARU = "AssumedRoleUser";
    var _ARWSAML = "AssumeRoleWithSAML";
    var _ARWWI = "AssumeRoleWithWebIdentity";
    var _Ac = "Account";
    var _Ar = "Arn";
    var _Au = "Audience";
    var _C = "Credentials";
    var _CA = "ContextAssertion";
    var _DAM = "DecodeAuthorizationMessage";
    var _DM = "DecodedMessage";
    var _DS = "DurationSeconds";
    var _E = "Expiration";
    var _EI = "ExternalId";
    var _EM = "EncodedMessage";
    var _FU = "FederatedUser";
    var _FUI = "FederatedUserId";
    var _GAKI = "GetAccessKeyInfo";
    var _GCI = "GetCallerIdentity";
    var _GFT = "GetFederationToken";
    var _GST = "GetSessionToken";
    var _I = "Issuer";
    var _K = "Key";
    var _N = "Name";
    var _NQ = "NameQualifier";
    var _P = "Policy";
    var _PA = "PolicyArns";
    var _PAr = "PrincipalArn";
    var _PAro = "ProviderArn";
    var _PC = "ProvidedContexts";
    var _PI = "ProviderId";
    var _PPS = "PackedPolicySize";
    var _Pr = "Provider";
    var _RA = "RoleArn";
    var _RSN = "RoleSessionName";
    var _S = "Subject";
    var _SAK = "SecretAccessKey";
    var _SAMLA = "SAMLAssertion";
    var _SFWIT = "SubjectFromWebIdentityToken";
    var _SI = "SourceIdentity";
    var _SN = "SerialNumber";
    var _ST = "SubjectType";
    var _STe = "SessionToken";
    var _T = "Tags";
    var _TC = "TokenCode";
    var _TTK = "TransitiveTagKeys";
    var _UI = "UserId";
    var _V = "Version";
    var _Va = "Value";
    var _WIT = "WebIdentityToken";
    var _a = "arn";
    var _m = "message";
    var buildFormUrlencodedString = /* @__PURE__ */ __name((formEntries) => Object.entries(formEntries).map(([key, value]) => (0, import_smithy_client5.extendedEncodeURIComponent)(key) + "=" + (0, import_smithy_client5.extendedEncodeURIComponent)(value)).join("&"), "buildFormUrlencodedString");
    var loadQueryErrorCode = /* @__PURE__ */ __name((output, data) => {
      var _a2;
      if (((_a2 = data.Error) == null ? void 0 : _a2.Code) !== void 0) {
        return data.Error.Code;
      }
      if (output.statusCode == 404) {
        return "NotFound";
      }
    }, "loadQueryErrorCode");
    var _AssumeRoleCommand = class _AssumeRoleCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...import_EndpointParameters.commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("AWSSecurityTokenServiceV20110615", "AssumeRole", {}).n("STSClient", "AssumeRoleCommand").f(void 0, AssumeRoleResponseFilterSensitiveLog).ser(se_AssumeRoleCommand).de(de_AssumeRoleCommand).build() {
    };
    __name(_AssumeRoleCommand, "AssumeRoleCommand");
    var AssumeRoleCommand = _AssumeRoleCommand;
    var import_EndpointParameters2 = require_EndpointParameters();
    var _AssumeRoleWithSAMLCommand = class _AssumeRoleWithSAMLCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...import_EndpointParameters2.commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("AWSSecurityTokenServiceV20110615", "AssumeRoleWithSAML", {}).n("STSClient", "AssumeRoleWithSAMLCommand").f(AssumeRoleWithSAMLRequestFilterSensitiveLog, AssumeRoleWithSAMLResponseFilterSensitiveLog).ser(se_AssumeRoleWithSAMLCommand).de(de_AssumeRoleWithSAMLCommand).build() {
    };
    __name(_AssumeRoleWithSAMLCommand, "AssumeRoleWithSAMLCommand");
    var AssumeRoleWithSAMLCommand = _AssumeRoleWithSAMLCommand;
    var import_EndpointParameters3 = require_EndpointParameters();
    var _AssumeRoleWithWebIdentityCommand = class _AssumeRoleWithWebIdentityCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...import_EndpointParameters3.commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("AWSSecurityTokenServiceV20110615", "AssumeRoleWithWebIdentity", {}).n("STSClient", "AssumeRoleWithWebIdentityCommand").f(AssumeRoleWithWebIdentityRequestFilterSensitiveLog, AssumeRoleWithWebIdentityResponseFilterSensitiveLog).ser(se_AssumeRoleWithWebIdentityCommand).de(de_AssumeRoleWithWebIdentityCommand).build() {
    };
    __name(_AssumeRoleWithWebIdentityCommand, "AssumeRoleWithWebIdentityCommand");
    var AssumeRoleWithWebIdentityCommand = _AssumeRoleWithWebIdentityCommand;
    var import_EndpointParameters4 = require_EndpointParameters();
    var _DecodeAuthorizationMessageCommand = class _DecodeAuthorizationMessageCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...import_EndpointParameters4.commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("AWSSecurityTokenServiceV20110615", "DecodeAuthorizationMessage", {}).n("STSClient", "DecodeAuthorizationMessageCommand").f(void 0, void 0).ser(se_DecodeAuthorizationMessageCommand).de(de_DecodeAuthorizationMessageCommand).build() {
    };
    __name(_DecodeAuthorizationMessageCommand, "DecodeAuthorizationMessageCommand");
    var DecodeAuthorizationMessageCommand = _DecodeAuthorizationMessageCommand;
    var import_EndpointParameters5 = require_EndpointParameters();
    var _GetAccessKeyInfoCommand = class _GetAccessKeyInfoCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...import_EndpointParameters5.commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("AWSSecurityTokenServiceV20110615", "GetAccessKeyInfo", {}).n("STSClient", "GetAccessKeyInfoCommand").f(void 0, void 0).ser(se_GetAccessKeyInfoCommand).de(de_GetAccessKeyInfoCommand).build() {
    };
    __name(_GetAccessKeyInfoCommand, "GetAccessKeyInfoCommand");
    var GetAccessKeyInfoCommand = _GetAccessKeyInfoCommand;
    var import_EndpointParameters6 = require_EndpointParameters();
    var _GetCallerIdentityCommand = class _GetCallerIdentityCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...import_EndpointParameters6.commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("AWSSecurityTokenServiceV20110615", "GetCallerIdentity", {}).n("STSClient", "GetCallerIdentityCommand").f(void 0, void 0).ser(se_GetCallerIdentityCommand).de(de_GetCallerIdentityCommand).build() {
    };
    __name(_GetCallerIdentityCommand, "GetCallerIdentityCommand");
    var GetCallerIdentityCommand = _GetCallerIdentityCommand;
    var import_EndpointParameters7 = require_EndpointParameters();
    var _GetFederationTokenCommand = class _GetFederationTokenCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...import_EndpointParameters7.commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("AWSSecurityTokenServiceV20110615", "GetFederationToken", {}).n("STSClient", "GetFederationTokenCommand").f(void 0, GetFederationTokenResponseFilterSensitiveLog).ser(se_GetFederationTokenCommand).de(de_GetFederationTokenCommand).build() {
    };
    __name(_GetFederationTokenCommand, "GetFederationTokenCommand");
    var GetFederationTokenCommand = _GetFederationTokenCommand;
    var import_EndpointParameters8 = require_EndpointParameters();
    var _GetSessionTokenCommand = class _GetSessionTokenCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...import_EndpointParameters8.commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("AWSSecurityTokenServiceV20110615", "GetSessionToken", {}).n("STSClient", "GetSessionTokenCommand").f(void 0, GetSessionTokenResponseFilterSensitiveLog).ser(se_GetSessionTokenCommand).de(de_GetSessionTokenCommand).build() {
    };
    __name(_GetSessionTokenCommand, "GetSessionTokenCommand");
    var GetSessionTokenCommand = _GetSessionTokenCommand;
    var import_STSClient = require_STSClient();
    var commands = {
      AssumeRoleCommand,
      AssumeRoleWithSAMLCommand,
      AssumeRoleWithWebIdentityCommand,
      DecodeAuthorizationMessageCommand,
      GetAccessKeyInfoCommand,
      GetCallerIdentityCommand,
      GetFederationTokenCommand,
      GetSessionTokenCommand
    };
    var _STS = class _STS extends import_STSClient.STSClient {
    };
    __name(_STS, "STS");
    var STS = _STS;
    (0, import_smithy_client5.createAggregatedClient)(commands, STS);
    var import_EndpointParameters9 = require_EndpointParameters();
    var ASSUME_ROLE_DEFAULT_REGION = "us-east-1";
    var getAccountIdFromAssumedRoleUser = /* @__PURE__ */ __name((assumedRoleUser) => {
      if (typeof (assumedRoleUser == null ? void 0 : assumedRoleUser.Arn) === "string") {
        const arnComponents = assumedRoleUser.Arn.split(":");
        if (arnComponents.length > 4 && arnComponents[4] !== "") {
          return arnComponents[4];
        }
      }
      return void 0;
    }, "getAccountIdFromAssumedRoleUser");
    var resolveRegion = /* @__PURE__ */ __name(async (_region, _parentRegion, credentialProviderLogger) => {
      var _a2;
      const region = typeof _region === "function" ? await _region() : _region;
      const parentRegion = typeof _parentRegion === "function" ? await _parentRegion() : _parentRegion;
      (_a2 = credentialProviderLogger == null ? void 0 : credentialProviderLogger.debug) == null ? void 0 : _a2.call(
        credentialProviderLogger,
        "@aws-sdk/client-sts::resolveRegion",
        "accepting first of:",
        `${region} (provider)`,
        `${parentRegion} (parent client)`,
        `${ASSUME_ROLE_DEFAULT_REGION} (STS default)`
      );
      return region ?? parentRegion ?? ASSUME_ROLE_DEFAULT_REGION;
    }, "resolveRegion");
    var getDefaultRoleAssumer = /* @__PURE__ */ __name((stsOptions, stsClientCtor) => {
      let stsClient;
      let closureSourceCreds;
      return async (sourceCreds, params) => {
        var _a2, _b, _c;
        closureSourceCreds = sourceCreds;
        if (!stsClient) {
          const {
            logger = (_a2 = stsOptions == null ? void 0 : stsOptions.parentClientConfig) == null ? void 0 : _a2.logger,
            region,
            requestHandler = (_b = stsOptions == null ? void 0 : stsOptions.parentClientConfig) == null ? void 0 : _b.requestHandler,
            credentialProviderLogger
          } = stsOptions;
          const resolvedRegion = await resolveRegion(
            region,
            (_c = stsOptions == null ? void 0 : stsOptions.parentClientConfig) == null ? void 0 : _c.region,
            credentialProviderLogger
          );
          const isCompatibleRequestHandler = !isH2(requestHandler);
          stsClient = new stsClientCtor({
            // A hack to make sts client uses the credential in current closure.
            credentialDefaultProvider: () => async () => closureSourceCreds,
            region: resolvedRegion,
            requestHandler: isCompatibleRequestHandler ? requestHandler : void 0,
            logger
          });
        }
        const { Credentials: Credentials2, AssumedRoleUser: AssumedRoleUser2 } = await stsClient.send(new AssumeRoleCommand(params));
        if (!Credentials2 || !Credentials2.AccessKeyId || !Credentials2.SecretAccessKey) {
          throw new Error(`Invalid response from STS.assumeRole call with role ${params.RoleArn}`);
        }
        const accountId = getAccountIdFromAssumedRoleUser(AssumedRoleUser2);
        return {
          accessKeyId: Credentials2.AccessKeyId,
          secretAccessKey: Credentials2.SecretAccessKey,
          sessionToken: Credentials2.SessionToken,
          expiration: Credentials2.Expiration,
          // TODO(credentialScope): access normally when shape is updated.
          ...Credentials2.CredentialScope && { credentialScope: Credentials2.CredentialScope },
          ...accountId && { accountId }
        };
      };
    }, "getDefaultRoleAssumer");
    var getDefaultRoleAssumerWithWebIdentity = /* @__PURE__ */ __name((stsOptions, stsClientCtor) => {
      let stsClient;
      return async (params) => {
        var _a2, _b, _c;
        if (!stsClient) {
          const {
            logger = (_a2 = stsOptions == null ? void 0 : stsOptions.parentClientConfig) == null ? void 0 : _a2.logger,
            region,
            requestHandler = (_b = stsOptions == null ? void 0 : stsOptions.parentClientConfig) == null ? void 0 : _b.requestHandler,
            credentialProviderLogger
          } = stsOptions;
          const resolvedRegion = await resolveRegion(
            region,
            (_c = stsOptions == null ? void 0 : stsOptions.parentClientConfig) == null ? void 0 : _c.region,
            credentialProviderLogger
          );
          const isCompatibleRequestHandler = !isH2(requestHandler);
          stsClient = new stsClientCtor({
            region: resolvedRegion,
            requestHandler: isCompatibleRequestHandler ? requestHandler : void 0,
            logger
          });
        }
        const { Credentials: Credentials2, AssumedRoleUser: AssumedRoleUser2 } = await stsClient.send(new AssumeRoleWithWebIdentityCommand(params));
        if (!Credentials2 || !Credentials2.AccessKeyId || !Credentials2.SecretAccessKey) {
          throw new Error(`Invalid response from STS.assumeRoleWithWebIdentity call with role ${params.RoleArn}`);
        }
        const accountId = getAccountIdFromAssumedRoleUser(AssumedRoleUser2);
        return {
          accessKeyId: Credentials2.AccessKeyId,
          secretAccessKey: Credentials2.SecretAccessKey,
          sessionToken: Credentials2.SessionToken,
          expiration: Credentials2.Expiration,
          // TODO(credentialScope): access normally when shape is updated.
          ...Credentials2.CredentialScope && { credentialScope: Credentials2.CredentialScope },
          ...accountId && { accountId }
        };
      };
    }, "getDefaultRoleAssumerWithWebIdentity");
    var isH2 = /* @__PURE__ */ __name((requestHandler) => {
      var _a2;
      return ((_a2 = requestHandler == null ? void 0 : requestHandler.metadata) == null ? void 0 : _a2.handlerProtocol) === "h2";
    }, "isH2");
    var import_STSClient2 = require_STSClient();
    var getCustomizableStsClientCtor = /* @__PURE__ */ __name((baseCtor, customizations) => {
      var _a2;
      if (!customizations)
        return baseCtor;
      else
        return _a2 = class extends baseCtor {
          constructor(config) {
            super(config);
            for (const customization of customizations) {
              this.middlewareStack.use(customization);
            }
          }
        }, __name(_a2, "CustomizableSTSClient"), _a2;
    }, "getCustomizableStsClientCtor");
    var getDefaultRoleAssumer2 = /* @__PURE__ */ __name((stsOptions = {}, stsPlugins) => getDefaultRoleAssumer(stsOptions, getCustomizableStsClientCtor(import_STSClient2.STSClient, stsPlugins)), "getDefaultRoleAssumer");
    var getDefaultRoleAssumerWithWebIdentity2 = /* @__PURE__ */ __name((stsOptions = {}, stsPlugins) => getDefaultRoleAssumerWithWebIdentity(stsOptions, getCustomizableStsClientCtor(import_STSClient2.STSClient, stsPlugins)), "getDefaultRoleAssumerWithWebIdentity");
    var decorateDefaultCredentialProvider = /* @__PURE__ */ __name((provider) => (input) => provider({
      roleAssumer: getDefaultRoleAssumer2(input),
      roleAssumerWithWebIdentity: getDefaultRoleAssumerWithWebIdentity2(input),
      ...input
    }), "decorateDefaultCredentialProvider");
  }
});

// node_modules/@aws-sdk/credential-provider-process/dist-cjs/index.js
var require_dist_cjs49 = __commonJS({
  "node_modules/@aws-sdk/credential-provider-process/dist-cjs/index.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      fromProcess: () => fromProcess
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_shared_ini_file_loader = require_dist_cjs13();
    var import_property_provider2 = require_dist_cjs12();
    var import_child_process = require("child_process");
    var import_util = require("util");
    var getValidatedProcessCredentials = /* @__PURE__ */ __name((profileName, data, profiles) => {
      var _a;
      if (data.Version !== 1) {
        throw Error(`Profile ${profileName} credential_process did not return Version 1.`);
      }
      if (data.AccessKeyId === void 0 || data.SecretAccessKey === void 0) {
        throw Error(`Profile ${profileName} credential_process returned invalid credentials.`);
      }
      if (data.Expiration) {
        const currentTime = /* @__PURE__ */ new Date();
        const expireTime = new Date(data.Expiration);
        if (expireTime < currentTime) {
          throw Error(`Profile ${profileName} credential_process returned expired credentials.`);
        }
      }
      let accountId = data.AccountId;
      if (!accountId && ((_a = profiles == null ? void 0 : profiles[profileName]) == null ? void 0 : _a.aws_account_id)) {
        accountId = profiles[profileName].aws_account_id;
      }
      return {
        accessKeyId: data.AccessKeyId,
        secretAccessKey: data.SecretAccessKey,
        ...data.SessionToken && { sessionToken: data.SessionToken },
        ...data.Expiration && { expiration: new Date(data.Expiration) },
        ...data.CredentialScope && { credentialScope: data.CredentialScope },
        ...accountId && { accountId }
      };
    }, "getValidatedProcessCredentials");
    var resolveProcessCredentials = /* @__PURE__ */ __name(async (profileName, profiles, logger) => {
      const profile = profiles[profileName];
      if (profiles[profileName]) {
        const credentialProcess = profile["credential_process"];
        if (credentialProcess !== void 0) {
          const execPromise = (0, import_util.promisify)(import_child_process.exec);
          try {
            const { stdout } = await execPromise(credentialProcess);
            let data;
            try {
              data = JSON.parse(stdout.trim());
            } catch {
              throw Error(`Profile ${profileName} credential_process returned invalid JSON.`);
            }
            return getValidatedProcessCredentials(profileName, data, profiles);
          } catch (error) {
            throw new import_property_provider2.CredentialsProviderError(error.message, { logger });
          }
        } else {
          throw new import_property_provider2.CredentialsProviderError(`Profile ${profileName} did not contain credential_process.`, { logger });
        }
      } else {
        throw new import_property_provider2.CredentialsProviderError(`Profile ${profileName} could not be found in shared credentials file.`, {
          logger
        });
      }
    }, "resolveProcessCredentials");
    var fromProcess = /* @__PURE__ */ __name((init = {}) => async () => {
      var _a;
      (_a = init.logger) == null ? void 0 : _a.debug("@aws-sdk/credential-provider-process - fromProcess");
      const profiles = await (0, import_shared_ini_file_loader.parseKnownFiles)(init);
      return resolveProcessCredentials((0, import_shared_ini_file_loader.getProfileName)(init), profiles, init.logger);
    }, "fromProcess");
  }
});

// node_modules/@aws-sdk/credential-provider-web-identity/dist-cjs/fromWebToken.js
var require_fromWebToken = __commonJS({
  "node_modules/@aws-sdk/credential-provider-web-identity/dist-cjs/fromWebToken.js"(exports2) {
    "use strict";
    var __createBinding2 = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault2 = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar2 = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding2(result, mod, k);
      }
      __setModuleDefault2(result, mod);
      return result;
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.fromWebToken = void 0;
    var fromWebToken2 = (init) => async () => {
      init.logger?.debug("@aws-sdk/credential-provider-web-identity - fromWebToken");
      const { roleArn, roleSessionName, webIdentityToken, providerId, policyArns, policy, durationSeconds } = init;
      let { roleAssumerWithWebIdentity } = init;
      if (!roleAssumerWithWebIdentity) {
        const { getDefaultRoleAssumerWithWebIdentity } = await Promise.resolve().then(() => __importStar2(require_dist_cjs48()));
        roleAssumerWithWebIdentity = getDefaultRoleAssumerWithWebIdentity({
          ...init.clientConfig,
          credentialProviderLogger: init.logger,
          parentClientConfig: init.parentClientConfig
        }, init.clientPlugins);
      }
      return roleAssumerWithWebIdentity({
        RoleArn: roleArn,
        RoleSessionName: roleSessionName ?? `aws-sdk-js-session-${Date.now()}`,
        WebIdentityToken: webIdentityToken,
        ProviderId: providerId,
        PolicyArns: policyArns,
        Policy: policy,
        DurationSeconds: durationSeconds
      });
    };
    exports2.fromWebToken = fromWebToken2;
  }
});

// node_modules/@aws-sdk/credential-provider-web-identity/dist-cjs/fromTokenFile.js
var require_fromTokenFile = __commonJS({
  "node_modules/@aws-sdk/credential-provider-web-identity/dist-cjs/fromTokenFile.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.fromTokenFile = void 0;
    var property_provider_1 = require_dist_cjs12();
    var fs_1 = require("fs");
    var fromWebToken_1 = require_fromWebToken();
    var ENV_TOKEN_FILE = "AWS_WEB_IDENTITY_TOKEN_FILE";
    var ENV_ROLE_ARN = "AWS_ROLE_ARN";
    var ENV_ROLE_SESSION_NAME = "AWS_ROLE_SESSION_NAME";
    var fromTokenFile2 = (init = {}) => async () => {
      init.logger?.debug("@aws-sdk/credential-provider-web-identity - fromTokenFile");
      const webIdentityTokenFile = init?.webIdentityTokenFile ?? process.env[ENV_TOKEN_FILE];
      const roleArn = init?.roleArn ?? process.env[ENV_ROLE_ARN];
      const roleSessionName = init?.roleSessionName ?? process.env[ENV_ROLE_SESSION_NAME];
      if (!webIdentityTokenFile || !roleArn) {
        throw new property_provider_1.CredentialsProviderError("Web identity configuration not specified", {
          logger: init.logger
        });
      }
      return (0, fromWebToken_1.fromWebToken)({
        ...init,
        webIdentityToken: (0, fs_1.readFileSync)(webIdentityTokenFile, { encoding: "ascii" }),
        roleArn,
        roleSessionName
      })();
    };
    exports2.fromTokenFile = fromTokenFile2;
  }
});

// node_modules/@aws-sdk/credential-provider-web-identity/dist-cjs/index.js
var require_dist_cjs50 = __commonJS({
  "node_modules/@aws-sdk/credential-provider-web-identity/dist-cjs/index.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __reExport = (target, mod, secondTarget) => (__copyProps2(target, mod, "default"), secondTarget && __copyProps2(secondTarget, mod, "default"));
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    module2.exports = __toCommonJS2(src_exports);
    __reExport(src_exports, require_fromTokenFile(), module2.exports);
    __reExport(src_exports, require_fromWebToken(), module2.exports);
  }
});

// node_modules/@aws-sdk/credential-provider-ini/dist-cjs/index.js
var require_dist_cjs51 = __commonJS({
  "node_modules/@aws-sdk/credential-provider-ini/dist-cjs/index.js"(exports2, module2) {
    "use strict";
    var __create2 = Object.create;
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf2 = Object.getPrototypeOf;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      fromIni: () => fromIni
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_shared_ini_file_loader = require_dist_cjs13();
    var import_property_provider2 = require_dist_cjs12();
    var resolveCredentialSource = /* @__PURE__ */ __name((credentialSource, profileName, logger) => {
      const sourceProvidersMap = {
        EcsContainer: async (options) => {
          const { fromHttp } = await Promise.resolve().then(() => __toESM2(require_dist_cjs38()));
          const { fromContainerMetadata } = await Promise.resolve().then(() => __toESM2(require_dist_cjs37()));
          logger == null ? void 0 : logger.debug("@aws-sdk/credential-provider-ini - credential_source is EcsContainer");
          return (0, import_property_provider2.chain)(fromHttp(options ?? {}), fromContainerMetadata(options));
        },
        Ec2InstanceMetadata: async (options) => {
          logger == null ? void 0 : logger.debug("@aws-sdk/credential-provider-ini - credential_source is Ec2InstanceMetadata");
          const { fromInstanceMetadata } = await Promise.resolve().then(() => __toESM2(require_dist_cjs37()));
          return fromInstanceMetadata(options);
        },
        Environment: async (options) => {
          logger == null ? void 0 : logger.debug("@aws-sdk/credential-provider-ini - credential_source is Environment");
          const { fromEnv } = await Promise.resolve().then(() => __toESM2(require_dist_cjs36()));
          return fromEnv(options);
        }
      };
      if (credentialSource in sourceProvidersMap) {
        return sourceProvidersMap[credentialSource];
      } else {
        throw new import_property_provider2.CredentialsProviderError(
          `Unsupported credential source in profile ${profileName}. Got ${credentialSource}, expected EcsContainer or Ec2InstanceMetadata or Environment.`,
          { logger }
        );
      }
    }, "resolveCredentialSource");
    var isAssumeRoleProfile = /* @__PURE__ */ __name((arg, { profile = "default", logger } = {}) => {
      return Boolean(arg) && typeof arg === "object" && typeof arg.role_arn === "string" && ["undefined", "string"].indexOf(typeof arg.role_session_name) > -1 && ["undefined", "string"].indexOf(typeof arg.external_id) > -1 && ["undefined", "string"].indexOf(typeof arg.mfa_serial) > -1 && (isAssumeRoleWithSourceProfile(arg, { profile, logger }) || isCredentialSourceProfile(arg, { profile, logger }));
    }, "isAssumeRoleProfile");
    var isAssumeRoleWithSourceProfile = /* @__PURE__ */ __name((arg, { profile, logger }) => {
      var _a;
      const withSourceProfile = typeof arg.source_profile === "string" && typeof arg.credential_source === "undefined";
      if (withSourceProfile) {
        (_a = logger == null ? void 0 : logger.debug) == null ? void 0 : _a.call(logger, `    ${profile} isAssumeRoleWithSourceProfile source_profile=${arg.source_profile}`);
      }
      return withSourceProfile;
    }, "isAssumeRoleWithSourceProfile");
    var isCredentialSourceProfile = /* @__PURE__ */ __name((arg, { profile, logger }) => {
      var _a;
      const withProviderProfile = typeof arg.credential_source === "string" && typeof arg.source_profile === "undefined";
      if (withProviderProfile) {
        (_a = logger == null ? void 0 : logger.debug) == null ? void 0 : _a.call(logger, `    ${profile} isCredentialSourceProfile credential_source=${arg.credential_source}`);
      }
      return withProviderProfile;
    }, "isCredentialSourceProfile");
    var resolveAssumeRoleCredentials = /* @__PURE__ */ __name(async (profileName, profiles, options, visitedProfiles = {}) => {
      var _a, _b;
      (_a = options.logger) == null ? void 0 : _a.debug("@aws-sdk/credential-provider-ini - resolveAssumeRoleCredentials (STS)");
      const data = profiles[profileName];
      if (!options.roleAssumer) {
        const { getDefaultRoleAssumer } = await Promise.resolve().then(() => __toESM2(require_dist_cjs48()));
        options.roleAssumer = getDefaultRoleAssumer(
          {
            ...options.clientConfig,
            credentialProviderLogger: options.logger,
            parentClientConfig: options == null ? void 0 : options.parentClientConfig
          },
          options.clientPlugins
        );
      }
      const { source_profile } = data;
      if (source_profile && source_profile in visitedProfiles) {
        throw new import_property_provider2.CredentialsProviderError(
          `Detected a cycle attempting to resolve credentials for profile ${(0, import_shared_ini_file_loader.getProfileName)(options)}. Profiles visited: ` + Object.keys(visitedProfiles).join(", "),
          { logger: options.logger }
        );
      }
      (_b = options.logger) == null ? void 0 : _b.debug(
        `@aws-sdk/credential-provider-ini - finding credential resolver using ${source_profile ? `source_profile=[${source_profile}]` : `profile=[${profileName}]`}`
      );
      const sourceCredsProvider = source_profile ? resolveProfileData(
        source_profile,
        {
          ...profiles,
          [source_profile]: {
            ...profiles[source_profile],
            // This assigns the role_arn of the "root" profile
            // to the credential_source profile so this recursive call knows
            // what role to assume.
            role_arn: data.role_arn ?? profiles[source_profile].role_arn
          }
        },
        options,
        {
          ...visitedProfiles,
          [source_profile]: true
        }
      ) : (await resolveCredentialSource(data.credential_source, profileName, options.logger)(options))();
      const params = {
        RoleArn: data.role_arn,
        RoleSessionName: data.role_session_name || `aws-sdk-js-${Date.now()}`,
        ExternalId: data.external_id,
        DurationSeconds: parseInt(data.duration_seconds || "3600", 10)
      };
      const { mfa_serial } = data;
      if (mfa_serial) {
        if (!options.mfaCodeProvider) {
          throw new import_property_provider2.CredentialsProviderError(
            `Profile ${profileName} requires multi-factor authentication, but no MFA code callback was provided.`,
            { logger: options.logger, tryNextLink: false }
          );
        }
        params.SerialNumber = mfa_serial;
        params.TokenCode = await options.mfaCodeProvider(mfa_serial);
      }
      const sourceCreds = await sourceCredsProvider;
      return options.roleAssumer(sourceCreds, params);
    }, "resolveAssumeRoleCredentials");
    var isProcessProfile = /* @__PURE__ */ __name((arg) => Boolean(arg) && typeof arg === "object" && typeof arg.credential_process === "string", "isProcessProfile");
    var resolveProcessCredentials = /* @__PURE__ */ __name(async (options, profile) => Promise.resolve().then(() => __toESM2(require_dist_cjs49())).then(
      ({ fromProcess }) => fromProcess({
        ...options,
        profile
      })()
    ), "resolveProcessCredentials");
    var resolveSsoCredentials = /* @__PURE__ */ __name(async (profile, options = {}) => {
      const { fromSSO } = await Promise.resolve().then(() => __toESM2(require_dist_cjs47()));
      return fromSSO({
        profile,
        logger: options.logger
      })();
    }, "resolveSsoCredentials");
    var isSsoProfile = /* @__PURE__ */ __name((arg) => arg && (typeof arg.sso_start_url === "string" || typeof arg.sso_account_id === "string" || typeof arg.sso_session === "string" || typeof arg.sso_region === "string" || typeof arg.sso_role_name === "string"), "isSsoProfile");
    var isStaticCredsProfile = /* @__PURE__ */ __name((arg) => Boolean(arg) && typeof arg === "object" && typeof arg.aws_access_key_id === "string" && typeof arg.aws_secret_access_key === "string" && ["undefined", "string"].indexOf(typeof arg.aws_session_token) > -1 && ["undefined", "string"].indexOf(typeof arg.aws_account_id) > -1, "isStaticCredsProfile");
    var resolveStaticCredentials = /* @__PURE__ */ __name((profile, options) => {
      var _a;
      (_a = options == null ? void 0 : options.logger) == null ? void 0 : _a.debug("@aws-sdk/credential-provider-ini - resolveStaticCredentials");
      return Promise.resolve({
        accessKeyId: profile.aws_access_key_id,
        secretAccessKey: profile.aws_secret_access_key,
        sessionToken: profile.aws_session_token,
        ...profile.aws_credential_scope && { credentialScope: profile.aws_credential_scope },
        ...profile.aws_account_id && { accountId: profile.aws_account_id }
      });
    }, "resolveStaticCredentials");
    var isWebIdentityProfile = /* @__PURE__ */ __name((arg) => Boolean(arg) && typeof arg === "object" && typeof arg.web_identity_token_file === "string" && typeof arg.role_arn === "string" && ["undefined", "string"].indexOf(typeof arg.role_session_name) > -1, "isWebIdentityProfile");
    var resolveWebIdentityCredentials = /* @__PURE__ */ __name(async (profile, options) => Promise.resolve().then(() => __toESM2(require_dist_cjs50())).then(
      ({ fromTokenFile: fromTokenFile2 }) => fromTokenFile2({
        webIdentityTokenFile: profile.web_identity_token_file,
        roleArn: profile.role_arn,
        roleSessionName: profile.role_session_name,
        roleAssumerWithWebIdentity: options.roleAssumerWithWebIdentity,
        logger: options.logger,
        parentClientConfig: options.parentClientConfig
      })()
    ), "resolveWebIdentityCredentials");
    var resolveProfileData = /* @__PURE__ */ __name(async (profileName, profiles, options, visitedProfiles = {}) => {
      const data = profiles[profileName];
      if (Object.keys(visitedProfiles).length > 0 && isStaticCredsProfile(data)) {
        return resolveStaticCredentials(data, options);
      }
      if (isAssumeRoleProfile(data, { profile: profileName, logger: options.logger })) {
        return resolveAssumeRoleCredentials(profileName, profiles, options, visitedProfiles);
      }
      if (isStaticCredsProfile(data)) {
        return resolveStaticCredentials(data, options);
      }
      if (isWebIdentityProfile(data)) {
        return resolveWebIdentityCredentials(data, options);
      }
      if (isProcessProfile(data)) {
        return resolveProcessCredentials(options, profileName);
      }
      if (isSsoProfile(data)) {
        return await resolveSsoCredentials(profileName, options);
      }
      throw new import_property_provider2.CredentialsProviderError(
        `Could not resolve credentials using profile: [${profileName}] in configuration/credentials file(s).`,
        { logger: options.logger }
      );
    }, "resolveProfileData");
    var fromIni = /* @__PURE__ */ __name((init = {}) => async () => {
      var _a;
      (_a = init.logger) == null ? void 0 : _a.debug("@aws-sdk/credential-provider-ini - fromIni");
      const profiles = await (0, import_shared_ini_file_loader.parseKnownFiles)(init);
      return resolveProfileData((0, import_shared_ini_file_loader.getProfileName)(init), profiles, init);
    }, "fromIni");
  }
});

// node_modules/@aws-sdk/credential-provider-node/dist-cjs/index.js
var require_dist_cjs52 = __commonJS({
  "node_modules/@aws-sdk/credential-provider-node/dist-cjs/index.js"(exports2, module2) {
    "use strict";
    var __create2 = Object.create;
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf2 = Object.getPrototypeOf;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      credentialsTreatedAsExpired: () => credentialsTreatedAsExpired,
      credentialsWillNeedRefresh: () => credentialsWillNeedRefresh,
      defaultProvider: () => defaultProvider
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_credential_provider_env = require_dist_cjs36();
    var import_shared_ini_file_loader = require_dist_cjs13();
    var import_property_provider2 = require_dist_cjs12();
    var ENV_IMDS_DISABLED = "AWS_EC2_METADATA_DISABLED";
    var remoteProvider = /* @__PURE__ */ __name(async (init) => {
      var _a, _b;
      const { ENV_CMDS_FULL_URI, ENV_CMDS_RELATIVE_URI, fromContainerMetadata, fromInstanceMetadata } = await Promise.resolve().then(() => __toESM2(require_dist_cjs37()));
      if (process.env[ENV_CMDS_RELATIVE_URI] || process.env[ENV_CMDS_FULL_URI]) {
        (_a = init.logger) == null ? void 0 : _a.debug("@aws-sdk/credential-provider-node - remoteProvider::fromHttp/fromContainerMetadata");
        const { fromHttp } = await Promise.resolve().then(() => __toESM2(require_dist_cjs38()));
        return (0, import_property_provider2.chain)(fromHttp(init), fromContainerMetadata(init));
      }
      if (process.env[ENV_IMDS_DISABLED]) {
        return async () => {
          throw new import_property_provider2.CredentialsProviderError("EC2 Instance Metadata Service access disabled", { logger: init.logger });
        };
      }
      (_b = init.logger) == null ? void 0 : _b.debug("@aws-sdk/credential-provider-node - remoteProvider::fromInstanceMetadata");
      return fromInstanceMetadata(init);
    }, "remoteProvider");
    var multipleCredentialSourceWarningEmitted = false;
    var defaultProvider = /* @__PURE__ */ __name((init = {}) => (0, import_property_provider2.memoize)(
      (0, import_property_provider2.chain)(
        async () => {
          var _a, _b, _c, _d;
          const profile = init.profile ?? process.env[import_shared_ini_file_loader.ENV_PROFILE];
          if (profile) {
            const envStaticCredentialsAreSet = process.env[import_credential_provider_env.ENV_KEY] && process.env[import_credential_provider_env.ENV_SECRET];
            if (envStaticCredentialsAreSet) {
              if (!multipleCredentialSourceWarningEmitted) {
                const warnFn = ((_a = init.logger) == null ? void 0 : _a.warn) && ((_c = (_b = init.logger) == null ? void 0 : _b.constructor) == null ? void 0 : _c.name) !== "NoOpLogger" ? init.logger.warn : console.warn;
                warnFn(
                  `@aws-sdk/credential-provider-node - defaultProvider::fromEnv WARNING:
    Multiple credential sources detected: 
    Both AWS_PROFILE and the pair AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY static credentials are set.
    This SDK will proceed with the AWS_PROFILE value.
    
    However, a future version may change this behavior to prefer the ENV static credentials.
    Please ensure that your environment only sets either the AWS_PROFILE or the
    AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY pair.
`
                );
                multipleCredentialSourceWarningEmitted = true;
              }
            }
            throw new import_property_provider2.CredentialsProviderError("AWS_PROFILE is set, skipping fromEnv provider.", {
              logger: init.logger,
              tryNextLink: true
            });
          }
          (_d = init.logger) == null ? void 0 : _d.debug("@aws-sdk/credential-provider-node - defaultProvider::fromEnv");
          return (0, import_credential_provider_env.fromEnv)(init)();
        },
        async () => {
          var _a;
          (_a = init.logger) == null ? void 0 : _a.debug("@aws-sdk/credential-provider-node - defaultProvider::fromSSO");
          const { ssoStartUrl, ssoAccountId, ssoRegion, ssoRoleName, ssoSession } = init;
          if (!ssoStartUrl && !ssoAccountId && !ssoRegion && !ssoRoleName && !ssoSession) {
            throw new import_property_provider2.CredentialsProviderError(
              "Skipping SSO provider in default chain (inputs do not include SSO fields).",
              { logger: init.logger }
            );
          }
          const { fromSSO } = await Promise.resolve().then(() => __toESM2(require_dist_cjs47()));
          return fromSSO(init)();
        },
        async () => {
          var _a;
          (_a = init.logger) == null ? void 0 : _a.debug("@aws-sdk/credential-provider-node - defaultProvider::fromIni");
          const { fromIni } = await Promise.resolve().then(() => __toESM2(require_dist_cjs51()));
          return fromIni(init)();
        },
        async () => {
          var _a;
          (_a = init.logger) == null ? void 0 : _a.debug("@aws-sdk/credential-provider-node - defaultProvider::fromProcess");
          const { fromProcess } = await Promise.resolve().then(() => __toESM2(require_dist_cjs49()));
          return fromProcess(init)();
        },
        async () => {
          var _a;
          (_a = init.logger) == null ? void 0 : _a.debug("@aws-sdk/credential-provider-node - defaultProvider::fromTokenFile");
          const { fromTokenFile: fromTokenFile2 } = await Promise.resolve().then(() => __toESM2(require_dist_cjs50()));
          return fromTokenFile2(init)();
        },
        async () => {
          var _a;
          (_a = init.logger) == null ? void 0 : _a.debug("@aws-sdk/credential-provider-node - defaultProvider::remoteProvider");
          return (await remoteProvider(init))();
        },
        async () => {
          throw new import_property_provider2.CredentialsProviderError("Could not load credentials from any providers", {
            tryNextLink: false,
            logger: init.logger
          });
        }
      ),
      credentialsTreatedAsExpired,
      credentialsWillNeedRefresh
    ), "defaultProvider");
    var credentialsWillNeedRefresh = /* @__PURE__ */ __name((credentials) => (credentials == null ? void 0 : credentials.expiration) !== void 0, "credentialsWillNeedRefresh");
    var credentialsTreatedAsExpired = /* @__PURE__ */ __name((credentials) => (credentials == null ? void 0 : credentials.expiration) !== void 0 && credentials.expiration.getTime() - Date.now() < 3e5, "credentialsTreatedAsExpired");
  }
});

// node_modules/@aws-sdk/client-secrets-manager/dist-cjs/endpoint/ruleset.js
var require_ruleset4 = __commonJS({
  "node_modules/@aws-sdk/client-secrets-manager/dist-cjs/endpoint/ruleset.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ruleSet = void 0;
    var y = "required";
    var z = "fn";
    var A = "argv";
    var B = "ref";
    var C = "properties";
    var D = "headers";
    var a = true;
    var b = "isSet";
    var c = "booleanEquals";
    var d = "error";
    var e = "endpoint";
    var f = "tree";
    var g = "PartitionResult";
    var h = "stringEquals";
    var i = { [y]: false, "type": "String" };
    var j = { [y]: true, "default": false, "type": "Boolean" };
    var k = { [B]: "Endpoint" };
    var l = { [z]: c, [A]: [{ [B]: "UseFIPS" }, true] };
    var m = { [z]: c, [A]: [{ [B]: "UseDualStack" }, true] };
    var n = {};
    var o = { [z]: "getAttr", [A]: [{ [B]: g }, "supportsFIPS"] };
    var p = { [z]: c, [A]: [true, { [z]: "getAttr", [A]: [{ [B]: g }, "supportsDualStack"] }] };
    var q = { [z]: "getAttr", [A]: [{ [B]: g }, "name"] };
    var r = { "url": "https://secretsmanager-fips.{Region}.amazonaws.com", [C]: {}, [D]: {} };
    var s = { "url": "https://secretsmanager.{Region}.amazonaws.com", [C]: {}, [D]: {} };
    var t = [l];
    var u = [m];
    var v = [{ [B]: "Region" }];
    var w = [{ [z]: h, [A]: ["aws", q] }];
    var x = [{ [z]: h, [A]: ["aws-us-gov", q] }];
    var _data = { version: "1.0", parameters: { Region: i, UseDualStack: j, UseFIPS: j, Endpoint: i }, rules: [{ conditions: [{ [z]: b, [A]: [k] }], rules: [{ conditions: t, error: "Invalid Configuration: FIPS and custom endpoint are not supported", type: d }, { conditions: u, error: "Invalid Configuration: Dualstack and custom endpoint are not supported", type: d }, { endpoint: { url: k, [C]: n, [D]: n }, type: e }], type: f }, { conditions: [{ [z]: b, [A]: v }], rules: [{ conditions: [{ [z]: "aws.partition", [A]: v, assign: g }], rules: [{ conditions: [l, m], rules: [{ conditions: [{ [z]: c, [A]: [a, o] }, p], rules: [{ conditions: w, endpoint: r, type: e }, { conditions: x, endpoint: r, type: e }, { endpoint: { url: "https://secretsmanager-fips.{Region}.{PartitionResult#dualStackDnsSuffix}", [C]: n, [D]: n }, type: e }], type: f }, { error: "FIPS and DualStack are enabled, but this partition does not support one or both", type: d }], type: f }, { conditions: t, rules: [{ conditions: [{ [z]: c, [A]: [o, a] }], rules: [{ endpoint: { url: "https://secretsmanager-fips.{Region}.{PartitionResult#dnsSuffix}", [C]: n, [D]: n }, type: e }], type: f }, { error: "FIPS is enabled but this partition does not support FIPS", type: d }], type: f }, { conditions: u, rules: [{ conditions: [p], rules: [{ conditions: w, endpoint: s, type: e }, { conditions: [{ [z]: h, [A]: ["aws-cn", q] }], endpoint: { url: "https://secretsmanager.{Region}.amazonaws.com.cn", [C]: n, [D]: n }, type: e }, { conditions: x, endpoint: s, type: e }, { endpoint: { url: "https://secretsmanager.{Region}.{PartitionResult#dualStackDnsSuffix}", [C]: n, [D]: n }, type: e }], type: f }, { error: "DualStack is enabled but this partition does not support DualStack", type: d }], type: f }, { endpoint: { url: "https://secretsmanager.{Region}.{PartitionResult#dnsSuffix}", [C]: n, [D]: n }, type: e }], type: f }], type: f }, { error: "Invalid Configuration: Missing Region", type: d }] };
    exports2.ruleSet = _data;
  }
});

// node_modules/@aws-sdk/client-secrets-manager/dist-cjs/endpoint/endpointResolver.js
var require_endpointResolver4 = __commonJS({
  "node_modules/@aws-sdk/client-secrets-manager/dist-cjs/endpoint/endpointResolver.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.defaultEndpointResolver = void 0;
    var util_endpoints_1 = require_dist_cjs7();
    var util_endpoints_2 = require_dist_cjs6();
    var ruleset_1 = require_ruleset4();
    var defaultEndpointResolver = (endpointParams, context = {}) => {
      return (0, util_endpoints_2.resolveEndpoint)(ruleset_1.ruleSet, {
        endpointParams,
        logger: context.logger
      });
    };
    exports2.defaultEndpointResolver = defaultEndpointResolver;
    util_endpoints_2.customEndpointFunctions.aws = util_endpoints_1.awsEndpointFunctions;
  }
});

// node_modules/@aws-sdk/client-secrets-manager/dist-cjs/runtimeConfig.shared.js
var require_runtimeConfig_shared4 = __commonJS({
  "node_modules/@aws-sdk/client-secrets-manager/dist-cjs/runtimeConfig.shared.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getRuntimeConfig = void 0;
    var core_1 = (init_dist_es2(), __toCommonJS(dist_es_exports2));
    var smithy_client_1 = require_dist_cjs32();
    var url_parser_1 = require_dist_cjs16();
    var util_base64_1 = require_dist_cjs25();
    var util_utf8_1 = require_dist_cjs24();
    var httpAuthSchemeProvider_1 = require_httpAuthSchemeProvider();
    var endpointResolver_1 = require_endpointResolver4();
    var getRuntimeConfig = (config) => {
      return {
        apiVersion: "2017-10-17",
        base64Decoder: config?.base64Decoder ?? util_base64_1.fromBase64,
        base64Encoder: config?.base64Encoder ?? util_base64_1.toBase64,
        disableHostPrefix: config?.disableHostPrefix ?? false,
        endpointProvider: config?.endpointProvider ?? endpointResolver_1.defaultEndpointResolver,
        extensions: config?.extensions ?? [],
        httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? httpAuthSchemeProvider_1.defaultSecretsManagerHttpAuthSchemeProvider,
        httpAuthSchemes: config?.httpAuthSchemes ?? [
          {
            schemeId: "aws.auth#sigv4",
            identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4"),
            signer: new core_1.AwsSdkSigV4Signer()
          }
        ],
        logger: config?.logger ?? new smithy_client_1.NoOpLogger(),
        serviceId: config?.serviceId ?? "Secrets Manager",
        urlParser: config?.urlParser ?? url_parser_1.parseUrl,
        utf8Decoder: config?.utf8Decoder ?? util_utf8_1.fromUtf8,
        utf8Encoder: config?.utf8Encoder ?? util_utf8_1.toUtf8
      };
    };
    exports2.getRuntimeConfig = getRuntimeConfig;
  }
});

// node_modules/@aws-sdk/client-secrets-manager/dist-cjs/runtimeConfig.js
var require_runtimeConfig4 = __commonJS({
  "node_modules/@aws-sdk/client-secrets-manager/dist-cjs/runtimeConfig.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getRuntimeConfig = void 0;
    var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
    var package_json_1 = tslib_1.__importDefault(require_package());
    var core_1 = (init_dist_es2(), __toCommonJS(dist_es_exports2));
    var credential_provider_node_1 = require_dist_cjs52();
    var util_user_agent_node_1 = require_dist_cjs39();
    var config_resolver_1 = require_dist_cjs11();
    var hash_node_1 = require_dist_cjs40();
    var middleware_retry_1 = require_dist_cjs33();
    var node_config_provider_1 = require_dist_cjs14();
    var node_http_handler_1 = require_dist_cjs28();
    var util_body_length_node_1 = require_dist_cjs41();
    var util_retry_1 = require_dist_cjs20();
    var runtimeConfig_shared_1 = require_runtimeConfig_shared4();
    var smithy_client_1 = require_dist_cjs32();
    var util_defaults_mode_node_1 = require_dist_cjs42();
    var smithy_client_2 = require_dist_cjs32();
    var getRuntimeConfig = (config) => {
      (0, smithy_client_2.emitWarningIfUnsupportedVersion)(process.version);
      const defaultsMode = (0, util_defaults_mode_node_1.resolveDefaultsModeConfig)(config);
      const defaultConfigProvider = () => defaultsMode().then(smithy_client_1.loadConfigsForDefaultMode);
      const clientSharedValues = (0, runtimeConfig_shared_1.getRuntimeConfig)(config);
      (0, core_1.emitWarningIfUnsupportedVersion)(process.version);
      return {
        ...clientSharedValues,
        ...config,
        runtime: "node",
        defaultsMode,
        bodyLengthChecker: config?.bodyLengthChecker ?? util_body_length_node_1.calculateBodyLength,
        credentialDefaultProvider: config?.credentialDefaultProvider ?? credential_provider_node_1.defaultProvider,
        defaultUserAgentProvider: config?.defaultUserAgentProvider ?? (0, util_user_agent_node_1.defaultUserAgent)({ serviceId: clientSharedValues.serviceId, clientVersion: package_json_1.default.version }),
        maxAttempts: config?.maxAttempts ?? (0, node_config_provider_1.loadConfig)(middleware_retry_1.NODE_MAX_ATTEMPT_CONFIG_OPTIONS),
        region: config?.region ?? (0, node_config_provider_1.loadConfig)(config_resolver_1.NODE_REGION_CONFIG_OPTIONS, config_resolver_1.NODE_REGION_CONFIG_FILE_OPTIONS),
        requestHandler: node_http_handler_1.NodeHttpHandler.create(config?.requestHandler ?? defaultConfigProvider),
        retryMode: config?.retryMode ?? (0, node_config_provider_1.loadConfig)({
          ...middleware_retry_1.NODE_RETRY_MODE_CONFIG_OPTIONS,
          default: async () => (await defaultConfigProvider()).retryMode || util_retry_1.DEFAULT_RETRY_MODE
        }),
        sha256: config?.sha256 ?? hash_node_1.Hash.bind(null, "sha256"),
        streamCollector: config?.streamCollector ?? node_http_handler_1.streamCollector,
        useDualstackEndpoint: config?.useDualstackEndpoint ?? (0, node_config_provider_1.loadConfig)(config_resolver_1.NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS),
        useFipsEndpoint: config?.useFipsEndpoint ?? (0, node_config_provider_1.loadConfig)(config_resolver_1.NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS)
      };
    };
    exports2.getRuntimeConfig = getRuntimeConfig;
  }
});

// node_modules/@aws-sdk/client-secrets-manager/dist-cjs/index.js
var require_dist_cjs53 = __commonJS({
  "node_modules/@aws-sdk/client-secrets-manager/dist-cjs/index.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      BatchGetSecretValueCommand: () => BatchGetSecretValueCommand,
      BatchGetSecretValueResponseFilterSensitiveLog: () => BatchGetSecretValueResponseFilterSensitiveLog,
      CancelRotateSecretCommand: () => CancelRotateSecretCommand,
      CreateSecretCommand: () => CreateSecretCommand,
      CreateSecretRequestFilterSensitiveLog: () => CreateSecretRequestFilterSensitiveLog,
      DecryptionFailure: () => DecryptionFailure,
      DeleteResourcePolicyCommand: () => DeleteResourcePolicyCommand,
      DeleteSecretCommand: () => DeleteSecretCommand,
      DescribeSecretCommand: () => DescribeSecretCommand,
      EncryptionFailure: () => EncryptionFailure,
      FilterNameStringType: () => FilterNameStringType,
      GetRandomPasswordCommand: () => GetRandomPasswordCommand,
      GetRandomPasswordResponseFilterSensitiveLog: () => GetRandomPasswordResponseFilterSensitiveLog,
      GetResourcePolicyCommand: () => GetResourcePolicyCommand,
      GetSecretValueCommand: () => GetSecretValueCommand2,
      GetSecretValueResponseFilterSensitiveLog: () => GetSecretValueResponseFilterSensitiveLog,
      InternalServiceError: () => InternalServiceError,
      InvalidNextTokenException: () => InvalidNextTokenException,
      InvalidParameterException: () => InvalidParameterException,
      InvalidRequestException: () => InvalidRequestException,
      LimitExceededException: () => LimitExceededException,
      ListSecretVersionIdsCommand: () => ListSecretVersionIdsCommand,
      ListSecretsCommand: () => ListSecretsCommand,
      MalformedPolicyDocumentException: () => MalformedPolicyDocumentException,
      PreconditionNotMetException: () => PreconditionNotMetException,
      PublicPolicyException: () => PublicPolicyException,
      PutResourcePolicyCommand: () => PutResourcePolicyCommand,
      PutSecretValueCommand: () => PutSecretValueCommand,
      PutSecretValueRequestFilterSensitiveLog: () => PutSecretValueRequestFilterSensitiveLog,
      RemoveRegionsFromReplicationCommand: () => RemoveRegionsFromReplicationCommand,
      ReplicateSecretToRegionsCommand: () => ReplicateSecretToRegionsCommand,
      ResourceExistsException: () => ResourceExistsException,
      ResourceNotFoundException: () => ResourceNotFoundException,
      RestoreSecretCommand: () => RestoreSecretCommand,
      RotateSecretCommand: () => RotateSecretCommand,
      SecretValueEntryFilterSensitiveLog: () => SecretValueEntryFilterSensitiveLog,
      SecretsManager: () => SecretsManager,
      SecretsManagerClient: () => SecretsManagerClient2,
      SecretsManagerServiceException: () => SecretsManagerServiceException,
      SortOrderType: () => SortOrderType,
      StatusType: () => StatusType,
      StopReplicationToReplicaCommand: () => StopReplicationToReplicaCommand,
      TagResourceCommand: () => TagResourceCommand,
      UntagResourceCommand: () => UntagResourceCommand,
      UpdateSecretCommand: () => UpdateSecretCommand,
      UpdateSecretRequestFilterSensitiveLog: () => UpdateSecretRequestFilterSensitiveLog,
      UpdateSecretVersionStageCommand: () => UpdateSecretVersionStageCommand,
      ValidateResourcePolicyCommand: () => ValidateResourcePolicyCommand,
      __Client: () => import_smithy_client5.Client,
      paginateBatchGetSecretValue: () => paginateBatchGetSecretValue,
      paginateListSecretVersionIds: () => paginateListSecretVersionIds,
      paginateListSecrets: () => paginateListSecrets
    });
    module2.exports = __toCommonJS2(src_exports);
    var import_middleware_host_header = require_dist_cjs3();
    var import_middleware_logger = require_dist_cjs4();
    var import_middleware_recursion_detection = require_dist_cjs5();
    var import_middleware_user_agent = require_dist_cjs8();
    var import_config_resolver = require_dist_cjs11();
    var import_core3 = (init_dist_es(), __toCommonJS(dist_es_exports));
    var import_middleware_content_length = require_dist_cjs34();
    var import_middleware_endpoint2 = require_dist_cjs18();
    var import_middleware_retry2 = require_dist_cjs33();
    var import_httpAuthSchemeProvider = require_httpAuthSchemeProvider();
    var resolveClientEndpointParameters = /* @__PURE__ */ __name((options) => {
      return {
        ...options,
        useDualstackEndpoint: options.useDualstackEndpoint ?? false,
        useFipsEndpoint: options.useFipsEndpoint ?? false,
        defaultSigningName: "secretsmanager"
      };
    }, "resolveClientEndpointParameters");
    var commonParams = {
      UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
      Endpoint: { type: "builtInParams", name: "endpoint" },
      Region: { type: "builtInParams", name: "region" },
      UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" }
    };
    var import_runtimeConfig = require_runtimeConfig4();
    var import_region_config_resolver = require_dist_cjs43();
    var import_protocol_http8 = require_dist_cjs2();
    var import_smithy_client5 = require_dist_cjs32();
    var getHttpAuthExtensionConfiguration = /* @__PURE__ */ __name((runtimeConfig) => {
      const _httpAuthSchemes = runtimeConfig.httpAuthSchemes;
      let _httpAuthSchemeProvider = runtimeConfig.httpAuthSchemeProvider;
      let _credentials = runtimeConfig.credentials;
      return {
        setHttpAuthScheme(httpAuthScheme) {
          const index = _httpAuthSchemes.findIndex((scheme) => scheme.schemeId === httpAuthScheme.schemeId);
          if (index === -1) {
            _httpAuthSchemes.push(httpAuthScheme);
          } else {
            _httpAuthSchemes.splice(index, 1, httpAuthScheme);
          }
        },
        httpAuthSchemes() {
          return _httpAuthSchemes;
        },
        setHttpAuthSchemeProvider(httpAuthSchemeProvider) {
          _httpAuthSchemeProvider = httpAuthSchemeProvider;
        },
        httpAuthSchemeProvider() {
          return _httpAuthSchemeProvider;
        },
        setCredentials(credentials) {
          _credentials = credentials;
        },
        credentials() {
          return _credentials;
        }
      };
    }, "getHttpAuthExtensionConfiguration");
    var resolveHttpAuthRuntimeConfig = /* @__PURE__ */ __name((config) => {
      return {
        httpAuthSchemes: config.httpAuthSchemes(),
        httpAuthSchemeProvider: config.httpAuthSchemeProvider(),
        credentials: config.credentials()
      };
    }, "resolveHttpAuthRuntimeConfig");
    var asPartial = /* @__PURE__ */ __name((t) => t, "asPartial");
    var resolveRuntimeExtensions = /* @__PURE__ */ __name((runtimeConfig, extensions) => {
      const extensionConfiguration = {
        ...asPartial((0, import_region_config_resolver.getAwsRegionExtensionConfiguration)(runtimeConfig)),
        ...asPartial((0, import_smithy_client5.getDefaultExtensionConfiguration)(runtimeConfig)),
        ...asPartial((0, import_protocol_http8.getHttpHandlerExtensionConfiguration)(runtimeConfig)),
        ...asPartial(getHttpAuthExtensionConfiguration(runtimeConfig))
      };
      extensions.forEach((extension) => extension.configure(extensionConfiguration));
      return {
        ...runtimeConfig,
        ...(0, import_region_config_resolver.resolveAwsRegionExtensionConfiguration)(extensionConfiguration),
        ...(0, import_smithy_client5.resolveDefaultRuntimeConfig)(extensionConfiguration),
        ...(0, import_protocol_http8.resolveHttpHandlerRuntimeConfig)(extensionConfiguration),
        ...resolveHttpAuthRuntimeConfig(extensionConfiguration)
      };
    }, "resolveRuntimeExtensions");
    var _SecretsManagerClient = class _SecretsManagerClient extends import_smithy_client5.Client {
      constructor(...[configuration]) {
        const _config_0 = (0, import_runtimeConfig.getRuntimeConfig)(configuration || {});
        const _config_1 = resolveClientEndpointParameters(_config_0);
        const _config_2 = (0, import_middleware_user_agent.resolveUserAgentConfig)(_config_1);
        const _config_3 = (0, import_middleware_retry2.resolveRetryConfig)(_config_2);
        const _config_4 = (0, import_config_resolver.resolveRegionConfig)(_config_3);
        const _config_5 = (0, import_middleware_host_header.resolveHostHeaderConfig)(_config_4);
        const _config_6 = (0, import_middleware_endpoint2.resolveEndpointConfig)(_config_5);
        const _config_7 = (0, import_httpAuthSchemeProvider.resolveHttpAuthSchemeConfig)(_config_6);
        const _config_8 = resolveRuntimeExtensions(_config_7, (configuration == null ? void 0 : configuration.extensions) || []);
        super(_config_8);
        this.config = _config_8;
        this.middlewareStack.use((0, import_middleware_user_agent.getUserAgentPlugin)(this.config));
        this.middlewareStack.use((0, import_middleware_retry2.getRetryPlugin)(this.config));
        this.middlewareStack.use((0, import_middleware_content_length.getContentLengthPlugin)(this.config));
        this.middlewareStack.use((0, import_middleware_host_header.getHostHeaderPlugin)(this.config));
        this.middlewareStack.use((0, import_middleware_logger.getLoggerPlugin)(this.config));
        this.middlewareStack.use((0, import_middleware_recursion_detection.getRecursionDetectionPlugin)(this.config));
        this.middlewareStack.use(
          (0, import_core3.getHttpAuthSchemeEndpointRuleSetPlugin)(this.config, {
            httpAuthSchemeParametersProvider: import_httpAuthSchemeProvider.defaultSecretsManagerHttpAuthSchemeParametersProvider,
            identityProviderConfigProvider: async (config) => new import_core3.DefaultIdentityProviderConfig({
              "aws.auth#sigv4": config.credentials
            })
          })
        );
        this.middlewareStack.use((0, import_core3.getHttpSigningPlugin)(this.config));
      }
      /**
       * Destroy underlying resources, like sockets. It's usually not necessary to do this.
       * However in Node.js, it's best to explicitly shut down the client's agent when it is no longer needed.
       * Otherwise, sockets might stay open for quite a long time before the server terminates them.
       */
      destroy() {
        super.destroy();
      }
    };
    __name(_SecretsManagerClient, "SecretsManagerClient");
    var SecretsManagerClient2 = _SecretsManagerClient;
    var import_middleware_serde2 = require_dist_cjs17();
    var _SecretsManagerServiceException = class _SecretsManagerServiceException2 extends import_smithy_client5.ServiceException {
      /**
       * @internal
       */
      constructor(options) {
        super(options);
        Object.setPrototypeOf(this, _SecretsManagerServiceException2.prototype);
      }
    };
    __name(_SecretsManagerServiceException, "SecretsManagerServiceException");
    var SecretsManagerServiceException = _SecretsManagerServiceException;
    var FilterNameStringType = {
      all: "all",
      description: "description",
      name: "name",
      owning_service: "owning-service",
      primary_region: "primary-region",
      tag_key: "tag-key",
      tag_value: "tag-value"
    };
    var _DecryptionFailure = class _DecryptionFailure2 extends SecretsManagerServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "DecryptionFailure",
          $fault: "client",
          ...opts
        });
        this.name = "DecryptionFailure";
        this.$fault = "client";
        Object.setPrototypeOf(this, _DecryptionFailure2.prototype);
        this.Message = opts.Message;
      }
    };
    __name(_DecryptionFailure, "DecryptionFailure");
    var DecryptionFailure = _DecryptionFailure;
    var _InternalServiceError = class _InternalServiceError2 extends SecretsManagerServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "InternalServiceError",
          $fault: "server",
          ...opts
        });
        this.name = "InternalServiceError";
        this.$fault = "server";
        Object.setPrototypeOf(this, _InternalServiceError2.prototype);
        this.Message = opts.Message;
      }
    };
    __name(_InternalServiceError, "InternalServiceError");
    var InternalServiceError = _InternalServiceError;
    var _InvalidNextTokenException = class _InvalidNextTokenException2 extends SecretsManagerServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "InvalidNextTokenException",
          $fault: "client",
          ...opts
        });
        this.name = "InvalidNextTokenException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _InvalidNextTokenException2.prototype);
        this.Message = opts.Message;
      }
    };
    __name(_InvalidNextTokenException, "InvalidNextTokenException");
    var InvalidNextTokenException = _InvalidNextTokenException;
    var _InvalidParameterException = class _InvalidParameterException2 extends SecretsManagerServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "InvalidParameterException",
          $fault: "client",
          ...opts
        });
        this.name = "InvalidParameterException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _InvalidParameterException2.prototype);
        this.Message = opts.Message;
      }
    };
    __name(_InvalidParameterException, "InvalidParameterException");
    var InvalidParameterException = _InvalidParameterException;
    var _InvalidRequestException = class _InvalidRequestException2 extends SecretsManagerServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "InvalidRequestException",
          $fault: "client",
          ...opts
        });
        this.name = "InvalidRequestException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _InvalidRequestException2.prototype);
        this.Message = opts.Message;
      }
    };
    __name(_InvalidRequestException, "InvalidRequestException");
    var InvalidRequestException = _InvalidRequestException;
    var _ResourceNotFoundException = class _ResourceNotFoundException2 extends SecretsManagerServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "ResourceNotFoundException",
          $fault: "client",
          ...opts
        });
        this.name = "ResourceNotFoundException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _ResourceNotFoundException2.prototype);
        this.Message = opts.Message;
      }
    };
    __name(_ResourceNotFoundException, "ResourceNotFoundException");
    var ResourceNotFoundException = _ResourceNotFoundException;
    var StatusType = {
      Failed: "Failed",
      InProgress: "InProgress",
      InSync: "InSync"
    };
    var _EncryptionFailure = class _EncryptionFailure2 extends SecretsManagerServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "EncryptionFailure",
          $fault: "client",
          ...opts
        });
        this.name = "EncryptionFailure";
        this.$fault = "client";
        Object.setPrototypeOf(this, _EncryptionFailure2.prototype);
        this.Message = opts.Message;
      }
    };
    __name(_EncryptionFailure, "EncryptionFailure");
    var EncryptionFailure = _EncryptionFailure;
    var _LimitExceededException = class _LimitExceededException2 extends SecretsManagerServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "LimitExceededException",
          $fault: "client",
          ...opts
        });
        this.name = "LimitExceededException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _LimitExceededException2.prototype);
        this.Message = opts.Message;
      }
    };
    __name(_LimitExceededException, "LimitExceededException");
    var LimitExceededException = _LimitExceededException;
    var _MalformedPolicyDocumentException = class _MalformedPolicyDocumentException2 extends SecretsManagerServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "MalformedPolicyDocumentException",
          $fault: "client",
          ...opts
        });
        this.name = "MalformedPolicyDocumentException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _MalformedPolicyDocumentException2.prototype);
        this.Message = opts.Message;
      }
    };
    __name(_MalformedPolicyDocumentException, "MalformedPolicyDocumentException");
    var MalformedPolicyDocumentException = _MalformedPolicyDocumentException;
    var _PreconditionNotMetException = class _PreconditionNotMetException2 extends SecretsManagerServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "PreconditionNotMetException",
          $fault: "client",
          ...opts
        });
        this.name = "PreconditionNotMetException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _PreconditionNotMetException2.prototype);
        this.Message = opts.Message;
      }
    };
    __name(_PreconditionNotMetException, "PreconditionNotMetException");
    var PreconditionNotMetException = _PreconditionNotMetException;
    var _ResourceExistsException = class _ResourceExistsException2 extends SecretsManagerServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "ResourceExistsException",
          $fault: "client",
          ...opts
        });
        this.name = "ResourceExistsException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _ResourceExistsException2.prototype);
        this.Message = opts.Message;
      }
    };
    __name(_ResourceExistsException, "ResourceExistsException");
    var ResourceExistsException = _ResourceExistsException;
    var SortOrderType = {
      asc: "asc",
      desc: "desc"
    };
    var _PublicPolicyException = class _PublicPolicyException2 extends SecretsManagerServiceException {
      /**
       * @internal
       */
      constructor(opts) {
        super({
          name: "PublicPolicyException",
          $fault: "client",
          ...opts
        });
        this.name = "PublicPolicyException";
        this.$fault = "client";
        Object.setPrototypeOf(this, _PublicPolicyException2.prototype);
        this.Message = opts.Message;
      }
    };
    __name(_PublicPolicyException, "PublicPolicyException");
    var PublicPolicyException = _PublicPolicyException;
    var SecretValueEntryFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.SecretBinary && { SecretBinary: import_smithy_client5.SENSITIVE_STRING },
      ...obj.SecretString && { SecretString: import_smithy_client5.SENSITIVE_STRING }
    }), "SecretValueEntryFilterSensitiveLog");
    var BatchGetSecretValueResponseFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.SecretValues && { SecretValues: obj.SecretValues.map((item) => SecretValueEntryFilterSensitiveLog(item)) }
    }), "BatchGetSecretValueResponseFilterSensitiveLog");
    var CreateSecretRequestFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.SecretBinary && { SecretBinary: import_smithy_client5.SENSITIVE_STRING },
      ...obj.SecretString && { SecretString: import_smithy_client5.SENSITIVE_STRING }
    }), "CreateSecretRequestFilterSensitiveLog");
    var GetRandomPasswordResponseFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.RandomPassword && { RandomPassword: import_smithy_client5.SENSITIVE_STRING }
    }), "GetRandomPasswordResponseFilterSensitiveLog");
    var GetSecretValueResponseFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.SecretBinary && { SecretBinary: import_smithy_client5.SENSITIVE_STRING },
      ...obj.SecretString && { SecretString: import_smithy_client5.SENSITIVE_STRING }
    }), "GetSecretValueResponseFilterSensitiveLog");
    var PutSecretValueRequestFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.SecretBinary && { SecretBinary: import_smithy_client5.SENSITIVE_STRING },
      ...obj.SecretString && { SecretString: import_smithy_client5.SENSITIVE_STRING },
      ...obj.RotationToken && { RotationToken: import_smithy_client5.SENSITIVE_STRING }
    }), "PutSecretValueRequestFilterSensitiveLog");
    var UpdateSecretRequestFilterSensitiveLog = /* @__PURE__ */ __name((obj) => ({
      ...obj,
      ...obj.SecretBinary && { SecretBinary: import_smithy_client5.SENSITIVE_STRING },
      ...obj.SecretString && { SecretString: import_smithy_client5.SENSITIVE_STRING }
    }), "UpdateSecretRequestFilterSensitiveLog");
    var import_core22 = (init_dist_es2(), __toCommonJS(dist_es_exports2));
    var import_uuid = (init_esm_node(), __toCommonJS(esm_node_exports));
    var se_BatchGetSecretValueCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = sharedHeaders("BatchGetSecretValue");
      let body;
      body = JSON.stringify((0, import_smithy_client5._json)(input));
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_BatchGetSecretValueCommand");
    var se_CancelRotateSecretCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = sharedHeaders("CancelRotateSecret");
      let body;
      body = JSON.stringify((0, import_smithy_client5._json)(input));
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_CancelRotateSecretCommand");
    var se_CreateSecretCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = sharedHeaders("CreateSecret");
      let body;
      body = JSON.stringify(se_CreateSecretRequest(input, context));
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_CreateSecretCommand");
    var se_DeleteResourcePolicyCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = sharedHeaders("DeleteResourcePolicy");
      let body;
      body = JSON.stringify((0, import_smithy_client5._json)(input));
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_DeleteResourcePolicyCommand");
    var se_DeleteSecretCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = sharedHeaders("DeleteSecret");
      let body;
      body = JSON.stringify((0, import_smithy_client5._json)(input));
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_DeleteSecretCommand");
    var se_DescribeSecretCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = sharedHeaders("DescribeSecret");
      let body;
      body = JSON.stringify((0, import_smithy_client5._json)(input));
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_DescribeSecretCommand");
    var se_GetRandomPasswordCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = sharedHeaders("GetRandomPassword");
      let body;
      body = JSON.stringify((0, import_smithy_client5._json)(input));
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_GetRandomPasswordCommand");
    var se_GetResourcePolicyCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = sharedHeaders("GetResourcePolicy");
      let body;
      body = JSON.stringify((0, import_smithy_client5._json)(input));
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_GetResourcePolicyCommand");
    var se_GetSecretValueCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = sharedHeaders("GetSecretValue");
      let body;
      body = JSON.stringify((0, import_smithy_client5._json)(input));
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_GetSecretValueCommand");
    var se_ListSecretsCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = sharedHeaders("ListSecrets");
      let body;
      body = JSON.stringify((0, import_smithy_client5._json)(input));
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_ListSecretsCommand");
    var se_ListSecretVersionIdsCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = sharedHeaders("ListSecretVersionIds");
      let body;
      body = JSON.stringify((0, import_smithy_client5._json)(input));
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_ListSecretVersionIdsCommand");
    var se_PutResourcePolicyCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = sharedHeaders("PutResourcePolicy");
      let body;
      body = JSON.stringify((0, import_smithy_client5._json)(input));
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_PutResourcePolicyCommand");
    var se_PutSecretValueCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = sharedHeaders("PutSecretValue");
      let body;
      body = JSON.stringify(se_PutSecretValueRequest(input, context));
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_PutSecretValueCommand");
    var se_RemoveRegionsFromReplicationCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = sharedHeaders("RemoveRegionsFromReplication");
      let body;
      body = JSON.stringify((0, import_smithy_client5._json)(input));
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_RemoveRegionsFromReplicationCommand");
    var se_ReplicateSecretToRegionsCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = sharedHeaders("ReplicateSecretToRegions");
      let body;
      body = JSON.stringify((0, import_smithy_client5._json)(input));
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_ReplicateSecretToRegionsCommand");
    var se_RestoreSecretCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = sharedHeaders("RestoreSecret");
      let body;
      body = JSON.stringify((0, import_smithy_client5._json)(input));
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_RestoreSecretCommand");
    var se_RotateSecretCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = sharedHeaders("RotateSecret");
      let body;
      body = JSON.stringify(se_RotateSecretRequest(input, context));
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_RotateSecretCommand");
    var se_StopReplicationToReplicaCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = sharedHeaders("StopReplicationToReplica");
      let body;
      body = JSON.stringify((0, import_smithy_client5._json)(input));
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_StopReplicationToReplicaCommand");
    var se_TagResourceCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = sharedHeaders("TagResource");
      let body;
      body = JSON.stringify((0, import_smithy_client5._json)(input));
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_TagResourceCommand");
    var se_UntagResourceCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = sharedHeaders("UntagResource");
      let body;
      body = JSON.stringify((0, import_smithy_client5._json)(input));
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_UntagResourceCommand");
    var se_UpdateSecretCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = sharedHeaders("UpdateSecret");
      let body;
      body = JSON.stringify(se_UpdateSecretRequest(input, context));
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_UpdateSecretCommand");
    var se_UpdateSecretVersionStageCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = sharedHeaders("UpdateSecretVersionStage");
      let body;
      body = JSON.stringify((0, import_smithy_client5._json)(input));
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_UpdateSecretVersionStageCommand");
    var se_ValidateResourcePolicyCommand = /* @__PURE__ */ __name(async (input, context) => {
      const headers = sharedHeaders("ValidateResourcePolicy");
      let body;
      body = JSON.stringify((0, import_smithy_client5._json)(input));
      return buildHttpRpcRequest(context, headers, "/", void 0, body);
    }, "se_ValidateResourcePolicyCommand");
    var de_BatchGetSecretValueCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core22.parseJsonBody)(output.body, context);
      let contents = {};
      contents = de_BatchGetSecretValueResponse(data, context);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_BatchGetSecretValueCommand");
    var de_CancelRotateSecretCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core22.parseJsonBody)(output.body, context);
      let contents = {};
      contents = (0, import_smithy_client5._json)(data);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_CancelRotateSecretCommand");
    var de_CreateSecretCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core22.parseJsonBody)(output.body, context);
      let contents = {};
      contents = de_CreateSecretResponse(data, context);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_CreateSecretCommand");
    var de_DeleteResourcePolicyCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core22.parseJsonBody)(output.body, context);
      let contents = {};
      contents = (0, import_smithy_client5._json)(data);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_DeleteResourcePolicyCommand");
    var de_DeleteSecretCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core22.parseJsonBody)(output.body, context);
      let contents = {};
      contents = de_DeleteSecretResponse(data, context);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_DeleteSecretCommand");
    var de_DescribeSecretCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core22.parseJsonBody)(output.body, context);
      let contents = {};
      contents = de_DescribeSecretResponse(data, context);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_DescribeSecretCommand");
    var de_GetRandomPasswordCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core22.parseJsonBody)(output.body, context);
      let contents = {};
      contents = (0, import_smithy_client5._json)(data);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_GetRandomPasswordCommand");
    var de_GetResourcePolicyCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core22.parseJsonBody)(output.body, context);
      let contents = {};
      contents = (0, import_smithy_client5._json)(data);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_GetResourcePolicyCommand");
    var de_GetSecretValueCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core22.parseJsonBody)(output.body, context);
      let contents = {};
      contents = de_GetSecretValueResponse(data, context);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_GetSecretValueCommand");
    var de_ListSecretsCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core22.parseJsonBody)(output.body, context);
      let contents = {};
      contents = de_ListSecretsResponse(data, context);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_ListSecretsCommand");
    var de_ListSecretVersionIdsCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core22.parseJsonBody)(output.body, context);
      let contents = {};
      contents = de_ListSecretVersionIdsResponse(data, context);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_ListSecretVersionIdsCommand");
    var de_PutResourcePolicyCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core22.parseJsonBody)(output.body, context);
      let contents = {};
      contents = (0, import_smithy_client5._json)(data);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_PutResourcePolicyCommand");
    var de_PutSecretValueCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core22.parseJsonBody)(output.body, context);
      let contents = {};
      contents = (0, import_smithy_client5._json)(data);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_PutSecretValueCommand");
    var de_RemoveRegionsFromReplicationCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core22.parseJsonBody)(output.body, context);
      let contents = {};
      contents = de_RemoveRegionsFromReplicationResponse(data, context);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_RemoveRegionsFromReplicationCommand");
    var de_ReplicateSecretToRegionsCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core22.parseJsonBody)(output.body, context);
      let contents = {};
      contents = de_ReplicateSecretToRegionsResponse(data, context);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_ReplicateSecretToRegionsCommand");
    var de_RestoreSecretCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core22.parseJsonBody)(output.body, context);
      let contents = {};
      contents = (0, import_smithy_client5._json)(data);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_RestoreSecretCommand");
    var de_RotateSecretCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core22.parseJsonBody)(output.body, context);
      let contents = {};
      contents = (0, import_smithy_client5._json)(data);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_RotateSecretCommand");
    var de_StopReplicationToReplicaCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core22.parseJsonBody)(output.body, context);
      let contents = {};
      contents = (0, import_smithy_client5._json)(data);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_StopReplicationToReplicaCommand");
    var de_TagResourceCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      await (0, import_smithy_client5.collectBody)(output.body, context);
      const response = {
        $metadata: deserializeMetadata(output)
      };
      return response;
    }, "de_TagResourceCommand");
    var de_UntagResourceCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      await (0, import_smithy_client5.collectBody)(output.body, context);
      const response = {
        $metadata: deserializeMetadata(output)
      };
      return response;
    }, "de_UntagResourceCommand");
    var de_UpdateSecretCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core22.parseJsonBody)(output.body, context);
      let contents = {};
      contents = (0, import_smithy_client5._json)(data);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_UpdateSecretCommand");
    var de_UpdateSecretVersionStageCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core22.parseJsonBody)(output.body, context);
      let contents = {};
      contents = (0, import_smithy_client5._json)(data);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_UpdateSecretVersionStageCommand");
    var de_ValidateResourcePolicyCommand = /* @__PURE__ */ __name(async (output, context) => {
      if (output.statusCode >= 300) {
        return de_CommandError(output, context);
      }
      const data = await (0, import_core22.parseJsonBody)(output.body, context);
      let contents = {};
      contents = (0, import_smithy_client5._json)(data);
      const response = {
        $metadata: deserializeMetadata(output),
        ...contents
      };
      return response;
    }, "de_ValidateResourcePolicyCommand");
    var de_CommandError = /* @__PURE__ */ __name(async (output, context) => {
      const parsedOutput = {
        ...output,
        body: await (0, import_core22.parseJsonErrorBody)(output.body, context)
      };
      const errorCode = (0, import_core22.loadRestJsonErrorCode)(output, parsedOutput.body);
      switch (errorCode) {
        case "DecryptionFailure":
        case "com.amazonaws.secretsmanager#DecryptionFailure":
          throw await de_DecryptionFailureRes(parsedOutput, context);
        case "InternalServiceError":
        case "com.amazonaws.secretsmanager#InternalServiceError":
          throw await de_InternalServiceErrorRes(parsedOutput, context);
        case "InvalidNextTokenException":
        case "com.amazonaws.secretsmanager#InvalidNextTokenException":
          throw await de_InvalidNextTokenExceptionRes(parsedOutput, context);
        case "InvalidParameterException":
        case "com.amazonaws.secretsmanager#InvalidParameterException":
          throw await de_InvalidParameterExceptionRes(parsedOutput, context);
        case "InvalidRequestException":
        case "com.amazonaws.secretsmanager#InvalidRequestException":
          throw await de_InvalidRequestExceptionRes(parsedOutput, context);
        case "ResourceNotFoundException":
        case "com.amazonaws.secretsmanager#ResourceNotFoundException":
          throw await de_ResourceNotFoundExceptionRes(parsedOutput, context);
        case "EncryptionFailure":
        case "com.amazonaws.secretsmanager#EncryptionFailure":
          throw await de_EncryptionFailureRes(parsedOutput, context);
        case "LimitExceededException":
        case "com.amazonaws.secretsmanager#LimitExceededException":
          throw await de_LimitExceededExceptionRes(parsedOutput, context);
        case "MalformedPolicyDocumentException":
        case "com.amazonaws.secretsmanager#MalformedPolicyDocumentException":
          throw await de_MalformedPolicyDocumentExceptionRes(parsedOutput, context);
        case "PreconditionNotMetException":
        case "com.amazonaws.secretsmanager#PreconditionNotMetException":
          throw await de_PreconditionNotMetExceptionRes(parsedOutput, context);
        case "ResourceExistsException":
        case "com.amazonaws.secretsmanager#ResourceExistsException":
          throw await de_ResourceExistsExceptionRes(parsedOutput, context);
        case "PublicPolicyException":
        case "com.amazonaws.secretsmanager#PublicPolicyException":
          throw await de_PublicPolicyExceptionRes(parsedOutput, context);
        default:
          const parsedBody = parsedOutput.body;
          return throwDefaultError({
            output,
            parsedBody,
            errorCode
          });
      }
    }, "de_CommandError");
    var de_DecryptionFailureRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const body = parsedOutput.body;
      const deserialized = (0, import_smithy_client5._json)(body);
      const exception = new DecryptionFailure({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, body);
    }, "de_DecryptionFailureRes");
    var de_EncryptionFailureRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const body = parsedOutput.body;
      const deserialized = (0, import_smithy_client5._json)(body);
      const exception = new EncryptionFailure({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, body);
    }, "de_EncryptionFailureRes");
    var de_InternalServiceErrorRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const body = parsedOutput.body;
      const deserialized = (0, import_smithy_client5._json)(body);
      const exception = new InternalServiceError({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, body);
    }, "de_InternalServiceErrorRes");
    var de_InvalidNextTokenExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const body = parsedOutput.body;
      const deserialized = (0, import_smithy_client5._json)(body);
      const exception = new InvalidNextTokenException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, body);
    }, "de_InvalidNextTokenExceptionRes");
    var de_InvalidParameterExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const body = parsedOutput.body;
      const deserialized = (0, import_smithy_client5._json)(body);
      const exception = new InvalidParameterException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, body);
    }, "de_InvalidParameterExceptionRes");
    var de_InvalidRequestExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const body = parsedOutput.body;
      const deserialized = (0, import_smithy_client5._json)(body);
      const exception = new InvalidRequestException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, body);
    }, "de_InvalidRequestExceptionRes");
    var de_LimitExceededExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const body = parsedOutput.body;
      const deserialized = (0, import_smithy_client5._json)(body);
      const exception = new LimitExceededException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, body);
    }, "de_LimitExceededExceptionRes");
    var de_MalformedPolicyDocumentExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const body = parsedOutput.body;
      const deserialized = (0, import_smithy_client5._json)(body);
      const exception = new MalformedPolicyDocumentException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, body);
    }, "de_MalformedPolicyDocumentExceptionRes");
    var de_PreconditionNotMetExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const body = parsedOutput.body;
      const deserialized = (0, import_smithy_client5._json)(body);
      const exception = new PreconditionNotMetException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, body);
    }, "de_PreconditionNotMetExceptionRes");
    var de_PublicPolicyExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const body = parsedOutput.body;
      const deserialized = (0, import_smithy_client5._json)(body);
      const exception = new PublicPolicyException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, body);
    }, "de_PublicPolicyExceptionRes");
    var de_ResourceExistsExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const body = parsedOutput.body;
      const deserialized = (0, import_smithy_client5._json)(body);
      const exception = new ResourceExistsException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, body);
    }, "de_ResourceExistsExceptionRes");
    var de_ResourceNotFoundExceptionRes = /* @__PURE__ */ __name(async (parsedOutput, context) => {
      const body = parsedOutput.body;
      const deserialized = (0, import_smithy_client5._json)(body);
      const exception = new ResourceNotFoundException({
        $metadata: deserializeMetadata(parsedOutput),
        ...deserialized
      });
      return (0, import_smithy_client5.decorateServiceException)(exception, body);
    }, "de_ResourceNotFoundExceptionRes");
    var se_CreateSecretRequest = /* @__PURE__ */ __name((input, context) => {
      return (0, import_smithy_client5.take)(input, {
        AddReplicaRegions: import_smithy_client5._json,
        ClientRequestToken: [true, (_) => _ ?? (0, import_uuid.v4)()],
        Description: [],
        ForceOverwriteReplicaSecret: [],
        KmsKeyId: [],
        Name: [],
        SecretBinary: context.base64Encoder,
        SecretString: [],
        Tags: import_smithy_client5._json
      });
    }, "se_CreateSecretRequest");
    var se_PutSecretValueRequest = /* @__PURE__ */ __name((input, context) => {
      return (0, import_smithy_client5.take)(input, {
        ClientRequestToken: [true, (_) => _ ?? (0, import_uuid.v4)()],
        RotationToken: [],
        SecretBinary: context.base64Encoder,
        SecretId: [],
        SecretString: [],
        VersionStages: import_smithy_client5._json
      });
    }, "se_PutSecretValueRequest");
    var se_RotateSecretRequest = /* @__PURE__ */ __name((input, context) => {
      return (0, import_smithy_client5.take)(input, {
        ClientRequestToken: [true, (_) => _ ?? (0, import_uuid.v4)()],
        RotateImmediately: [],
        RotationLambdaARN: [],
        RotationRules: import_smithy_client5._json,
        SecretId: []
      });
    }, "se_RotateSecretRequest");
    var se_UpdateSecretRequest = /* @__PURE__ */ __name((input, context) => {
      return (0, import_smithy_client5.take)(input, {
        ClientRequestToken: [true, (_) => _ ?? (0, import_uuid.v4)()],
        Description: [],
        KmsKeyId: [],
        SecretBinary: context.base64Encoder,
        SecretId: [],
        SecretString: []
      });
    }, "se_UpdateSecretRequest");
    var de_BatchGetSecretValueResponse = /* @__PURE__ */ __name((output, context) => {
      return (0, import_smithy_client5.take)(output, {
        Errors: import_smithy_client5._json,
        NextToken: import_smithy_client5.expectString,
        SecretValues: (_) => de_SecretValuesType(_, context)
      });
    }, "de_BatchGetSecretValueResponse");
    var de_CreateSecretResponse = /* @__PURE__ */ __name((output, context) => {
      return (0, import_smithy_client5.take)(output, {
        ARN: import_smithy_client5.expectString,
        Name: import_smithy_client5.expectString,
        ReplicationStatus: (_) => de_ReplicationStatusListType(_, context),
        VersionId: import_smithy_client5.expectString
      });
    }, "de_CreateSecretResponse");
    var de_DeleteSecretResponse = /* @__PURE__ */ __name((output, context) => {
      return (0, import_smithy_client5.take)(output, {
        ARN: import_smithy_client5.expectString,
        DeletionDate: (_) => (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.parseEpochTimestamp)((0, import_smithy_client5.expectNumber)(_))),
        Name: import_smithy_client5.expectString
      });
    }, "de_DeleteSecretResponse");
    var de_DescribeSecretResponse = /* @__PURE__ */ __name((output, context) => {
      return (0, import_smithy_client5.take)(output, {
        ARN: import_smithy_client5.expectString,
        CreatedDate: (_) => (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.parseEpochTimestamp)((0, import_smithy_client5.expectNumber)(_))),
        DeletedDate: (_) => (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.parseEpochTimestamp)((0, import_smithy_client5.expectNumber)(_))),
        Description: import_smithy_client5.expectString,
        KmsKeyId: import_smithy_client5.expectString,
        LastAccessedDate: (_) => (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.parseEpochTimestamp)((0, import_smithy_client5.expectNumber)(_))),
        LastChangedDate: (_) => (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.parseEpochTimestamp)((0, import_smithy_client5.expectNumber)(_))),
        LastRotatedDate: (_) => (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.parseEpochTimestamp)((0, import_smithy_client5.expectNumber)(_))),
        Name: import_smithy_client5.expectString,
        NextRotationDate: (_) => (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.parseEpochTimestamp)((0, import_smithy_client5.expectNumber)(_))),
        OwningService: import_smithy_client5.expectString,
        PrimaryRegion: import_smithy_client5.expectString,
        ReplicationStatus: (_) => de_ReplicationStatusListType(_, context),
        RotationEnabled: import_smithy_client5.expectBoolean,
        RotationLambdaARN: import_smithy_client5.expectString,
        RotationRules: import_smithy_client5._json,
        Tags: import_smithy_client5._json,
        VersionIdsToStages: import_smithy_client5._json
      });
    }, "de_DescribeSecretResponse");
    var de_GetSecretValueResponse = /* @__PURE__ */ __name((output, context) => {
      return (0, import_smithy_client5.take)(output, {
        ARN: import_smithy_client5.expectString,
        CreatedDate: (_) => (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.parseEpochTimestamp)((0, import_smithy_client5.expectNumber)(_))),
        Name: import_smithy_client5.expectString,
        SecretBinary: context.base64Decoder,
        SecretString: import_smithy_client5.expectString,
        VersionId: import_smithy_client5.expectString,
        VersionStages: import_smithy_client5._json
      });
    }, "de_GetSecretValueResponse");
    var de_ListSecretsResponse = /* @__PURE__ */ __name((output, context) => {
      return (0, import_smithy_client5.take)(output, {
        NextToken: import_smithy_client5.expectString,
        SecretList: (_) => de_SecretListType(_, context)
      });
    }, "de_ListSecretsResponse");
    var de_ListSecretVersionIdsResponse = /* @__PURE__ */ __name((output, context) => {
      return (0, import_smithy_client5.take)(output, {
        ARN: import_smithy_client5.expectString,
        Name: import_smithy_client5.expectString,
        NextToken: import_smithy_client5.expectString,
        Versions: (_) => de_SecretVersionsListType(_, context)
      });
    }, "de_ListSecretVersionIdsResponse");
    var de_RemoveRegionsFromReplicationResponse = /* @__PURE__ */ __name((output, context) => {
      return (0, import_smithy_client5.take)(output, {
        ARN: import_smithy_client5.expectString,
        ReplicationStatus: (_) => de_ReplicationStatusListType(_, context)
      });
    }, "de_RemoveRegionsFromReplicationResponse");
    var de_ReplicateSecretToRegionsResponse = /* @__PURE__ */ __name((output, context) => {
      return (0, import_smithy_client5.take)(output, {
        ARN: import_smithy_client5.expectString,
        ReplicationStatus: (_) => de_ReplicationStatusListType(_, context)
      });
    }, "de_ReplicateSecretToRegionsResponse");
    var de_ReplicationStatusListType = /* @__PURE__ */ __name((output, context) => {
      const retVal = (output || []).filter((e) => e != null).map((entry) => {
        return de_ReplicationStatusType(entry, context);
      });
      return retVal;
    }, "de_ReplicationStatusListType");
    var de_ReplicationStatusType = /* @__PURE__ */ __name((output, context) => {
      return (0, import_smithy_client5.take)(output, {
        KmsKeyId: import_smithy_client5.expectString,
        LastAccessedDate: (_) => (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.parseEpochTimestamp)((0, import_smithy_client5.expectNumber)(_))),
        Region: import_smithy_client5.expectString,
        Status: import_smithy_client5.expectString,
        StatusMessage: import_smithy_client5.expectString
      });
    }, "de_ReplicationStatusType");
    var de_SecretListEntry = /* @__PURE__ */ __name((output, context) => {
      return (0, import_smithy_client5.take)(output, {
        ARN: import_smithy_client5.expectString,
        CreatedDate: (_) => (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.parseEpochTimestamp)((0, import_smithy_client5.expectNumber)(_))),
        DeletedDate: (_) => (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.parseEpochTimestamp)((0, import_smithy_client5.expectNumber)(_))),
        Description: import_smithy_client5.expectString,
        KmsKeyId: import_smithy_client5.expectString,
        LastAccessedDate: (_) => (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.parseEpochTimestamp)((0, import_smithy_client5.expectNumber)(_))),
        LastChangedDate: (_) => (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.parseEpochTimestamp)((0, import_smithy_client5.expectNumber)(_))),
        LastRotatedDate: (_) => (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.parseEpochTimestamp)((0, import_smithy_client5.expectNumber)(_))),
        Name: import_smithy_client5.expectString,
        NextRotationDate: (_) => (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.parseEpochTimestamp)((0, import_smithy_client5.expectNumber)(_))),
        OwningService: import_smithy_client5.expectString,
        PrimaryRegion: import_smithy_client5.expectString,
        RotationEnabled: import_smithy_client5.expectBoolean,
        RotationLambdaARN: import_smithy_client5.expectString,
        RotationRules: import_smithy_client5._json,
        SecretVersionsToStages: import_smithy_client5._json,
        Tags: import_smithy_client5._json
      });
    }, "de_SecretListEntry");
    var de_SecretListType = /* @__PURE__ */ __name((output, context) => {
      const retVal = (output || []).filter((e) => e != null).map((entry) => {
        return de_SecretListEntry(entry, context);
      });
      return retVal;
    }, "de_SecretListType");
    var de_SecretValueEntry = /* @__PURE__ */ __name((output, context) => {
      return (0, import_smithy_client5.take)(output, {
        ARN: import_smithy_client5.expectString,
        CreatedDate: (_) => (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.parseEpochTimestamp)((0, import_smithy_client5.expectNumber)(_))),
        Name: import_smithy_client5.expectString,
        SecretBinary: context.base64Decoder,
        SecretString: import_smithy_client5.expectString,
        VersionId: import_smithy_client5.expectString,
        VersionStages: import_smithy_client5._json
      });
    }, "de_SecretValueEntry");
    var de_SecretValuesType = /* @__PURE__ */ __name((output, context) => {
      const retVal = (output || []).filter((e) => e != null).map((entry) => {
        return de_SecretValueEntry(entry, context);
      });
      return retVal;
    }, "de_SecretValuesType");
    var de_SecretVersionsListEntry = /* @__PURE__ */ __name((output, context) => {
      return (0, import_smithy_client5.take)(output, {
        CreatedDate: (_) => (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.parseEpochTimestamp)((0, import_smithy_client5.expectNumber)(_))),
        KmsKeyIds: import_smithy_client5._json,
        LastAccessedDate: (_) => (0, import_smithy_client5.expectNonNull)((0, import_smithy_client5.parseEpochTimestamp)((0, import_smithy_client5.expectNumber)(_))),
        VersionId: import_smithy_client5.expectString,
        VersionStages: import_smithy_client5._json
      });
    }, "de_SecretVersionsListEntry");
    var de_SecretVersionsListType = /* @__PURE__ */ __name((output, context) => {
      const retVal = (output || []).filter((e) => e != null).map((entry) => {
        return de_SecretVersionsListEntry(entry, context);
      });
      return retVal;
    }, "de_SecretVersionsListType");
    var deserializeMetadata = /* @__PURE__ */ __name((output) => ({
      httpStatusCode: output.statusCode,
      requestId: output.headers["x-amzn-requestid"] ?? output.headers["x-amzn-request-id"] ?? output.headers["x-amz-request-id"],
      extendedRequestId: output.headers["x-amz-id-2"],
      cfId: output.headers["x-amz-cf-id"]
    }), "deserializeMetadata");
    var throwDefaultError = (0, import_smithy_client5.withBaseException)(SecretsManagerServiceException);
    var buildHttpRpcRequest = /* @__PURE__ */ __name(async (context, headers, path, resolvedHostname, body) => {
      const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
      const contents = {
        protocol,
        hostname,
        port,
        method: "POST",
        path: basePath.endsWith("/") ? basePath.slice(0, -1) + path : basePath + path,
        headers
      };
      if (resolvedHostname !== void 0) {
        contents.hostname = resolvedHostname;
      }
      if (body !== void 0) {
        contents.body = body;
      }
      return new import_protocol_http8.HttpRequest(contents);
    }, "buildHttpRpcRequest");
    function sharedHeaders(operation) {
      return {
        "content-type": "application/x-amz-json-1.1",
        "x-amz-target": `secretsmanager.${operation}`
      };
    }
    __name(sharedHeaders, "sharedHeaders");
    var _BatchGetSecretValueCommand = class _BatchGetSecretValueCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("secretsmanager", "BatchGetSecretValue", {}).n("SecretsManagerClient", "BatchGetSecretValueCommand").f(void 0, BatchGetSecretValueResponseFilterSensitiveLog).ser(se_BatchGetSecretValueCommand).de(de_BatchGetSecretValueCommand).build() {
    };
    __name(_BatchGetSecretValueCommand, "BatchGetSecretValueCommand");
    var BatchGetSecretValueCommand = _BatchGetSecretValueCommand;
    var _CancelRotateSecretCommand = class _CancelRotateSecretCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("secretsmanager", "CancelRotateSecret", {}).n("SecretsManagerClient", "CancelRotateSecretCommand").f(void 0, void 0).ser(se_CancelRotateSecretCommand).de(de_CancelRotateSecretCommand).build() {
    };
    __name(_CancelRotateSecretCommand, "CancelRotateSecretCommand");
    var CancelRotateSecretCommand = _CancelRotateSecretCommand;
    var _CreateSecretCommand = class _CreateSecretCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("secretsmanager", "CreateSecret", {}).n("SecretsManagerClient", "CreateSecretCommand").f(CreateSecretRequestFilterSensitiveLog, void 0).ser(se_CreateSecretCommand).de(de_CreateSecretCommand).build() {
    };
    __name(_CreateSecretCommand, "CreateSecretCommand");
    var CreateSecretCommand = _CreateSecretCommand;
    var _DeleteResourcePolicyCommand = class _DeleteResourcePolicyCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("secretsmanager", "DeleteResourcePolicy", {}).n("SecretsManagerClient", "DeleteResourcePolicyCommand").f(void 0, void 0).ser(se_DeleteResourcePolicyCommand).de(de_DeleteResourcePolicyCommand).build() {
    };
    __name(_DeleteResourcePolicyCommand, "DeleteResourcePolicyCommand");
    var DeleteResourcePolicyCommand = _DeleteResourcePolicyCommand;
    var _DeleteSecretCommand = class _DeleteSecretCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("secretsmanager", "DeleteSecret", {}).n("SecretsManagerClient", "DeleteSecretCommand").f(void 0, void 0).ser(se_DeleteSecretCommand).de(de_DeleteSecretCommand).build() {
    };
    __name(_DeleteSecretCommand, "DeleteSecretCommand");
    var DeleteSecretCommand = _DeleteSecretCommand;
    var _DescribeSecretCommand = class _DescribeSecretCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("secretsmanager", "DescribeSecret", {}).n("SecretsManagerClient", "DescribeSecretCommand").f(void 0, void 0).ser(se_DescribeSecretCommand).de(de_DescribeSecretCommand).build() {
    };
    __name(_DescribeSecretCommand, "DescribeSecretCommand");
    var DescribeSecretCommand = _DescribeSecretCommand;
    var _GetRandomPasswordCommand = class _GetRandomPasswordCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("secretsmanager", "GetRandomPassword", {}).n("SecretsManagerClient", "GetRandomPasswordCommand").f(void 0, GetRandomPasswordResponseFilterSensitiveLog).ser(se_GetRandomPasswordCommand).de(de_GetRandomPasswordCommand).build() {
    };
    __name(_GetRandomPasswordCommand, "GetRandomPasswordCommand");
    var GetRandomPasswordCommand = _GetRandomPasswordCommand;
    var _GetResourcePolicyCommand = class _GetResourcePolicyCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("secretsmanager", "GetResourcePolicy", {}).n("SecretsManagerClient", "GetResourcePolicyCommand").f(void 0, void 0).ser(se_GetResourcePolicyCommand).de(de_GetResourcePolicyCommand).build() {
    };
    __name(_GetResourcePolicyCommand, "GetResourcePolicyCommand");
    var GetResourcePolicyCommand = _GetResourcePolicyCommand;
    var _GetSecretValueCommand = class _GetSecretValueCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("secretsmanager", "GetSecretValue", {}).n("SecretsManagerClient", "GetSecretValueCommand").f(void 0, GetSecretValueResponseFilterSensitiveLog).ser(se_GetSecretValueCommand).de(de_GetSecretValueCommand).build() {
    };
    __name(_GetSecretValueCommand, "GetSecretValueCommand");
    var GetSecretValueCommand2 = _GetSecretValueCommand;
    var _ListSecretsCommand = class _ListSecretsCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("secretsmanager", "ListSecrets", {}).n("SecretsManagerClient", "ListSecretsCommand").f(void 0, void 0).ser(se_ListSecretsCommand).de(de_ListSecretsCommand).build() {
    };
    __name(_ListSecretsCommand, "ListSecretsCommand");
    var ListSecretsCommand = _ListSecretsCommand;
    var _ListSecretVersionIdsCommand = class _ListSecretVersionIdsCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("secretsmanager", "ListSecretVersionIds", {}).n("SecretsManagerClient", "ListSecretVersionIdsCommand").f(void 0, void 0).ser(se_ListSecretVersionIdsCommand).de(de_ListSecretVersionIdsCommand).build() {
    };
    __name(_ListSecretVersionIdsCommand, "ListSecretVersionIdsCommand");
    var ListSecretVersionIdsCommand = _ListSecretVersionIdsCommand;
    var _PutResourcePolicyCommand = class _PutResourcePolicyCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("secretsmanager", "PutResourcePolicy", {}).n("SecretsManagerClient", "PutResourcePolicyCommand").f(void 0, void 0).ser(se_PutResourcePolicyCommand).de(de_PutResourcePolicyCommand).build() {
    };
    __name(_PutResourcePolicyCommand, "PutResourcePolicyCommand");
    var PutResourcePolicyCommand = _PutResourcePolicyCommand;
    var _PutSecretValueCommand = class _PutSecretValueCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("secretsmanager", "PutSecretValue", {}).n("SecretsManagerClient", "PutSecretValueCommand").f(PutSecretValueRequestFilterSensitiveLog, void 0).ser(se_PutSecretValueCommand).de(de_PutSecretValueCommand).build() {
    };
    __name(_PutSecretValueCommand, "PutSecretValueCommand");
    var PutSecretValueCommand = _PutSecretValueCommand;
    var _RemoveRegionsFromReplicationCommand = class _RemoveRegionsFromReplicationCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("secretsmanager", "RemoveRegionsFromReplication", {}).n("SecretsManagerClient", "RemoveRegionsFromReplicationCommand").f(void 0, void 0).ser(se_RemoveRegionsFromReplicationCommand).de(de_RemoveRegionsFromReplicationCommand).build() {
    };
    __name(_RemoveRegionsFromReplicationCommand, "RemoveRegionsFromReplicationCommand");
    var RemoveRegionsFromReplicationCommand = _RemoveRegionsFromReplicationCommand;
    var _ReplicateSecretToRegionsCommand = class _ReplicateSecretToRegionsCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("secretsmanager", "ReplicateSecretToRegions", {}).n("SecretsManagerClient", "ReplicateSecretToRegionsCommand").f(void 0, void 0).ser(se_ReplicateSecretToRegionsCommand).de(de_ReplicateSecretToRegionsCommand).build() {
    };
    __name(_ReplicateSecretToRegionsCommand, "ReplicateSecretToRegionsCommand");
    var ReplicateSecretToRegionsCommand = _ReplicateSecretToRegionsCommand;
    var _RestoreSecretCommand = class _RestoreSecretCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("secretsmanager", "RestoreSecret", {}).n("SecretsManagerClient", "RestoreSecretCommand").f(void 0, void 0).ser(se_RestoreSecretCommand).de(de_RestoreSecretCommand).build() {
    };
    __name(_RestoreSecretCommand, "RestoreSecretCommand");
    var RestoreSecretCommand = _RestoreSecretCommand;
    var _RotateSecretCommand = class _RotateSecretCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("secretsmanager", "RotateSecret", {}).n("SecretsManagerClient", "RotateSecretCommand").f(void 0, void 0).ser(se_RotateSecretCommand).de(de_RotateSecretCommand).build() {
    };
    __name(_RotateSecretCommand, "RotateSecretCommand");
    var RotateSecretCommand = _RotateSecretCommand;
    var _StopReplicationToReplicaCommand = class _StopReplicationToReplicaCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("secretsmanager", "StopReplicationToReplica", {}).n("SecretsManagerClient", "StopReplicationToReplicaCommand").f(void 0, void 0).ser(se_StopReplicationToReplicaCommand).de(de_StopReplicationToReplicaCommand).build() {
    };
    __name(_StopReplicationToReplicaCommand, "StopReplicationToReplicaCommand");
    var StopReplicationToReplicaCommand = _StopReplicationToReplicaCommand;
    var _TagResourceCommand = class _TagResourceCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("secretsmanager", "TagResource", {}).n("SecretsManagerClient", "TagResourceCommand").f(void 0, void 0).ser(se_TagResourceCommand).de(de_TagResourceCommand).build() {
    };
    __name(_TagResourceCommand, "TagResourceCommand");
    var TagResourceCommand = _TagResourceCommand;
    var _UntagResourceCommand = class _UntagResourceCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("secretsmanager", "UntagResource", {}).n("SecretsManagerClient", "UntagResourceCommand").f(void 0, void 0).ser(se_UntagResourceCommand).de(de_UntagResourceCommand).build() {
    };
    __name(_UntagResourceCommand, "UntagResourceCommand");
    var UntagResourceCommand = _UntagResourceCommand;
    var _UpdateSecretCommand = class _UpdateSecretCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("secretsmanager", "UpdateSecret", {}).n("SecretsManagerClient", "UpdateSecretCommand").f(UpdateSecretRequestFilterSensitiveLog, void 0).ser(se_UpdateSecretCommand).de(de_UpdateSecretCommand).build() {
    };
    __name(_UpdateSecretCommand, "UpdateSecretCommand");
    var UpdateSecretCommand = _UpdateSecretCommand;
    var _UpdateSecretVersionStageCommand = class _UpdateSecretVersionStageCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("secretsmanager", "UpdateSecretVersionStage", {}).n("SecretsManagerClient", "UpdateSecretVersionStageCommand").f(void 0, void 0).ser(se_UpdateSecretVersionStageCommand).de(de_UpdateSecretVersionStageCommand).build() {
    };
    __name(_UpdateSecretVersionStageCommand, "UpdateSecretVersionStageCommand");
    var UpdateSecretVersionStageCommand = _UpdateSecretVersionStageCommand;
    var _ValidateResourcePolicyCommand = class _ValidateResourcePolicyCommand extends import_smithy_client5.Command.classBuilder().ep({
      ...commonParams
    }).m(function(Command, cs, config, o) {
      return [
        (0, import_middleware_serde2.getSerdePlugin)(config, this.serialize, this.deserialize),
        (0, import_middleware_endpoint2.getEndpointPlugin)(config, Command.getEndpointParameterInstructions())
      ];
    }).s("secretsmanager", "ValidateResourcePolicy", {}).n("SecretsManagerClient", "ValidateResourcePolicyCommand").f(void 0, void 0).ser(se_ValidateResourcePolicyCommand).de(de_ValidateResourcePolicyCommand).build() {
    };
    __name(_ValidateResourcePolicyCommand, "ValidateResourcePolicyCommand");
    var ValidateResourcePolicyCommand = _ValidateResourcePolicyCommand;
    var commands = {
      BatchGetSecretValueCommand,
      CancelRotateSecretCommand,
      CreateSecretCommand,
      DeleteResourcePolicyCommand,
      DeleteSecretCommand,
      DescribeSecretCommand,
      GetRandomPasswordCommand,
      GetResourcePolicyCommand,
      GetSecretValueCommand: GetSecretValueCommand2,
      ListSecretsCommand,
      ListSecretVersionIdsCommand,
      PutResourcePolicyCommand,
      PutSecretValueCommand,
      RemoveRegionsFromReplicationCommand,
      ReplicateSecretToRegionsCommand,
      RestoreSecretCommand,
      RotateSecretCommand,
      StopReplicationToReplicaCommand,
      TagResourceCommand,
      UntagResourceCommand,
      UpdateSecretCommand,
      UpdateSecretVersionStageCommand,
      ValidateResourcePolicyCommand
    };
    var _SecretsManager = class _SecretsManager extends SecretsManagerClient2 {
    };
    __name(_SecretsManager, "SecretsManager");
    var SecretsManager = _SecretsManager;
    (0, import_smithy_client5.createAggregatedClient)(commands, SecretsManager);
    var paginateBatchGetSecretValue = (0, import_core3.createPaginator)(SecretsManagerClient2, BatchGetSecretValueCommand, "NextToken", "NextToken", "MaxResults");
    var paginateListSecretVersionIds = (0, import_core3.createPaginator)(SecretsManagerClient2, ListSecretVersionIdsCommand, "NextToken", "NextToken", "MaxResults");
    var paginateListSecrets = (0, import_core3.createPaginator)(SecretsManagerClient2, ListSecretsCommand, "NextToken", "NextToken", "MaxResults");
  }
});

// src/todo/deleteTodo.ts
var deleteTodo_exports = {};
__export(deleteTodo_exports, {
  deleteTodo: () => deleteTodo
});
module.exports = __toCommonJS(deleteTodo_exports);

// src/utils/db.ts
var import_pg = __toESM(require_lib2());

// src/utils/secret-management.ts
var import_client_secrets_manager = __toESM(require_dist_cjs53());
var getSecret = async (secretName2) => {
  const client = new import_client_secrets_manager.SecretsManagerClient({
    region: "us-east-1"
  });
  let response;
  try {
    response = await client.send(
      new import_client_secrets_manager.GetSecretValueCommand({
        SecretId: secretName2
      })
    );
  } catch (error) {
    throw error;
  }
  return response;
};

// src/utils/db.ts
var createDbInstance = async (dbSecretName) => {
  const secret = await getSecret(dbSecretName);
  if (!secret.SecretString) {
    throw Error("There is no secret string");
  }
  const parsedSecret = JSON.parse(secret.SecretString);
  return new import_pg.Client({
    host: parsedSecret.db_host,
    user: parsedSecret.db_user,
    password: parsedSecret.db_password,
    database: parsedSecret.db_database,
    port: parsedSecret.db_port
  });
};

// src/utils/query.ts
var query = {
  getTodo: "SELECT * FROM todo WHERE id = $1",
  getAllTodo: "SELECT * FROM todo",
  insertTodo: "INSERT INTO todo(name, status, due_date, priority) VALUES($1, $2, $3, $4) RETURNING *",
  deleteTodo: "DELETE FROM todo WHERE id = $1",
  updateTodo: "UPDATE todo SET name = $1, status = $2, priority = $3 WHERE id = $4 RETURNING *"
};

// src/todo/getTodos.ts
var secretName = "db-secret";

// src/todo/deleteTodo.ts
var deleteTodo = async (_event, _context) => {
  console.log("start::deleteTodo");
  if (!_event.pathParameters) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Bad Request"
      })
    };
  }
  console.info("start::deleteTodo");
  const { id } = _event.pathParameters;
  console.info("delete::todo:id", id);
  const db = await createDbInstance(secretName);
  let result;
  try {
    await db.connect();
    result = await db.query(query.deleteTodo, [id]);
  } catch (err) {
    console.error("error: ", err);
  } finally {
    await db.end();
    console.info("end::deleteTodo");
  }
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Delete todo successfully"
    })
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  deleteTodo
});
