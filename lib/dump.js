/*
 * dump.js
 */

const sprintf = require('sprintf-js')

/**
 * @typedef {object} DumpOpts 
 * Options for the {@link dump dump()} function
 * @prop {number} [maxlen=80] The max line length
 * @prop {number} [depth=5] The maximum depth 
 * @prop {string} [indent] The initial indent string
 * @prop {string[]} [ntypes] An array of numeric typesa
 * @prop {boolean} [objects] If to display the content of objects
 * @prop {'object'} [mode] Mode 
 * @prop {string[]} [keys] Mode 
 * @prop {string[]} [nkeys] Mode 
 * @prop {boolean} [props] Show properties
 * @prop {boolean} [arrayIndexes] Whether to display array indexes
 * @prop {number} [ellipses] Maximum length for strings before showing ellipses
 */

/** @type {Record<string,boolean>} */
const dumpIgnoredKeys = { _super:true, superkeys:true, className:true, klass:true, 'this':true, $self:true }

/**
 * Returns a string dump of describing the object
 * @param  {any} object The object (optional)
 * @param  {DumpOpts} [opts] The options (object, optional)
 * @param  {string} [indent] The current indentation (string, optional)
 * @param  {number} [depth] The current depth (numberp, optional)
 * @return {string} The dump output
 */
function dump(object, opts, indent, depth) {
  // const dump = arguments.callee;
  if (!opts) opts = {};
  if (!indent) indent = opts.indent ?? "";
  if (depth === undefined) depth = opts.depth !== undefined ? opts.depth : 5;
  if (!opts.maxlen) opts.maxlen = 80;

  const len = (/** @type {string[]} */buf) => buf.reduce((r, str) => r + str.length, 0)
  // function len(buf) { 
  //   let len = 0; 
  //   for (let i=0,ic=buf.length; i<ic; i ++) 
  //     len += buf[i].length; 
  //   return len 
  // }

  const type = typeOf(object);
  if (depth < 0 || (opts.ntypes && opts.ntypes.includes(type))) {
    switch (type) { /* recurse types */
      case "array": return "[..]";
      case "jquery": return "$[..]";
      case "object":
        const klass = classOf(object);
        return klass == "object" ? "{..}" : klass + "()";
    }
  } else if (!opts.objects && type === 'object' && (object.klass || object.class || object.className)) {
    let string = object.toString();
    if (string === '[object Object]')
      string = object.constructor.name + '()';
    if (string === '[object Arguments]')
      string = object.constructor.name + '()';
    return string + '!!';
  }
  /** @type {string[]} */
  const output = []
  /** @type {string[]=} */
  let text;
  switch (type) {
    case "jquery":
      output.push("$", dump(object.get(), opts, indent, depth));
      break;
    case "html":
      output.push("<", object.constructor.code().replace(/\[object HTML(\w+?)ElementConstructor\]/, "$1").toLowerCase());
      for (let i = 0; i < object.attributes.length; i++) {
        output.push(" ", object.attributes[i].name, "=\"", object.attributes[i].value, "\"");
      }
      output.push("/>");
      break;
    case "map":
    case "weakmap":
      /* translate a map into weakmap */
      /** @type {Map<any,any>} */
      const map = object
      /** @type {Record<string,any>=} */
      const copy = {};
      map.forEach(function(val, key) {
        copy[key] = val;
      });
      object = copy
      /* fall through */

    case "object":
      if (object.jquery && object.ajax) {
        break;
      }

      const superkeys = object.superkeys || object.klass && object.klass.superkeys || object.class && object.class.superkeys;
      if (object.className)
        output.push(object.className);
      else if (object.klass)
        output.push(object.klass);
      else if (object.class)
        output.push(object.class);
      output.push("{");
      text = [];
      for (let key in object) {
        if (object.hasOwnProperty && !object.hasOwnProperty(key)) continue;
        const keyValue = object[key];
        if ((object.klass || object.class) && keyValue && keyValue.methodName !== undefined) continue;
        const keyType = typeOf(keyValue);
        if (superkeys && superkeys.indexOf(key) >= 0 || dumpIgnoredKeys[key] || (keyType == "function" && (opts.mode == "object" || keyValue.member))) continue;
        if (opts.keys && opts.keys.indexOf(key) < 0) continue;
        if (opts.nkeys && opts.nkeys.indexOf(key) >= 0) continue;
        if (text.length > 0) text.push(", ");
        const keyText = key.match(/\W/) ? quote(key) ?? '' : key;
        text.push(keyText, ":", dump(keyValue, opts, indent + "  ", depth-1));
        if (len(text) > opts.maxlen || text.indexOf("\n") >= 0) {
          text = undefined;
          break;
        }
      }
      if (text != null) {
        output.push(text.join(''), "}");
      } else {
        text = [];
        for (let key in object) {
          const keyValue = object[key];
          if ((object.klass || object.class) && keyValue && keyValue.methodName !== undefined) continue;
          const keyType = typeOf(keyValue);
          if (superkeys && superkeys.indexOf(key) >= 0 || dumpIgnoredKeys[key] || (keyType == "function" && (opts.mode == "object" || keyValue.member))) continue;
          if (opts.keys && opts.keys.indexOf(key) < 0) continue;
          if (opts.nkeys && opts.nkeys.indexOf(key) >= 0) continue;
          if (text.length > 0) text.push(",");
          text.push("\n", indent, "  ", key, ": ", dump(keyValue, opts, indent + "  ", depth-1));
        }
        output.push(text.join(''), "\n", indent, "}");
      }
      break;
    case "array":
      output.push("[");
      if (object.__iid !== undefined)
        output.push(object.__iid, ':');
      text = [];
      for (let i = 0; i < object.length; i++) {
        if (i > 0) text.push(', ');
        text.push(dump(object[i], opts, indent + "  ", depth-1));
        if (len(text) > opts.maxlen || text.indexOf("\n") >= 0) {
          text = undefined;
          break;
        }
      }
      if (text != null) {
        output.push(text.join(''), "]");
      } else {
        for (let i = 0; i < object.length; i++) {
          if (i > 0) output.push(',');
          output.push("\n", indent, "  ", opts.arrayIndexes ? i + '. ' : '', dump(object[i], opts, indent + "  ", depth-1));
        }
        output.push("\n", indent, "]");
      }
      if (opts.props) {
        const props = {}
        let count = 0;
        for (let key in object) {
          if (parseInt(key).toString() !== key && object.hasOwnProperty(key)){
            props[key] = object[key];
            count++;
          }
        }
        if (count > 0)
          output.push(dump(props, opts, indent + "  ", depth));
      }
      break;
    case "arguments":
      throw new Error("arguments: " + object);
      break;
    case "function":
      output.push(object.toString().replace(/ *\{[^\0]*/m, ""));
      break;
    case "null":
      output.push("null");
      break;
    case "undefined":
      output.push("undefined");
      break;
    case "buffer": {
      let string = object.toString();
      string = quote(ellipses(string, 50));
      string = string.substring(1, string.length - 1);
      output.push('buffer[' + string + ']');
      break;
    }
    case "string": {
      let string = object;
      if (opts.ellipses)
        string = ellipses(string, opts.ellipses);
      output.push(quote(string ?? '') ?? '');
      break;
    }
    case "date":
      try {
        const date = /** @type {Date} */(object)
        output.push(date.toISOString());
      } catch (error) {
        console.log("Failed to encode date: %s", object);
      }
      break;
    default:
      try {
        let string = object.toString();
        if (string === '[object Object]')
          string = object.constructor.name + '()';
        output.push(string);
      } catch(error) {
        output.push("(", type, ")<error: ", error, ">");
      }
      break;
  }
  return output.join('');
}

/**
 * @typedef {'null'|'undefined'|'boolean'|'number'|'bigint'|'string'|'date'|'array'|'object'|'regexp'|'function'|'class'|string} TypeName
 * The name of the type, typically the constructor name of the boxed type
 */

/** 
 * Returns the type of the <i>value</i>. The possible types returned are:
 * "null", "object", "array", "string", "number", "regexp" or the name of
 * the user constructor.
 *
 * @param  {any} value THe value
 * @return {TypeName} The name of the type
 * @author K. Lo Shih <lo@readyon.com>
 * @since  1.0
 */
function typeOf(value) {
  /** @type {TypeName} */
  let type = typeof(value);
  if (value === null) {
    type = 'null';
  } else if (value === undefined) {
    type = 'undefined';
  } else if (type === 'object' && value.jquery != undefined) {
    type = 'jquery';
  } else if (type === 'function' && value.compile && value.exec) {
    type = 'regexp';
  } else if (type === 'function' && value.className !== undefined && value.methodName === undefined) {
    type = 'class';
  } else if (Array.isArray(value)) {
    type = 'array';
  } else if (type === 'object' && (value.klass === undefined || value.class === undefined) && typeof(value.constructor) == 'function') {
    const constructor = value.constructor;
    type = constructor.typeName || (constructor.typeName = (constructor.name || constructor.toString().replace(/\s*function (\w+)[^\0]*/m, '$1').replace(/function \(.*\)[^\0]*/m, 'object').replace(/\[object HTML(\w+?)Element(?:Constructor)?\]/, 'html')).toLowerCase());
  }
  return type;
}

/** 
 * Returns the type of the <i>value</i>. The possible types returned are:
 * "null", "object", "array", "string", "number", "regexp" or the name of
 * the user constructor.
 *
 * @param  {any} value The value (optional)
 * @return {string} The type of the <i>value</i>
 * @author K. Lo Shih <lo@readyon.com>
 * @since  1.0
 * @MARK:  -classOf()
 */
function classOf(value) {
  const type = typeOf(value);
  if (type === "object")
    return value.klass && value.klass.className || value.class && value.class.className || type;
  if (type === "class")
    return value.className;
  return type;
}

/** 
 * Quotes the _string_ with the given _quote_ and _escape_ characters.
 *
 * @param  {string} string The string ({string}, optional)
 * @param  {string} [quote='"'] The quote char ({string}, defaults to '"')
 * @param  {string} [escape='\\'] The escape char ({string}, defaults to '\\')
 * @return {string=} The quoted form ({string})
 */
function quote(string, quote, escape) {
  if (string === null || string === undefined) return undefined;
  if (!quote) quote = '"';
  if (!escape) escape = '\\';
  let text = quote;
  for (let i = 0, ic = string.length; i < ic; i++) {
    const c = string.charAt(i);
    switch (c) {
      case "\t": text += escape + "t"; break;
      case "\r": text += escape + "r"; break;
      case "\n": text += escape + "n"; break;
      case escape: text += escape + escape; break;
      case quote: text += escape + quote; break;
      default:
        const cc = string.charCodeAt(i);
        if (cc >= 32 && cc <= 126)
          text += c;
        else {
          let ct = cc.toString(16);
          if (ct.length < 2)
            ct = '0' + ct;
          text += '\\x' + ct;
        }
    }
  }
  text += quote;
  return text;
}

/** 
 * Returns a string with ellipses
 * @param  {string} text The text ({string}, optional)
 * @param  {number} maxlen The maximum length ({int}, optional)
 * @param  {string} [ellipses='..'] The ellpses to use ({string}, default `..`)
 * @return {string} The ellipsisized string (non-null)
 * @since  1.0
 */
function ellipses(text, maxlen, ellipses) {
  if (!text || !maxlen || text.length <= maxlen) {
    return text;
  } else {
    ellipses || (ellipses = '..');
    return text.substring(0, maxlen - ellipses.length) + ellipses;
  }
}

/**
 * @typedef {object} HexdumpOpts
 * @prop {number} [length] The maximum length to display, defaults to the 
 *     full buffer
 * @prop {number} [width=64] Number of characters per line
 * @prop {number} [word=4] Number of characters per word
 * @prop {string} [color='gr'] The color code for the index. {@link colorize}
 * @prop {string} [indicator='-'] A directional indicator
 * @prop {[number, number]} [select] An optional range of bytes to display a selection
 */

/** 
 * Generates a hex dump of the given *buffer* with the given options:
 *
 * - `width` (number, default 64) - Number of characters per line
 * - `word` (number, default 4) - Number of characters per word
 * - `color` (string, default 'gr') - A named color––
 * - `indicator` (string, default '-') - A direction indicator
 *
 * @param  {Buffer} buffer The data buffer
 * @param  {HexdumpOpts} [options]
 * @return {string} The hex dump text ({string}, non-null)
 */
function hexdump(buffer, options) {
  const indexColor = options?.color ?? 'gr';
  const indicator = options?.indicator ?? '-';
  const select = options?.select;
  const chars = hexdumpChars
  const length = options?.length ?? buffer.length;
//  0000: 0001 0203 0405 0607 0809 0a0b 0c0d 0e0f abcdefghijklmnop
  const text = [];
  const toIndex = (/**@type {number}*/i) => {
    const x = '   ' + i.toString();
    return x.substring(x.length - 4);
  };
  const hex = []
  const toHex = (/**@type {number}*/byte) => {
    let x = byte.toString(16);
    if (x.length === 1) x = '0' + x;
    return x;
  };
  const chr = []
  const toChr = (/**@type {number}*/byte) => {
    switch (byte) {
      case 9:   return '#bbk[\\t]';
      case 10:  return '#bbk[\\n]';
      case 13:  return '#bbk[\\r]';
      default:  if (byte < 32 || byte >= 126) {
                  return '  ';
                } else {
                  return ' ' + (chars[byte] || (chars[byte] = String.fromCharCode(byte)));
                }
    }
  };
  const perline = options?.width ?? 64
  const word = options?.word ?? 4
  const hexwidth = perline * 2 + perline / word + 1;
  let lastColor = null;
  let selected = false;
  for (let i = 0, ic = length; i < ic; i++) {
    const byte = buffer.readUInt8(i);
    const printable = 32 <= byte && byte < 126;
    const color = byte === 0 ? 'bk' : byte < 16 ? 'bbk' : printable ? 'bwh' : 'wh';
    if ((i % perline) === 0) {
      if (i > 0)
        text.push('\n');
      if (i == 0) {
        // @ts-ignore
        text.push(sprintf('#%s[%5d %1.1s]', indexColor, length, indicator));
      } else {
        text.push(' #' + indexColor + '[' + toIndex(i) + ']  ');
      }
      hex.length = chr.length = 0;
    }
    if ((i % word) === 0) hex.push(' '), chr.push(' ');
    if (color != lastColor) {
      if (lastColor)
        hex.push(']');
      if (color)
        hex.push('#', color, '[');
      lastColor = color;
    }
    const shouldSelect = select && select[0] <= i && i < select[1];
    // _.log('info', "#bbl[Select: i=%s, select=%s, selected=%s, shouldSelect=%s]", i, select, selected, shouldSelect);
    if (!selected && shouldSelect)
      hex.push('\x1b[4m'), selected = true;
    else if (selected && !shouldSelect)
      hex.push('\x1b[24m'), selected = false;
    hex.push(toHex(byte));
    chr.push(toChr(byte));
    if ((i % perline) == perline - 1) {
      // @ts-ignore
      text.push(sprintf('%-'+hexwidth+'s%s%s\n       %s', hex.join(''), lastColor ? ']' : '', selected ? '\x1b[24m' : '', chr.join('')));
      hex.length = chr.length = 0;
      lastColor = null;
      selected = false;
    }
  }
  if (hex.length > 0) {
    if (lastColor) hex.push(']');
    if (selected) hex.push('\x1b[24m');
    // @ts-ignore
    text.push(sprintf('%-'+hexwidth+'s\n       %s', hex.join(''), chr.join('')));
    hex.length = chr.length = 0;
  }
  return text.join('');
}


/** 
 * Cache of chars
 * @type {Record<string,string>}
 */
const hexdumpChars = {};

module.exports = dump

// dump.typeOf = typeOf;

// dump.classOf = classOf;
// dump.quote = quote;
// dump.ellipses = ellipses;
// dump.hexdump = hexdump;

