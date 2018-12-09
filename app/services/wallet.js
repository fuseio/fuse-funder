const HDWalletProvider = require('truffle-hdwallet-provider')

var mnemonic = 'course trouble uncle exact adapt diet rural sand sheriff refuse doctor trial'

var provider = new HDWalletProvider(mnemonic, 'http://localhost:8545')

module.exports = provider
