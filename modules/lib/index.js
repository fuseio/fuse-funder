const init = (osseus) => {
  this.osseus = osseus
  return new Promise((resolve, reject) => {
    this.osseus.lib = this.osseus.lib || {}
    this.osseus.lib.provider = require('./provider')(this.osseus)
    this.osseus.lib.web3 = require('./web3')(this.osseus)
    this.osseus.lib.token = require('./token')(this.osseus)
    this.osseus.lib.agenda = require('./agenda')(this.osseus)
    this.osseus.logger.info(`Lib ready`)
    return resolve()
  })
}

module.exports = {
  init
}
