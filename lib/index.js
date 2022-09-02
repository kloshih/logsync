
/**
 * 
 */

const { log, dump } = require('./log.js')
const colorize = require('./colorize.js')

log.colorize = colorize

module.exports = {
  log,
  dump,
  default: log,
}