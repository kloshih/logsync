
const { log } = require('../lib/log.js')

describe("Error Performance", () => {

  describe("Basic functionality", () => {

    it("can do something", () => {
      let count = 10000;
      let res;
      let err;

      res = benchmark(10000, (i, ic) => {
        try {
          err = new Error();
          err.stack;
        } catch (e) {
        }
      })
      log('info', "#wh[res #byl[%s]]", res);
      
      res = benchmark(10000, (i, ic) => {
        err = new Error();
        err.stack;
      })
      log('info', "#wh[res #byl[%s]]", res);

      // res = benchmark(10000, (i, ic) => {
      //   err = { i, ic }
      // })
      // log('info', "#wh[res #byl[%s]]", res);

      // res = benchmark(1000, (i, ic) => {
      //   log('info', 'test')
      // })
      // log('info', "#wh[res #byl[%s]]", res);
      // // {count:1000, time:299.732083, itms:3.3363128497659025, msit:0.299732083}
     
      // res = benchmark(100, (i, ic) => {
      //   log('info', 'test')
      // })
      // log('info', "#wh[res #byl[%s]]", res);
      // // {count:100, time:44.575834, itms:2.24336800967089, msit:0.44575834000000003}
     
    })

  })

  /**
   * @typedef {object} BenchmarkResult 
   * A benchmark result
   * @prop {number} count The number of iterations performed
   * @prop {number} time The total time in milliseconds
   * @prop {number} itms Iterations per millisecond
   * @prop {number} msit Milliseconds per iteration
   * @prop {() => string} toString A summary reporter
   */

  /**
   * Calculates a benchmark 
   * @param {number} count The number of iterations
   * @param {(...args:any[]) => any} fn An iterator function
   * @returns {BenchmarkResult} The benchmark result
   */
  function benchmark(count, fn) {
    let start = process.hrtime.bigint();
    for (let i = 0; i < count; i++) {
      fn(i, count);
    }
    let time = Number(process.hrtime.bigint() - start)/1e6;
    const itms = time > 0 ? count / time : 0;
    const msit = count > 0 ? time / count : 0;
    return { 
      count, time, itms, msit, 
      toString: () => `count:${count}, time:${time}ms, ${itms}it/ms, ${msit}ms/it`,
    };
  }

})