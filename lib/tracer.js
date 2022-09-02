/*
 * tracer.js
 */

const { log, dump } = require('./log.js');

function tracer() {
}

const kv = { typeof: (v) => typeof v };

//tracer.trace = traceMethods;
//tracer.untrace = untraceMethods;

tracer.trace = trace;
tracer.untrace = untrace;

module.exports = tracer;

const ignoredClassKeys = "length,name,prototype,toString".split(',')
const ignoredProtoKeys = "constructor,toString".split(',')
const builtInTypes = /** @type {Class[]} */([Object, String, Array, Date]);

/**
 * @typedef {{new (...args:any[]): any}} Class 
 * An implementation class
 * @typedef {object} Prototype
 * An implementation class
 * @typedef {'class'|'proto'} TraceKind
 * An implementation class
 */

/**
 * @typedef {object} TraceOpts
 * Options for {@link #trace}
 * @prop {Class} [forType] For the given *type*
 */

/*
 * Trace
 *
 */

/**
 * Trace the given *type*
 * @param {Class} type The implementation to trace
 * @param {*} opts Options
 * @return {void}
 */
function trace(type, opts) {
  opts || (opts = {}), opts.forType || (opts.forType = type);
  // console.log("Tracing type: " + type.name);
  traceMethods('class', type, type, opts);
  traceMethods('proto', type, type.prototype, opts);
  /* Propagate our trace */
  const supertype = getSupertypeOf(type);
  // console.log("  supertype: " + (supertype && supertype.name));
  if (supertype && builtInTypes.indexOf(supertype) < 0)
    trace(supertype, opts);
}

/**
 * Traces the the given methdos
 * @param {TraceKind} kind The kind of trace
 * @param {Class} type The implementation class
 * @param {Class|Prototype} target Either the class or prototype
 * @param {TraceOpts} opts The trace options
 */
function traceMethods(kind, type, target, opts) {
  const ignoredKeys = kind == 'class' ? ignoredClassKeys : ignoredProtoKeys;
  const keys = Object.getOwnPropertyNames(target);
  for (let k = 0, kc = keys.length; k < kc; k++) {
    const key = keys[k];
    if (~ignoredKeys.indexOf(key))
      continue;
    const desc = Object.getOwnPropertyDescriptor(target, key)
    if (desc == null)
      throw new Error(`desc required`)
    const impl = desc.value
    if (typeof(impl) !== 'function' || !desc.configurable)
      continue;
    const wrap = wrapMethod(kind, type, key, impl, opts.forType);
    Object.defineProperty(target, key, {value:wrap, configurable:true});
    wrap.unwrap = function() {
      Object.defineProperty(target, key, {value:impl, configurable:true});
    };
  }
}

/** 
 * @typedef {object} WrappedFunctionProps
 * @prop {() => void} [unwrap] A function to unwrap the function
 * @prop {string} [wrap] The name of the wrapper 
 * @prop {Class[]} [forTypes] The types for which this is wrapped
 * 
 * 
 * @typedef {Function & WrappedFunctionProps} WrappedFunction
 */

/**
 */

/**
 * Removes a prior trace for the given *type*
 * @param {Class} type The implementation to trace
 * @param {TraceOpts} [opts] Options
 * @return {void}
 */
function untrace(type, opts) {
  opts || (opts = {}), opts.forType || (opts.forType = type);
  untraceMethods('class', type, type, opts);
  untraceMethods('proto', type, type.prototype, opts);
  /* Propagate our trace */
  const supertype = getSupertypeOf(type);
  if (supertype && supertype !== Object)
    untrace(supertype, opts);
}

/**
 * Removes a prior trace of a type
 * @param {TraceKind} kind The kind of trace
 * @param {Class} type The implementation class
 * @param {Class|Prototype} target Either the class or prototype
 * @param {TraceOpts} opts The trace options
 */
function untraceMethods(kind, type, target, opts) {
  const  keys = Object.getOwnPropertyNames(target);
  for (let k = 0, kc = keys.length; k < kc; k++) {
    const key = keys[k];
    if (~ignoredClassKeys.indexOf(key))
      continue;
    const desc = Object.getOwnPropertyDescriptor(target, key)
    const impl = desc?.value;
    if (kv.typeof(impl) !== 'function')
      continue;
    if (impl.wrap === 'trace') {
      const forTypes = impl.forTypes;
      const index = forTypes.indexOf(opts.forType);
      // console.log("here=" + key + ", index=" + index);
      if (index >= 0) {
        forTypes.splice(index, 1);
        if (forTypes.length === 0) {
          if (!impl.next)
            throw new Error("IMPL");
          Object.defineProperty(target, key, {value:impl.next});
        }
      }
    }
  }
}

/** 
 * Wraps a method call 
 * @param {TraceKind} kind The kind of trace
 * @param {Class} type Implementation class to trace
 * @param {string} key The member name
 * @param {WrappedFunction} impl The method implementation
 * @param {Class=} forType On behalf-of type 
 * @return {WrappedFunction} The wrapped method implementation
 */
function wrapMethod(kind, type, key, impl, forType) {
  /* If we've already wrapped, then simply add ourselves to the wrap method. To
   * support other instrumenters, like require('reloader') or perhaps generalize
   * trace to an intercepter to support chained intercepters, we'll support an
   * setting like {wrap() wrap:<type>, next:<func>, forTypes:[..],
   * unwrap:<unwrap()>} */
  if (impl.wrap === 'trace') {
    class Test {}
    if (forType && (impl.forTypes?.indexOf(forType) ?? 0 < 0)) 
      impl.forTypes?.push(forType);
    return impl;
  }
  const isClass = kind === 'class';
  const argNames = extractArgNames(impl);
  const wrap = function() {
    const cnst = isClass ? this : this.constructor;
    const obj = isClass ? this.name : this;
    if (cnst && (wrap.forTypes?.indexOf?.(cnst) ?? 0 < 0))
      return wrap.next.apply(this, arguments);

    const argText = extractArgText(argNames, arguments);
    let time = hrtime();
    try {
      log.enter(['info',1], "#wh[%s.%s]#bbk[(%s)] #bbk[> %s]", type.name, key, argText, obj);
      const result = wrap.next.apply(this, arguments)
      time = hrtime(time);
      // log.leave(['info',1], "#wh[%s.%s]#bbk[(%s) < %s] #yl[< %s]", type.name, key, argText, objText, dump(result, {maxlen:1e3, depth:1}));
      if (isThenable(result)) {
        const promiseId = nextPromiseId++;
        log.leave(['info',1], "#wh[%s.%s]#bbk[(%s) < %s] #bcy[< promise(%s)]", type.name, key, argText, obj, promiseId);
        result.then(function(/** @type {any} */res) {
          log('info', "^%41s #bcy[promise(%d)] #bbk[resolve] #wh[%s.%s]#bbk[(%s) < %s] #yl[< %s]", '', promiseId, type.name, key, argText, obj, dump(res, {maxlen:1e3, depth:1}));
        }).catch(function(/** @type {Error} */err) {
          const loc = log.loc(1, err);
          log('info', "^%41s #bcy[promise(%d)] #brd[error] #wh[%s.%s]#bbk[(%s) < %s] #byl[%s] #wh[at %s:]#brd[%s:%s]", '', promiseId, type.name, key, argText, obj, err, loc.pkg, loc.file, loc.line);
        });
      } else {
        log.leave(['info',1], "#wh[%s.%s]#bbk[(%s) < %s] #yl[< %s]", type.name, key, argText, obj, dump(result, {maxlen:1e3, depth:1}));
      }
      return result;
    } catch (err) {
      time = hrtime(time);
      const loc = log.loc(1, err);
      log.leave(['info',1], "#wh[%s.%s]#bbk[(%s) < %s] #byl[%s] #wh[at %s:]#brd[%s:%s]", type.name, key, argText, obj, err, loc.pkg, loc.file, loc.line);
      throw err;
    }
  }
  wrap.wrap = 'trace';
  wrap.next = impl;
  wrap.forTypes = forType && [forType];
  return wrap;
}

/* Extract argument names from a function */
/**
 * 
 * @param {Function} func The function
 * @return {string[]}
 */
function extractArgNames(func) {
  for (; func && ('next' in func); func = func['next']);
  const match = func.toString().match(/(\w+)\s*\(([^\x29]+)\)/)
  const argNames = match?.[2].trim().split(/\s*,\s*/) ?? []
  return argNames
}

/* Format arguments with optional names */

/**
 * Extracts the arg text 
 * @param {string[]} names The arg names
 * @param {IArguments} args The runtime arguments
 * @returns {string} The arg text
 */
function extractArgText(names, args) {
  const argText = [];
  for (let i = 0, ic = args.length; i < ic; i++) {
    if (i > 0) argText.push(',');
    const arg = args[i], name = names && names[i];
    if (name) argText.push(name, '=');
    argText.push(dump(arg, {maxlen:1024, depth:1, ellipses:50 }))
  }
  return argText.join('');
}

/**
 * Returns `true if *value* is a thenable, i.e. has a function property "then" 
 * @param {any} value The value
 * @returns {boolean} `true` if the *value* is a thenable
 */
function isThenable(value) {
  return typeof(value?.then) === 'function';
}

/**
 * Returns the superclass of the given *type*
 * @param {Class} type The class
 * @returns {Class} The supertype
 */
function getSupertypeOf(type) {
  const superproto = type && type.prototype && Object.getPrototypeOf(type.prototype);
  return superproto?.constructor;
}


//function traceMethods(type, opts) {
//  if (typeof(type) !== 'function')
//    throw new Error("Can only trace functions/classes");
//  opts || (opts = {}), opts.type || (opts.type = type);
//  let proto = type.prototype;
//  // console.log("Tracing " + type.name + ", target=" + opts.type.name);
//  let keys = Object.getOwnPropertyNames(proto);
//  for (let key of keys) {
//    if (key === 'toString' || key === 'constructor')
//      continue;
//    let desc = Object.getOwnPropertyDescriptor(proto, key),
//        val = desc.value;
//    if (kv.typeof(val) !== 'function')
//      continue;
//    /* Check to see if this has already been wrapped. */
//    let method = val;
//    if (method.wrap === 'trace') {
//      if (method.types.indexOf(opts.type) < 0)
//        method.types.push(opts.type);
//      //console.log(">>> reusing trace adding our type: " + opts.type.name + " => " + method.types.map((t) => t.name).join(', '));
//      continue;
//    }
//    const match = method.toString().match(/(\w+)\s*\(([^\x29]+)\)/),
//        argNames = match && match[2].trim().split(/\s*,\s*/);
//    // if (!argNames) console.log("argNames: " + proto.constructor.name + "." + method.toString());
//    let wrap = function() {
//      const cnst = this.constructor;
//      //console.log(">>> call " + type.name + "." + key + "(), cnst=" + cnst.name + ", types=" + wrap.types.map(function(t) { return t.name }).join(', '));
//      if (wrap.types.indexOf(cnst) < 0) {
//        // console.log(">>> direct");
//        return wrap.method.apply(this, arguments);
//      }
//
//      const objText = this.toString();
//      if (objText === '[object Object]')
//        objText = cnst.name + '()';
//      const argText = [];
//      for (let i = 0, ic = arguments.length; i < ic; i++) {
//        if (i > 0) argText.push(',');
//        let arg = arguments[i], name = argNames && argNames[i];
//        if (name) argText.push(name, '=');
//        argText.push(dump(arg, {maxlen:1024, depth:1}))
//      }
//      argText = argText.join('');
//      let time = hrtime();
//      try {
//        log.enter(['info',1], "#wh[%s.%s]#bbk[(%s)] #bbk[> %s]", type.name, key, argText, objText);
//        const result = wrap.method.apply(this, arguments)
//        time = hrtime(time);
//        // log.leave(['info',1], "#wh[%s.%s]#bbk[(%s) < %s] #yl[< %s]", type.name, key, argText, objText, dump(result, {maxlen:1e3, depth:1}));
//if (result && typeof(result.then) === 'function') {
//  const promiseId = nextPromiseId++;
//  log.leave(['info',1], "#wh[%s.%s]#bbk[(%s) < %s] #bcy[< promise(%s)]", type.name, key, argText, objText, promiseId);
//  result.then(function(res) {
//    log('info', "^%41s #bcy[promise(%d)] resolve #wh[%s.%s]#bbk[(%s) < %s] #yl[< %s]", '', promiseId, type.name, key, argText, objText, dump(res, {maxlen:1e3, depth:1}));
//  }).catch(function(err) {
//    log('info', "^%41s #bcy[promise(%d)] error #wh[%s.%s]#bbk[(%s) < %s] #byl[%s] #wh[at %s:]#brd[%s:%s]", '', promiseId, type.name, key, argText, objText, err, loc.pkg, loc.file, loc.line);
//  });
//} else {
//  log.leave(['info',1], "#wh[%s.%s]#bbk[(%s) < %s] #yl[< %s]", type.name, key, argText, objText, dump(result, {maxlen:1e3, depth:1}));
//}
//        return result;
//      } catch (err) {
//        time = hrtime(time);
//        let loc = log.loc(1, err);
//        log.leave(['info',1], "#wh[%s.%s]#bbk[(%s) < %s] #byl[%s] #wh[at %s:]#brd[%s:%s]", type.name, key, argText, objText, err, loc.pkg, loc.file, loc.line);
//        throw err;
//      }
//    };
//    wrap.wrap = 'trace';
//    wrap.method = method;
//    wrap.types = [opts.type];
//    Object.defineProperty(proto, key, {value:wrap});
//  }
//  if (!('supermethods' in opts) || opts.supermethods) {
//    // (opts.types || (opts.types = [])).push(type);
//    const superproto = Object.getPrototypeOf(proto);
//    if (superproto && superproto.constructor !== Object) {
//      traceMethods(superproto.constructor, opts);
//    }
//  }
//}
//
//function untraceMethods(type, opts) {
//  opts || (opts = {}), opts.type || (opts.type = type);
//  let proto = type.prototype;
//  let keys = Object.getOwnPropertyNames(proto);
//  for (let key of keys) {
//    let desc = Object.getOwnPropertyDescriptor(proto, key),
//        val = desc.value;
//    if (kv.typeof(val) !== 'function')
//      continue;
//    /* Check to see if this has already been wrapped. */
//    let method = val;
//    if (method.wrap === 'trace') {
//      // console.log(">>> checking tracer to " + type.name + "." + key + "()");
//      let index = method.types.indexOf(opts.type);
//      // console.log(">>> method.types=" + method.types);
//      if (index >= 0) {
//        method.types.splice(index, 1);
//        if (method.types.length == 0) {
//          // console.log(">>> uninstalling tracer to " + type.name + "." + method.method);
//          Object.defineProperty(proto, key, {value:method.method});
//        }
//      }
//      continue;
//    }
//  }
//  // console.log("Untracing");
//  const superproto = Object.getPrototypeOf(proto);
//  if (superproto && superproto.constructor !== Object)
//    untraceMethods(superproto.constructor, opts);
//}

let nextPromiseId = 0;

/** @type {(startTime?: any) => any} */
let hrtime;
if (process.hrtime) {
  hrtime = function(startTime) {
    if (!startTime) {
      return process.hrtime();
    } else {
      // console.log("tracer process.hrtime() time=", time);
      startTime = process.hrtime(startTime);
      return startTime[0] * 1e3 + startTime[1] / 1e6;
    }
  };
} else {
  hrtime = function(startTime) {
    if (!startTime) {
      return Date.now();
    } else {
      return Date.now() - startTime;
    }
  };
}
