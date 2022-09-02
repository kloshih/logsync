/*
 * test/colorize-test.js
 *
 * @see   http://visionmedia.github.com/mocha/
 * @see   http://nodejs.org/docs/v0.4.8/api/assert.html
 */

let assert = require('assert');

/** @type {import('../lib/colorize.js')} */
let colorize = require('../lib/colorize.js');
let { log } = require('../lib/log.js');

describe("colorize", () => {

  describe("hbars", () => {

    it("Drawing bars", () => {
      let count = 50, inc = 1.5;
      for (let i = 0; i < count; i += inc) {
        console.log(colorize.ansiize(log.sprintf('#gr[%s] %s', colorize.hbar(i / count, 10), i)));
      }
    });

  });

  describe("colorize", () => {
    it("doesn't touch normal text", () => {
      assert.equal(colorize("test"), "test");
    });

    it("can process plain", () => {
      assert.equal(colorize.strip("test #gr[green] text"), "test green text");
    })

    it("colorizes green", () => {
      assert.equal(colorize("test #gr[green] text"), "test \x1b[32mgreen\x1b[39m text");
    });
    it("colorizes green + yellow", () => {
      let colorized = colorize("test #gr[green #yl[yellow] then green] text");
      log('info', "Colorized: %s", colorized);
      assert.equal(colorized, "test \x1b[32mgreen \x1b[33myellow\x1b[32m then green\x1b[39m text");
    });
    it("colorizes rainbow", () => {
      let colorized = colorize("#rd[r#yl[a#gr[i#cy[n#bl[b#mg[o#wh[w#bk[!]w]o]b]n]i]a]r]");
      log('info', "Colorized: %s", colorized);
    });
    it("color test", () => {
      console.log(colorize(
        "df\n" +
        "#bk[bk] #bbk[bbk]\n" +
        "#rd[rd] #brd[brd]\n" +
        "#gr[gr] #bgr[bgr]\n" +
        "#yl[yl] #byl[byl]\n" +
        "#bl[bl] #bbl[bbl]\n" +
        "#mg[mg] #bmg[bmg]\n" +
        "#cy[cy] #bcy[bcy]\n" +
        "#wh[wh] #bwh[bwh]"
      ));
    });
  });

  describe("Plain text", () => {
    it("works with plain()", () => {
      assert.equal(colorize.plain("#gr[Test #yl[yellow #df[brackets: ]]#gr[[]]]"), "Test yellow brackets: []");
    });
  });

  describe("Can tokenize", () => {

    it("should be able to tokenize", () => {
      let result = colorize.tokenize("This is #gr[green]!", (token, color, stack) => {
        // console.log("token: token=" + token + ", color=" + log.dump(color) + ", stack=" + log.dump(stack));
        return ''
      })
      console.log("result: " + result);

      result = colorize.tokenize("#wh[This is #gr[green]!]", (token, color, stack) => {
        switch (token) {
          case '[':
            return color.ansi[0];
          case ']':
            let end = color.ansi[1];
            if (end === '\x1b[39m') {
              for (let i = stack.length - 1; i >= 0; i--) {
                let c = stack[i];
                if (c && c.ansi[1] === '\x1b[39m') {
                  end = c.ansi[0];
                }
              }
            }
            return end;
        }
        return color.ansi[0];
        return "+";
      })
      console.log("result: " + result);
    });

    it("should be able to browserize", () => {
      let result = colorize.browserize("This is #red[red]!");
      assert.deepEqual(result, ['This is %cred%c!', 'color:#990000;', ''])
      // console.log("result: ", result);
    });

    it("should be able to htmlize", () => {
      let result = colorize.htmlize("This is #red[red]!");
      assert.equal(result, '<span>This is </span><span style="color:#990000;">red</span><span style="">!</span>')
      // console.log("result: ", result);
    });

  });

});
