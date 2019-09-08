
const init = (osseus) => {
  osseus.lib = osseus.lib || {}
  osseus.lib.provider = require('./provider')(osseus)
  osseus.lib.web3 = require('./web3')(osseus)
  osseus.lib.token = require('./token')(osseus)
  osseus.lib.account = require('./account')(osseus)
}

module.exports = {
  init
}
