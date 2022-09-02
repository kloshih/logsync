
const { assert } = require('chai');

const { log } = require('../lib/log.js');

describe("log", function() {

  this.timeout(60e3);

  it.skip("should do something", function() {

    class FileTransport extends log.Transport {

      attach(log2) {
        console.log("file.attach: %s", log2);
        console.log("file.config: %s", this.name);

        

      }
      detach(log2) {
        console.log("file.detach: %s", log2);
      }
      append(record) {
        console.log("file.append: %s", record);
        super.append(record);
      }
      write(record) {
        console.log("file.write: %s", record);
      }

    }
    log.use(FileTransport);

    class SuperFormat extends log.Format {
      format(record) {
        log('info', "super.format: #gr[%s", record);
        return JSON.stringify(record);
      }
    }
    log.use(SuperFormat);

    log.configure({transports:'file?format=super&file=/var/log/${prog}-${gen}.log'});
    log('info', "Test");
    log.configure({transports:'file?format=super'});

    log('info', "Test");

  });


});
