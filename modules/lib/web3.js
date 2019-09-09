const Web3 = require('web3')

module.exports = (osseus) => {
  const create = (provider) => new Web3(provider)

  return {
    create: create,
    default: new Web3(osseus.lib.provider.default)
  }
}
