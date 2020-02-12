const init = (osseus) => {
  this.osseus = osseus
  return new Promise((resolve, reject) => {
    this.osseus.db_models = {
      nativeFunding: require('./models/NativeFunding')(this.osseus),
      tokenFunding: require('./models/TokenFunding')(this.osseus),
      tokenBonus: require('./models/TokenBonus')(this.osseus),
      account: require('./models/Account')(this.osseus)
    }
    this.osseus.logger.info(`DB ready`)
    return resolve()
  })
}

module.exports = {
  init
}
