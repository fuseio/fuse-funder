const Web3 = require('web3')
const provider = require('./wallet')

var web3 = new Web3(provider)

module.exports = web3
