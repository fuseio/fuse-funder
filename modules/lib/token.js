const path = require('path')

module.exports = (osseus) => {
  const abi = require(path.join('../../', osseus.config.web3_token_abi_path))
  return {
    create: (tokenAddress) => {
      const { web3 } = osseus.lib
      const token = new web3.eth.Contract(abi, tokenAddress)
      return token
    }
  }
}
