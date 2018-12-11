const HDWalletProvider = require('truffle-hdwallet-provider')

module.exports = (osseus) => {
  const mnemonic = osseus.config.ethereum_hd_wallet_mnemonic || process.env.ETHEREUM_HD_WALLET_MNEMONIC
  return new HDWalletProvider(mnemonic, osseus.config.ethereum_web3_provider, osseus.config.ethereum_hd_wallet_index)
}
