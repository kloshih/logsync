/*
 * log.js
 *
 * @MARK: Module
 */

/** @type {import('sprintf-js').sprintf} */
const sprintf = require('sprintf-js').sprintf;

/** @type {import('./colorize.js')} */
const colorize = require('./colorize.js')

/** @type {import('./dump.js')} */
const dump = require('./dump.js');

/** @type {import('strftime')} */
const strftime = require('strftime');

const { Console } = require('console');

const slice = Array.prototype.slice;
const platform = null;
const empty = Object.freeze({});

/** @type {import('./tracer.js')} */
let tracer /* = require('./tracer.js') lazy */;

// const compact = require('./format/compact.js');

let env = {},
    pid = null,
    hostname = null,
    proc = null,
    ip = null,
    mac = null;
if (typeof(process) !== 'undefined') {
  const os = require('os');
  env = process.env;
  pid = process.pid;
  hostname = os.hostname();
  proc = process.argv[1];
  proc && (proc = proc.replace(/.*\x2f/, ''));

  /* Find the network interface card */
  const ipnis = os.networkInterfaces();
  for (let key in ipnis) {
    const nis = ipnis[key] || [];
    for (let i = 0, ic = nis.length; i < ic; i++) {
      const ni = nis[i];
      if (ni.internal) break;
      if (ni.family != 'IPv4') continue;
      ip = ni.address;
      mac = ni.mac;
      break;
    }
  }

}
const host = { nm:hostname, ip:ip, mac:mac, proc:proc, pid:pid };

// /**
//  * @function log
//  * @param  {object} object 
//  * @param  {string} level
//  * @param  {string} message 
//  * @param  {...any} [args] Argsa
//  * @return {this}
//  */
// /**
//  * @function log
//  * @param  {string} level
//  * @param  {string} message 
//  * @param  {...any} [args] Argsa
//  * @return {this}
//  */

// log('info', "test")

/** —±
 * @param  {string} level The log level name 
 * @param  {string} format Log message
 * @return {boolean} `true` if logged
 */
function log(level, format) {
  return props.recordv(1, 'log', slice.call(arguments))
}

/**
 * @typedef {object} LogLoc
 * @prop {string} path The path
 * @prop {string} source The file package name
 * @prop {string} prefix The file package name
 * @prop {string} pkg The file package name
 * @prop {string} file The file name
 * @prop {string=} subpath The file's subpath within the project
 * @prop {string=} kind The kind of file
 * @prop {number=} line A line number
 * @prop {number=} col A column number
 */

/**
 * @typedef {'log'|'enter'|'leave'} LogRecordType 
 * The log record type
 */

/** 
 * @typedef {object} LogRecord
 * A log record
 * @prop {LogRecordType} type Type of record 
 * @prop {string} level The record's log level
 * @prop {string} message The message 
 * @prop {any} [error] An error if any
 * @prop {LogLoc} loc The log location
 * @prop {number} prio The priority 
 * @prop {string} host Host name
 * @prop {Date} date Date stamp of the log record
 * @prop {number} depth The stack depth
 * @prop {LogDiagnosticContext=} mdc The diagnostic context 
 * @prop {boolean} appended `true` if this record has already been appended
 * 
 */

/**
 * @typedef {object} LogConfig
 */

const props = {

  maxLevels: {
    '*:*': 'warn',
  },

  transportConfigs: {},

  /** Configures the log.
   *
   *  @param {LogConfig} config The config
   */
  configure: function(config) {
    /* Configure the maxLevels levels */
    let configLevels = config && config.levels || env.LOGLEVEL || env.LOGLEVELS || 'warn';
    if (typeof(configLevels) == 'string') {
      const parsed = {};
      const parts = configLevels.trim().split(/\s*,\s*/);
      for (let p = 0, pc = parts.length; p < pc; p++) {
        const part = parts[p];
        const match = part.match(/^(?:(.+)=)?(\w+)$/);
        if (!match)
          throw new Error("Log config must be of the format, \"[[[<module>|*]:][<file>|*]=]<level>\", in config: " + configLevels);
        const spec = match[1] || '*:*',
            level = match[2];
        parsed[spec] = level;
      }
      configLevels = parsed;
    }
    props.maxLevels = {
      '*:*':'warn',
    };
    props.maxOverallPriority = levels['warn'];
    for (let spec in configLevels) {
      const level = configLevels[spec],
          prio = levels[level];
      if (spec == '*')
        spec = '*:*';
      if (!prio)
        throw new Error("Log does not support configured level, \"" + level + "\", in config: " + config);
        props.maxLevels[spec] = level;
      if (props.maxOverallPriority < prio)
      props.maxOverallPriority = prio;
    }
    maxLevelCache = {};
    // console.log("configure: maxLevels", props.maxLevels);

    /* Configure the transports */
    const configTransports = config && config.transports || env.LOGTRANSPORT || env.LOGTRANSPORTS || 'console?format=compact';
    if (typeof(configTransports) === 'string') {
      const parsed = {};
      const parts = configTransports.trim().split(/\s*;\s*/);
      for (let p = 0, pc = parts.length; p < pc; p++) {
        const part = parts[p];
        const match = part.match(/^(\w+)(?::[^\?]*)?(?:\?(.*))?$/);
        if (!match)
          throw new Error("Log tranpsort must be of the format, \"<transport>[:<opaque>][?<param>=<value>[&<param>=<value>]*]\", in config: " + configLevels);
        const params = {};
        (match[2] ? match[2].split('&') : []).forEach(function(piece) {
          const match = piece.match(/^(.*?)(?:=(.*))?$/)
          if (!match)
            throw new Error("Malformed query param: '" + piece + "'");
          const key = decodeURIComponent(match[1]),
              val = match[2] != null ? decodeURIComponent(match[2]) : '';
          params[key] = val.match(/^(-|\+|)\d+(\.\d+)?/) ? parseFloat(val) : val || true;
        });
        const conf = { name:match[1], url:match[0], params:params, format:params.format };
        delete(params.format)
        parsed[match[1]] = conf;
      }
      props.transportConfigs = parsed;
    }
    props.transports && props.transports.forEach(function(t) { t.detach(log) });
    props.transports = null;
    // console.log("configure: transportConfigs", props.transportConfigs);
  },

  /**
   * Returns `true` if the log level is logged
   * @param {string} level The log level
   * @param {LogRecord} [record] Optionally, the log level 
   * @returns {boolean} `true` if the level is logged
   */
  logs: function(level, record) {
    return props._logs(1, level, record);
  },

  /**
   * Returns the maximum logging level for the given *loc* 
   * @param  {LogLoc} loc The log location
   * @return {string}
   */
  maxLevel: function(loc) {
    if (!loc)
      throw new Error("No loc");
    let maxLevel = maxLevelCache[loc.path];
    if (!maxLevel) {
      const config = props.maxLevels;
      const pkg = loc.pkg, file = loc.file;
      maxLevel = maxLevelCache[loc.path] = config[pkg + ':' + file] || config[pkg + ':*'] || config['*:' + file] || config['*:*'];
    }
    return maxLevel;
  },

  /**
   * Appends a log message  
   * @param {string} level The log level
   * @param {string} format A message or message format
   * @returns {boolean}
   */
  log: function(level, format) {
    return props.recordv(1, 'log', slice.call(arguments))
  },

  /**
   * 
   * @param {*} level 
   * @param {*} format 
   * @returns 
   */
  enter: function(level, format) {
    props.recordv(1, 'enter', slice.call(arguments));
    return stack.length - 1;
  },

  /**
   * 
   * @param {*} level 
   * @param {*} format 
   * @returns 
   */
  leave: function(level, format) {
    const args = slice.call(arguments);
    const depth = typeof(args[0]) === 'number' ? args.shift() : null;
    const record = depth == null ? stack.pop() : stack.splice(depth)[0];
    if (record && args.length > 0) {
      // console.log("leave record=", record);
      const interval = Date.now() - record.date.getTime();
      args[1] += " #bbk[- " + interval + " ms]";
      props.recordv(1, 'leave', args);
    }
    return stack.length;
  },

  /**
   * 
   * @param {number} frame The frame
   * @param {?Error} [error] An error
   * @param {string} [key] A key
   * @returns {LogLoc} A loc location
   */
  loc: function(frame, error, key) {
    let locInfo = locCache[key] || (locCache[key] = { count:0, lines:{} });
    if (locInfo.cache)
      return locInfo.cache;

    if (!frame || frame < 0)
      frame = 0;
    if (!error) {
      try {
        throw new Error()
      } catch (err) {
        error = err;
      }
    }
//      error || (error = new Error());
    const lines = error?.stack?.split('\n', frame + 3) || [];
    const line = lines[lines.length - 1];

    let match
    /** @type {LogLoc} */
    let loc;
    if (match = line.match(/at (?:(.*) \()?((?:(.*\x2f)([^\x2f\n]+)(\x2f(lib|src|dist|test|bin|conf)\x2f(?:.*\x2f)?))?(([^\x2f\n]+?)(?:\.([^\x2f\n]+))?)):(\d+):(\d+)\)?/)) {
      loc = {
        // name: match[1],
        path: match[0],
        source: match[2],
        prefix: match[3],
        pkg: match[4],
        subpath: match[5],
        kind: match[6],
        file: match[7],
        // basename: match[8],
        // extname: match[9],
        line: match[10] ? parseInt(match[10]) : undefined,
        col: match[11] ? parseInt(match[11]) : undefined,
      };
    }
    // "loc@http://localhost:8080/index_bundle.js:11371:26"
    // "recordv@http://localhost:8080/index_bundle.js:11418:25"
    // "Session@http://localhost:8080/index_bundle.js:21084:23"
    // "http://localhost:8080/index_bundle.js:21105:26"
    // "__webpack_require__@http://localhost:8080/index_bundle.js:20:34"

    else if (match = line.match(/at (?:(.*) \()?((?:(.*\x2f)([^\x2f\n]+)(\x2f(?:.*\x2f)?))?(([^\x2f\n]+?)(?:\.([^\x2f\n]+))?)):(\d+):(\d+)\)?/)) {
      loc = {
        // name: match[1],
        path: match[0],
        source: match[2],
        prefix: match[3],
        pkg: match[4],
        subpath: match[5],
        // kind: match[6],
        file: match[6],
        // basename: match[7],
        // extname: match[8],
        line: match[9] ? parseInt(match[9]) : undefined,
        col: match[10] ? parseInt(match[10]) : undefined,
      };
    }
    // "loc@http://localhost:8080/index_bundle.js:11371:26"
    // "recordv@http://localhost:8080/index_bundle.js:11418:25"
    // "Session@http://localhost:8080/index_bundle.js:21084:23"
    // "http://localhost:8080/index_bundle.js:21105:26"
    // "__webpack_require__@http://localhost:8080/index_bundle.js:20:34"

    else if (match = line.match(/at (?:(.*) \x28)?((https?:\x2f\x2f[^\x2f]+\x2f)(.*?\x2f)?([^\x2f]+)):(\d+):(\d+)/)) {
      /* Chrome */
      loc = {
        // name: match[1],
        path: match[0],
        source: match[2],
        prefix: match[3],
        pkg: 'browser',
        subpath: match[4],
        kind: undefined,
        file: match[5],
        line: match[6] ? parseInt(match[6]) : undefined,
        col: match[7] ? parseInt(match[7]) : undefined,
      };
    }
    else if (match = line.match(/at (?:(.*) \x28)?<anonymous>/)) {
      /* Chrome */
      loc = {
        path: match[0],
        // name: match[1],
        source: 'unknown',
        prefix: 'unknown',
        pkg: 'builtin',
        subpath: undefined,
        kind: undefined,
        file: '<builtin>',
        line: undefined,
        col: undefined,
      };
    }
    else {
      throw new Error("UNSUPPORTED FORMAT: " + line + "\n" + error?.stack);
    }

    /* Track stats */
    locInfo.lines[line] = locInfo.lines[line] ?? 0 + 1;
    locInfo.count++;
    if (locInfo.count > 100 && Object.keys(locInfo.lines).length == 1) {
      locInfo.cache = loc;
    }

    return loc;
  },

//    LOGSINK = "console:?level=info&format=compact"
//    LOGSINK = "file:/var/log/es/rk:file.log?level=info,count=5&time=0:00&size=1MB&zip=gzip&format=compact"
//    LOGSINK = "mongo://host/db/coll?level=info"

  /**
   * 
   * @param {*} frame 
   * @param {*} level 
   * @param {*} record 
   * @returns 
   */
  _logs: function(frame, level, record) {
    const loc = record && record.loc || props.loc(frame + 1);
//      if (!record)
//        record = props.loc(frame + 1);
    const prio = levels[level];
    if (!prio) throw new Error("Unsupported level: " + level);
    const maxLevel = props.maxLevel(loc);
    const maxPrio = levels[maxLevel];
    return prio <= maxPrio;
  },

  /**
   * 
   * @param {*} frame 
   * @param {*} type 
   * @param {*} args 
   * @returns 
   */
  recordv: function(frame, type, args) {
    let level = args.shift();
    if (Array.isArray(level))
      frame += level[1], level = level[0];
    const prio = levels[level];

    const defPrio = levels[props.maxLevels['*:*']];
    if (type !== 'enter' && prio > defPrio)
      return false;
// console.log("prio=" + prio + ", props.maxOverallPriority=" + props.maxOverallPriority);
//      if (prio > props.maxOverallPriority)
//        return false;
    const loc = props.loc(frame + 1, null, args[0]);
// console.log("loc=", loc);
    const maxLevel = props.maxLevel(loc);
    const maxPrio = levels[maxLevel];
    const logs = prio <= maxPrio;
// console.log("logs=" + logs + ", maxLevel=" + maxLevel + ", maxPrio=" + maxPrio);
    if (type !== 'enter' && !logs)
      return false;

    /** @type {LogRecord} */
    const record = {
    };
    record.type = type;
    record.level = level;
    if (typeof(args[0]) !== 'string' && typeof(args[1]) === 'string')
      record.error = args.shift();
    for (let i = 1, ic = args.length; i < ic; i++) {
      const arg = args[i];
      // console.log(" i=" + i + ", arg=" + arg + ", classof=" + classof(arg));
      switch (classof(arg)) {
        case 'object':
        case 'array':
          args[i] = dump(args[i], {depth:2, maxlen:1e3});
          break;
      }
    }
    try {
      record.message = args.length == 1 ? args[0] : sprintf.apply(null, args)
    } catch (error) {
      throw error;
    }
    record.loc = loc;
    record.prio = prio;
    record.host = hostname;
    record.date = new Date();
    record.depth = stack.length;
    record.mdc = mdc;

    // console.log(record);

    if (logs) {
      for (let i = 0, ic = stack.length; i < ic; i++) {
        const prev = stack[i];
        if (!prev.appended) {
          props.append(prev);
        }
      }
      props.append(record);
    }
    if (type === 'enter')
      stack.push(record);
    return true;
  },

  /**
   * 
   * @param {*} record 
   */
  append: function(record) {
    // console.log("append record", record);
    /* If we haven't figured out our transports, then initialize our
      * transports the first time */
    if (!props.transports)
      props._initTransports()
    // console.log("transports", props.transports);

    /* Append each transport */
    for (let t = 0, tc = props.transports.length; t < tc; t++) {
      const transport = props.transports[t];
      transport.append(record);
    }

    record.appended = true;
  },

  /** 
   * @typedef {{new (...args:any[]): any} & { id:string }} LogPlugin
   */

  /** 
   * Registers a plugin with the log. There are two logins at the moment.
   * @param {LogPlugin} plugin The plugin ({function}, required)
   */
  use: function(plugin) {
    if (typeof(plugin) === 'function' && plugin.prototype instanceof Transport) {
      const id = plugin.id || plugin.name.replace(/Transport$/, '').toLowerCase();
      // console.log("log: registering transport " + id, plugin);
      props._registeredTransports[id] = plugin;
    } else if (typeof(plugin) === 'function' && plugin.prototype instanceof Format) {
      const id = plugin.id || plugin.name.replace(/Format$/, '').toLowerCase();
      // console.log("log: registering format " + id, plugin);
      props._registeredFormats[id] = plugin;
    } else {
      throw new Error("Unsupported plugin: " + plugin);
    }
  },

  _registeredTransports: {},
  _registeredFormats: {},

  /** 
   * Initialize the transports configured for this
   * @since  1.0
   */
  _initTransports: function() {
    props.transports && props.transports.forEach(function(t) { t.detach(log) });
    props.transports = [];
    for (let id in props.transportConfigs) {
      const config = props.transportConfigs[id];
      const Transport = props._registeredTransports[id];
      if (!Transport) {
        console.log("log: no such transport: " + id + ", registered: " + (Object.keys(props._registeredTransports).join(', ') || '<none>'));
        continue;
      }
      const transport = new Transport(config);
      if (!transport.format) {
        const formatId = config.format || transport.defaultFormat;
        const Format = props._registeredFormats[formatId];
        if (!Format) {
          console.log("log: no such format: " + formatId);
          continue;
        }
        const format = new Format();
        transport.format = format;
      }
      transport.attach();
      props.transports.push(transport);
    }
  },

//    formats: {},
//    addFormat(name, func) {
//      this.formats[name] = func;
//    },
//
//    sinks: {},
//    addSink(name, func) {
//      this.sinks[name] = func;
//    },

  // dump: dump,
  // sprintf: sprintf,

  // colorize: colorize,
  // ansiize: colorize.ansiize,
  // htmlize: colorize.htmlize,
  // strftime,

  /**
   * 
   * @return {any} The trace
   */
  trace: function() {
    tracer || (tracer = require('./tracer.js'));
    return tracer.trace.apply(tracer, arguments);
  },

  /**
   * Untraces 
   * @returns {any} The etrace
   */
  untrace: function() {
    tracer || (tracer = require('./tracer.js'));
    return tracer.untrace.apply(tracer, arguments);
  },

};

log.maxLevels = props.maxLevels
log.maxLevel = props.maxLevel
log.configure = props.configure
log.log = props.log
log.logs = props.logs
log.recordv = props.recordv
log.enter = props.enter
log.leave = props.leave
log.loc = props.loc
log.use = props.use
// log.dump = dump
log.sprintf = sprintf
log.colorize = colorize
log.strftime = strftime
log.trace = props.trace
log.untrace = props.untrace


// for (let key in props)
//   log[key] = props[key];

/** @type {Record<string,string>} */
let maxLevelCache = {};

/**
 * @typedef {object} LogStackEntry 
 * A stack entry
 * @prop {string} info
 */

/** @type {LogRecord[]} */
const stack = [];

/** 
 * @typedef {Record<string,any>} LogDiagnosticContext 
 */

/** @type {LogDiagnosticContext=} */
const mdc = undefined

const levels = Object.freeze({
  fatal:  1,
  error:  2,
  warn:   3,
  config: 4,
  info:   10,
  debug:  11,
  fine1:  15,
  fine2:  16,
  fine3:  17,
});

/**
 * Create functions
 */
for (let level in levels) {
  /**
   * 
   * @param {string} format The format
   * @return {boolean} `true` if logged
   */
  log[level] = function(format) {
    const args = slice.call(arguments);
    args.unshift(level);
    return props.recordv(1, 'log', args);
  }
}

/**
 * Configures the log 
 */
log.configure({
  levels: env.LOGLEVEL || {'*:*':'warn'},
  transports: env.LOGTRANSPORT || 'console?format=compact',
})

//  addSink: function(sink) {
//
//  },

// LOGLEVEL
// LOGTRANSPORT='console'
// LOGFORMAT='compact'

/**
 * @typedef {object} TransportConfig 
 * A configuration for a transport
 * @prop {string=} name The name of the transport
 * @prop {string=} url The URL for the transport
 * @prop {Record<string,any>=} params Params for transport initialization
 * 
 */

/**
 * 
 */
class Transport {

  static id = ''

  /**
   * Creates a transport
   * @param {TransportConfig} config A transport config
   */
  constructor(config) {
    this.config = config || {};
    this.name = this.config.name;
    this.url = this.config.url;
    this.params = this.config.params ?? {};
    /** @type {Format=} */
    this.format
  }
  
   /**
   * Attaches the transport
   * @param {any} log The log
   */
  attach(log) {
  }

  /**
   * Attaches the transport
   * @param {any} log The log
   */
  detach(log) {
  };

  /**
   * Appends a log *record* to the transport
   * @param {LogRecord} record The log record
   */
  append(record) {
    // console.log("Transport.append(): record=" + record);
    const data = this.format?.format(record);
    // console.log("Transport.append(): data=" + data);
    if (data)
      this.write(data);
  };

  /**
   * Appends a log *record* to the transport
   * @param {string|Buffer} data The log data
   */
  write(data) {
  };

}


// /**
//  * 
//  * @param {TransportConfig} config A transport config
//  */
// function Transport(config) {
//   this.config = config || {};
//   this.name = this.config.name;
//   this.url = this.config.url;
//   this.params = this.config.params;
// }

// /**
//  * Attaches the transport
//  * @param {log} log The log
//  */
// Transport.prototype.attach = function(log) {
// };

// /**
//  * Attaches the transport
//  * @param {log} log The log
//  */
// Transport.prototype.detach = function(log) {
// };

// /**
//  * Appends a log *record* to the transport
//  * @param {LogRecord} record The log record
//  */
// Transport.prototype.append = function(record) {
//   // console.log("Transport.append(): record=" + record);
//   const data = this.format.format(record);
//   // console.log("Transport.append(): data=" + data);
//   this.write(data);
// };

// /**
//  * Appends a log *record* to the transport
//  * @param {string|Buffer} data The log data
//  */
// Transport.prototype.write = function(data) {
// };

// log.Transport = Transport;

// /**
//  * @class 
//  */
// function ConsoleTransport() {
//   Transport.call(this, 'console', 'compact');
//   this.browser = typeof(window) !== 'undefined';
// }

// ConsoleTransport.prototype = Object.create(log.Transport.prototype);

// /**
//  * Appends a log *record* to the transport
//  * @param {string|Buffer} data The log data
//  */
// ConsoleTransport.prototype.write = function(data) {
//   if (this.browser) {
//     const parts = colorize.browserize(data);
//     // console.log("parts", parts);
//     console.log.apply(null, parts);
//   } else {
//     console.log(colorize.ansiize(data));
//   }
// };

class ConsoleTransport extends Transport {

  static id = 'console'
  
  /**
   * Appends a log *record* to the transport
   * @param {string} data The log data
   * @return {void}
   */
  write(data) {
    if (props.browser) {
      const parts = colorize.browserize(data);
      // console.log("parts", parts);
      console.log.apply(null, parts);
    } else {
      console.log(colorize.ansiize(data));
      // process.stdout.write(colorize.ansiize(data) + '\n', 'utf8');
    } 
  }

}
log.use(ConsoleTransport)

// /**
//  * Appends a log *record* to the transport
//  * @param {string|Buffer} data The log data
//  */
// ConsoleTransport.prototype.write = function(data) {
//   if (this.browser) {
//     const parts = colorize.browserize(data);
//     // console.log("parts", parts);
//     console.log.apply(null, parts);
//   } else {
//     console.log(colorize.ansiize(data));
//     // process.stdout.write(colorize.ansiize(data) + '\n', 'utf8');
//   }
// };
// log.use(ConsoleTransport);

// /**
//  * 
//  * @param {*} name 
//  */
// function Format(name) {
//   this.name = name || this.constructor.name.replace(/Format$/, '').toLowerCase();
// }
// Format.prototype.format = function(record) {
//   return record;
// };
// log.Format = Format;

class Format {

  /**
   * Creates a format
   * @param {string} name The name of the format
   */
  constructor(name) {
    this.name = name
    /** @type {string=} */
    this.dateFormat = undefined
  }
 
  /**
   * Formats the *record*
   * @param {LogRecord} record The log record
   * @returns {string} Formatted text for the *record*
   */
  format(record) {
    throw new Error(`ABSTRACT: must be overridden by ${this}`)
  }
  
}

/**
 * The LineFormat implementation of {@link Format} 
 */
class LineFormat extends Format {

  static id = 'line'

  /**
   * Creates a line format
   * @param {string} [name='line'] The name of the format
   */
  constructor(name) {
    super(name ?? 'line')
    this.headerWidth = 30
    this.levels = { fatal:'F', error:'E', warn:'W', config:'C', info:'I', debug:'D', fine1:'1', fine2:'2', fine3:'3' };
    this.colors = ['bbl', 'bcy', 'yl', 'bmg', 'brd', 'cy', 'bl', 'mg'];
    this.nextColorIndex = 0;
    this.pkgColors = {};
  }

  /**
   * Formats the *record*
   * @param {LogRecord} record The log record
   * @returns {string} Formatted text for the *record*
   */
  format(record) {
    const time = strftime(this.dateFormat || "%S.%L", record.date)
    const loc = record.loc, path = loc.path;
    const marker = record.type === 'enter' ? '#bbk[\\]' : record.type === 'leave' ? '#bbk[/]' : '#bbk[:]';
  
    const file = loc.file != 'index.js' ? loc.file : loc.subpath?.replace(/.*\x2f(.*)\x2f/, '$1/index.js');
  
    const pkgColor = this.pkgColors[loc.pkg] || (this.pkgColors[loc.pkg] = this.colors[this.nextColorIndex++ % this.colors.length]);
    const frameText = sprintf("#%s[%s] #%s[%s]#wh[:%s]", pkgColor, loc.pkg, loc.kind == 'test' ? 'bcy' : 'bwh', file, loc.line);
    const text = sprintf("#bbk[%-6s] #bk[%1.1s] %-" + this.headerWidth + "s%" + record.depth + "s%s %s", time, this.levels[record.level], frameText, '', marker, record.message);
    // console.log(text);
    const x = text
      .replace(/^#bbk\x5b.*#bbk\x5b:\x5d \^\^/, '  ')
      .replace(/^(#bbk\x5b.{6}\x5d).*?#bbk\x5b:\x5d \^/, '$1 ')
      .replace(/\n/g, '\n  ');
    // console.log(x);
    return x;
  }

}
log.use(LineFormat)


// /**
//  * @class
//  */
// function LineFormat() {
//   Format.call(this, 'compact');
//   this.levels = { fatal:'F', error:'E', warn:'W', config:'C', info:'I', debug:'D', fine1:'1', fine2:'2', fine3:'3' };
//   this.colors = ['bbl', 'bcy', 'yl', 'bmg', 'brd', 'cy', 'bl', 'mg'];
//   this.nextColorIndex = 0;
//   this.pkgColors = {};
// }
// LineFormat.prototype = Object.create(log.Format.prototype);
// LineFormat.prototype.format = function(record) {
//   const time = strftime(this.dateFormat || "%S.%L", record.date)
//   const loc = record.loc, path = loc.path;
//   const marker = record.type === 'enter' ? '#bbk[\\]' : record.type === 'leave' ? '#bbk[/]' : '#bbk[:]';

//   const file = loc.file != 'index.js' ? loc.file : loc.subpath.replace(/.*\x2f(.*)\x2f/, '$1/index.js');

//   const pkgColor = this.pkgColors[loc.pkg] || (this.pkgColors[loc.pkg] = this.colors[this.nextColorIndex++ % this.colors.length]);
//   const frameText = sprintf("#%s[%s] #%s[%s]#wh[:%s]", pkgColor, loc.pkg, loc.kind == 'test' ? 'bcy' : 'bwh', file, loc.line);
//   const text = sprintf("#bbk[%-6s] #bk[%1.1s] %-" + this.headerWidth + "s%" + record.depth + "s%s %s", time, this.levels[record.level], frameText, '', marker, record.message);
//   // console.log(text);
//   const x = text
//     .replace(/^#bbk\x5b.*#bbk\x5b:\x5d \^\^/, '  ')
//     .replace(/^(#bbk\x5b.{6}\x5d).*?#bbk\x5b:\x5d \^/, '$1 ')
//     .replace(/\n/g, '\n  ');
//   // console.log(x);
//   return x;
// }


/**
 * 
 */
class CompactFormat extends LineFormat {

  static id = 'compact'

  /**
   * Creates a line format
   * @param {string} name The name of the format
   */
  constructor(name) {
    super(name ?? 'compact')
    this.dateFormat = '%S.%L';
    this.headerWidth = 55;
  }

}
log.use(CompactFormat)

/**
 * 
 */
class FullFormat extends LineFormat {

  static id = 'full'

  /**
   * Creates a line format
   * @param {string} name The name of the format
   */
  constructor(name) {
    super(name ?? 'full')
    this.dateFormat = '%Y-%m-%d %H:%M:%S.%L';
    this.headerWidth = 65;
    }

}
log.use(FullFormat)

// /** 
//  *
//  *
//  */
// function CompactFormat() {
//   LineFormat.call(this, arguments);
//   this.dateFormat = '%S.%L';
//   this.headerWidth = 55;
// }
// CompactFormat.prototype = Object.create(LineFormat.prototype);
// log.use(CompactFormat);

// function FullFormat() {
//   LineFormat.call(this, arguments);
//   this.dateFormat = '%Y-%m-%d %H:%M:%S.%L';
//   this.headerWidth = 65;
// }
// FullFormat.prototype = Object.create(LineFormat.prototype);
// log.use(FullFormat);


function classof(value) {
  return toString.call(value).match(/^\[object (.*)\]$/)[1].toLowerCase();
}
const toString = Object.prototype.toString;

const locCache = {};

// /*
//   * Export to CommonJS and global.
//   */
// if (typeof(module) === 'object') {
//   module.exports = log;
// } else {
//   const prevlog = root.log;
//   root.log = log;
//   log.noConflict = function() { root.log = prevlog; return log; };
// }

log.Transport = Transport
log.ConsoleTransport = ConsoleTransport
log.Format = Format
log.LineFormat = LineFormat
log.CompactFormat = CompactFormat
log.FullFormat = FullFormat

module.exports.log = log
// module.exports.default = log
// module.exports.log.dump = dump
module.exports.dump = dump
module.exports.sprintf = sprintf



