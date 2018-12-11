const path = require('path')

module.exports = (osseus) => {
  const { web3 } = osseus.lib
  const abi = require(path.join('../../', osseus.config.web3_token_abi_path)).abi
  const token = new web3.eth.Contract(abi, osseus.config.ethereum_token_address)
  return token
}
