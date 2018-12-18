const init = (osseus) => {
  this.osseus = osseus
  return new Promise((resolve, reject) => {
    this.osseus.db_models = {
      funding: require('./models/Funding')(this.osseus)
    }
    osseus.logger.info(`DB ready`)
    return resolve()
  })
}

module.exports = {
  init
}
