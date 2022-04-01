

const assert = require('assert');

const log2 = require('../lib/log.js');

describe("log", function() {
  this.timeout(60e3);

  it.skip("should do something", function() {

    class FileTransport extends log2.Transport {

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
    log2.use(FileTransport);

    class SuperFormat extends log2.Format {
      format(record) {
        log2('info', "super.format: #gr[%s", record);
        return JSON.stringify(record);
      }
    }
    log2.use(SuperFormat);

    log2.configure({transports:'file?format=super&file=/var/log/${prog}-${gen}.log'});
    log2('info', "Test");
    log2.configure({transports:'file?format=super'});

    log2('info', "Test");

  });


});
