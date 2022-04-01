
const log = require('../lib/log')

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

      res = benchmark(10000, (i, ic) => {
        err = { i, ic }
      })
      log('info', "#wh[res #byl[%s]]", res);

      res = benchmark(1000, (i, ic) => {
        log('info', 'test')
      })
      log('info', "#wh[res #byl[%s]]", res);
     
      res = benchmark(100, (i, ic) => {
        log('info', 'test')
      })
      log('info', "#wh[res #byl[%s]]", res);
     
    })

  })

  function benchmark(count, fn) {
    let time = process.hrtime.bigint();
    for (let i = 0; i < count; i++) {
      fn(i, count);
    }
    time = Number(process.hrtime.bigint() - time)/1e6;
    const itms = time > 0 ? count / time : 0;
    const msit = count > 0 ? time / count : 0;
    return { 
      count, time, itms, msit, 
      toString: () => `count:${count}, time:${time}ms, ${itms}it/ms, ${msit}ms/it`,
    };
  }

})