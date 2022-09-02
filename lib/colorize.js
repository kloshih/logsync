
// https://github.com/Marak/colors.js/blob/master/colors.js
// https://github.com/mattpat/colorize/blob/master/lib/colorize.js

/**
 * @typedef {Record<string,Color>} ColorSet
 * A ColorSet 
 * 
 * @typedef {object} Color
 * A color 
 * @prop {[string, string]} ansi
 * @prop {ColorHTML=} html
 * @prop {ColorCSS=} css
 * 
 * @typedef {object} ColorHTML 
 * @prop {string=} tag The tag name for the markup
 * @prop {string=} color The color of the item if necessary
 * 
 * @typedef {object} ColorCSS
 * @prop {string} color The CSS color name or hex code 
 */

/**
 * @typedef {Record<string,Color|string>} ColorSetSpec
 * A ColorSet 
 */

/**
 * @type {ColorSetSpec}
 */
const colorsSpec = {

  bold:           { ansi:['\x1b[1m',  '\x1b[22m'], html:{ tag:'b' } },
  italic:         { ansi:['\x1b[3m',  '\x1b[23m'], html:{ tag:'i' } },
  underline:      { ansi:['\x1b[4m',  '\x1b[24m'], html:{ tag:'b' } },
  inverse:        { ansi:['\x1b[7m',  '\x1b[27m'] },
  ul: 'underline',
  iv: 'inverse',
  it: 'italic',
  bo: 'bold',
  '*': 'bold',
  '_': 'underline',

  default:        { ansi:['\x1b[39m', '\x1b[39m'], html:{color:'inherit'},
                    css:{color:'#f00'} },
  black:          { ansi:['\x1b[30m', '\x1b[39m'], html:{color:'#000'},
                    css:{color:'#ccc'} },
  red:            { ansi:['\x1b[31m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#990000'} },
  green:          { ansi:['\x1b[32m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#009200'} },
  yellow:         { ansi:['\x1b[33m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#4E4E00'} },
  blue:           { ansi:['\x1b[34m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#007FCD'} },
  magenta:        { ansi:['\x1b[35m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#FF65FF'} },
  cyan:           { ansi:['\x1b[36m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#2CAFB8'} },
  white:          { ansi:['\x1b[37m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#666'} },
  df: 'default',
  bk: 'black',
  rd: 'red',
  gr: 'green',
  yl: 'yellow',
  bl: 'blue',
  mg: 'magenta',
  cy: 'cyan',
  wh: 'white',

  brightblack:    { ansi:['\x1b[90m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#999'} },
  brightred:      { ansi:['\x1b[91m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#E50000'} },
  brightgreen:    { ansi:['\x1b[92m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#00D100'} },
  brightyellow:   { ansi:['\x1b[93m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#9C9C00'} },
  brightblue:     { ansi:['\x1b[94m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#2EAFFF'} },
  brightmagenta:  { ansi:['\x1b[95m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#E500E5'} },
  brightcyan:     { ansi:['\x1b[96m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#007F7F'} },
  brightwhite:    { ansi:['\x1b[97m', '\x1b[39m'], html:{color:'#f00'},
                    css:{color:'#333'} },
  bbk: 'brightblack',
  brd: 'brightred',
  bgr: 'brightgreen',
  byl: 'brightyellow',
  bbl: 'brightblue',
  bmg: 'brightmagenta',
  bcy: 'brightcyan',
  bwh: 'brightwhite',

  gray: 'brightwhite',
  gy:   'brightwhite',

  defaultbg:      { ansi:['\x1b[49m', '\x1b[49m'], html:{color:'inherit'} },
  blackbg:        { ansi:['\x1b[40m', '\x1b[49m'], html:{color:'#000'} },
  redbg:          { ansi:['\x1b[41m', '\x1b[49m'], html:{color:'#f00'} },
  greenbg:        { ansi:['\x1b[42m', '\x1b[49m'], html:{color:'#f00'} },
  yellowbg:       { ansi:['\x1b[43m', '\x1b[49m'], html:{color:'#f00'} },
  bluebg:         { ansi:['\x1b[44m', '\x1b[49m'], html:{color:'#f00'} },
  magentabg:      { ansi:['\x1b[45m', '\x1b[49m'], html:{color:'#f00'} },
  cyanbg:         { ansi:['\x1b[46m', '\x1b[49m'], html:{color:'#f00'} },
  whitebg:        { ansi:['\x1b[47m', '\x1b[49m'], html:{color:'#f00'} },
  dfbg: 'defaultbg',
  bkbg: 'blackbg',
  rdbg: 'redbg',
  grbg: 'greenbg',
  ylbg: 'yellowbg',
  blbg: 'bluebg',
  mgbg: 'magentabg',
  cybg: 'cyanbg',
  whbg: 'whitebg',

  brightblackbg:  { ansi:['\x1b[100m', '\x1b[49m'], html:{color:'#f00'} },
  brightredbg:    { ansi:['\x1b[101m', '\x1b[49m'], html:{color:'#f00'} },
  brightgreenbg:  { ansi:['\x1b[102m', '\x1b[49m'], html:{color:'#f00'} },
  brightyellowbg: { ansi:['\x1b[103m', '\x1b[49m'], html:{color:'#f00'} },
  brightbluebg:   { ansi:['\x1b[104m', '\x1b[49m'], html:{color:'#f00'} },
  brightmagentabg:{ ansi:['\x1b[105m', '\x1b[49m'], html:{color:'#f00'} },
  brightcyanbg:   { ansi:['\x1b[106m', '\x1b[49m'], html:{color:'#f00'} },
  brightwhitebg:  { ansi:['\x1b[107m', '\x1b[49m'], html:{color:'#f00'} },
  bbkbg: 'brightblackbg',
  brdbg: 'brightredbg',
  bgrbg: 'brightgreenbg',
  bylbg: 'brightyellowbg',
  bblbg: 'brightbluebg',
  bmgbg: 'brightmagentabg',
  bcybg: 'brightcyanbg',
  bwhbg: 'brightwhitebg',

};
/** 
 * @type {ColorSet}
 */
const colors = {}
Object.entries(colorsSpec).forEach(([name, color]) => {
  while (typeof color == 'string')
    color = colorsSpec[color]
  colors[name] = color
})


const tokenRe = /#(\w+)\[|(\x1b\[|\[|\])/g
const browser = typeof(window) !== 'undefined';

/**
 * @typedef {object} ColorizeOpts 
 * Options for {@link htmlize}
 */

/**
 * Reformats the color annotated *text* as browser console formats
 * @param {string} text Color annotated text
 * @param {ColorizeOpts} [opts] The color options
 * @returns {string} Browser console logs
 */
function colorize(text, opts) {
  if (browser)
    return htmlize(text, opts)
  else
    return ansiize(text, opts)
};
colorize.ansiize = ansiize;
colorize.htmlize = htmlize;
colorize.browserize = browserize;
colorize.tokenize = tokenize;
colorize.plain = plain;
colorize.hbar = hbar;
colorize.ansi = ansi;
colorize.strip = strip;

/**
 * Reformats the color annotated *text* as browser console formats
 * @param {string} text Color annotated text
 * @param {ColorizeOpts} [opts] The color options
 * @returns {string} Browser console logs
 */
function ansiize(text, opts) {
  if (!text || text.indexOf('[') < 0)
    return text;
  /** @type {string[]} */
  const out = []
  /** @type {TokenStack} */
  const stack = []
  let index = 0;
  for (let match; (match = tokenRe.exec(text)); ) {
// console.log("index=" + index + ", match=" + match.index + ": " + _.dump(match));
    // log('info', "match: %s", match);
    let start = match[1],
        /** @type {Color=} */
        color = colors[start],
        token = start ? '[' : match[2];
    if (index < match.index)
      out.push(text.substring(index, match.index));
    if (color) {
      stack.push(color);
      out.push(color.ansi[0]);
    } else {
//console.log("token: " + _.quote(token));
      switch (token) {
        case '[':
          stack.push(null);
          out.push(token);
          break;
        case ']':
          color = stack.pop() ?? undefined
          if (color) {
            let end = color.ansi[1];
            /* If this is a color, search for the next color to restore from the
             * stack. Colors are those whose closing ansi code is "\x1b[39m". */
            switch (end) {
              case '\x1b[39m':
                for (let i = stack.length - 1; i >= 0; i--) {
                  const c = stack[i];
                  if (c && c.ansi[1] === '\x1b[39m') {
                    end = c.ansi[0];
                    break;
                  } else {
// log('info', "i=%d, c=%s, c.ansi[1]", i, _.dump(c), c.ansi[1]);
                  }
                }
                break;
            }
            out.push(end);
          } else {
            out.push(token);
          }
          break;
        default:
          out.push(token);
      }
    }
    index = match.index + match[0].length;
  }
  if (index < text.length)
    out.push(text.substring(index));
  return out.join('');
}

/**
 * Converts a color-annotated string into an ANSI-terminal encoded string
 * @param {string} text The color annotated text
 * @returns {string}
 */
function ansi(text) {
  return tokenize(text, (token, color, stack) => {
    switch (token) {
      case '[':
        return color.ansi[0];
      case ']':
        let end = color.ansi[1];
        if (end === '\x1b[39m') {
          for (let i = stack.length - 1; i >= 0; i--) {
            const c = stack[i];
            if (c && c.ansi[1] === '\x1b[39m') {
              end = c.ansi[0];
            }
          }
        }
        return end;
      default:
        throw new Error(`IMPL`)
    }
  })
}

/**
 * Converts a color-annotated string into an ANSI-terminal encoded string
 * @param {string} text The color annotated text
 * @returns {string} The strip 
 */
function strip(text) {
  const str = tokenize(text, (token, color, stack) => '')
  return str
}





/** 
 * Strips color information from *text*
 *
 * @param  {string} text The text ({string}, optional)
 * @return {string} The plain text ({string})
 */
function plain(text) {
  if (!text || text.indexOf('[') < 0)
    return text;
  /** @type {string[]} */
  const out = []
  /** @type {TokenStack} */
  const stack = []
  let index = 0;
  for (let match; (match = tokenRe.exec(text)); ) {
// console.log("index=" + index + ", match=" + match.index + ": " + _.dump(match));
    // log('info', "match: %s", match);
    let start = match[1],
        /** @type {Color=} */
        color = colors[start],
        token = start ? '[' : match[2];
    if (index < match.index)
      out.push(text.substring(index, match.index));
    if (color) {
      stack.push(color);
      //out.push(color.ansi[0]);
    } else {
//console.log("token: " + _.quote(token));
      switch (token) {
        case '[':
          stack.push(null);
          out.push(token);
          break;
        case ']':
          color = stack.pop() ?? undefined;
          if (color) {
            let end = color.ansi[1];
            /* If this is a color, search for the next color to restore from the
             * stack. Colors are those whose closing ansi code is "\x1b[39m". */
            switch (end) {
              case '\x1b[39m':
                for (let i = stack.length - 1; i >= 0; i--) {
                  const c = stack[i];
                  if (c && c.ansi[1] === '\x1b[39m') {
                    end = c.ansi[0];
                    break;
                  } else {
// log('info', "i=%d, c=%s, c.ansi[1]", i, _.dump(c), c.ansi[1]);
                  }
                }
                break;
            }
            // out.push(end);
          } else {
            out.push(token);
          }
          break;
        default:
          out.push(token);
      }
    }
    index = match.index + match[0].length;
  }
  if (index < text.length)
    out.push(text.substring(index));
  return out.join('');
}

/**
 * Reformats the color annotated *text* as HTML
 * @param {string} text Color annotated text
 * @param {ColorizeOpts} [opts] The color options
 * @returns {string} HTML text 
 */
function htmlize(text, opts) {
  return '<span>' + tokenize(text, function(token, color, stack) {
    const css = {};
    for (let i = 0, ic = stack.length; i < ic; i++) {
      const color = stack[i];
      if (color && color.css)
        Object.assign(css, color.css)
    }
    const text = [];
    for (let k in css) {
      const v = css[k];
      text.push(k, ':', v, ';');
    }
    return '</span><span style="' + text.join('') + '">'
  }) + '</span>';
}

/**
 * @typedef {object} BrowserizeOpts 
 * Options for {@link htmlize}
 */

/**
 * Reformats the color annotated *text* as browser console formats
 * @param {string} text Color annotated text
 * @param {BrowserizeOpts} [opts] The color options
 * @returns {string[]} Browser console logs
 */
function browserize(text, opts) {
  // const parts = [null];
  // parts[0] = 
  const parts = ['']
  parts[0] = tokenize(text, function(token, color, stack) {
    const css = {};
    for (let i = 0, ic = stack.length; i < ic; i++) {
      const color = stack[i];
      if (color && color.css)
        Object.assign(css, color.css)
    }
    const text = [];
    for (let k in css) {
      const v = css[k];
      text.push(k, ':', v, ';');
    }
    parts.push(text.join(''));
    return '%c';
  })
  return parts
  // return parts;
}


/**
 * @typedef {(Color|null)[]} TokenStack
 * The token stack 
 */

/*
 * @typedef {(token: string, color: Color, stack: TokenStack) => string} Tokenizer
 */

/**
 * Tokenizes the *text* and calls the *tokenizer* for each matching color 
 * @param {string} text The color annotated text
 * @param {(token: string, color: Color, stack: TokenStack) => string} tokenizer The tokenzier to call
 * @returns {string} The resulting output string
 */
function tokenize(text, tokenizer) {
  if (!text || text.indexOf('[') < 0)
    return text;
  /** @type {string[]} */
  const out = []
  /** @type {TokenStack} */
  const stack = []
  let index = 0;
  for (let match; (match = tokenRe.exec(text)); ) {
      // console.log("index=" + index + ", match=" + match.index + ": " + _.dump(match));
    // log('info', "match: %s", match);
    let start = match[1],
        /** @type {Color=} */
        color = colors[start],
        token = start ? '[' : match[2];
    if (index < match.index)
      out.push(text.substring(index, match.index));
    if (color) {
      stack.push(color);
      out.push(tokenizer(token, color, stack) || '');
    } else {
      //console.log("token: " + _.quote(token));
      switch (token) {
        case '[':
          stack.push(null);
          out.push(token);
          break;
        case ']':
          color = stack.pop() ?? undefined
          if (color) {
            const end = tokenizer(token, color, stack);
            out.push(end);
          } else {
            out.push(token);
          }
          break;
        default:
          out.push(token);
      }
    }
    index = match.index + match[0].length;
  }
  if (index < text.length)
    out.push(text.substring(index));
  return out.join('');
}

/** 
 * Returns a horizontal bar occupying *width* characters. This uses the unicode
 * characters: \u258F - \u2588
 *
 * @param  {number} percent The percent 
 * @param  {number} width The width in characters
 * @return {string} The horizontal bar ({string}, non-null)
 */
function hbar(percent, width) {
  const text = [];
  let cur = Math.round(Math.max(0, Math.min(1, percent)) * Math.max(1, width) * 5);
  for (let i = 0; i < width; i++) {
    if (cur >= 5) {
      text.push(hbar.full), cur -= 5;
    } else {
      text.push(hbar.chars.charAt(cur)), cur = 0;
      //if (!fullwidth)
      //  break;
    }
  }
  return text.join('');

  // for (; cur >= 5; cur -= 5)
  //   text.push(hbar.full);
  // text.push(hbar.chars.charAt(cur));
  // for (var i = text.length; i < width; i++)
  //   text.push('+');
  // return text.join('');
}
hbar.full = "\u258B";
hbar.chars = " \u258F\u258E\u258D\u258C";

module.exports = colorize

// module.exports = {
//   colorize,
//   ansiize,
//   htmlize,
//   browserize,
//   plain,
//   hbar,
//   tokenize,
// }