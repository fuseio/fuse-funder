const HDWalletProvider = require('truffle-hdwallet-provider')

module.exports = (osseus) => {
  const mnemonic = osseus.config.ethereum_hd_wallet_mnemonic
  const create = (childIndex) => new HDWalletProvider(mnemonic, osseus.config.ethereum_web3_provider, childIndex)
  // return new HDWalletProvider(mnemonic, osseus.config.ethereum_web3_provider, osseus.config.ethereum_hd_wallet_index)

  return {
    create: create,
    default: create(osseus.config.ethereum_hd_wallet_index)
  }
}
