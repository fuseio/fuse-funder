const Web3 = require('web3')

module.exports = (osseus) => {
  return new Web3(osseus.lib.provider)
}
