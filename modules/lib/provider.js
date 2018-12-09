const HDWalletProvider = require('truffle-hdwallet-provider')

module.exports = (osseus) => {
  return new HDWalletProvider(osseus.config.web3_mnemonic, osseus.config.web3_provider)
}
