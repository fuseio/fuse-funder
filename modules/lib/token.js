const path = require('path')

module.exports = (osseus) => {
  const abi = require(path.join('../../', osseus.config.web3_token_abi_path))
  return {
    create: (tokenAddress, provider) => {
      const web3 = provider ? osseus.lib.web3.create(provider) : osseus.lib.web3.default
      const token = new web3.eth.Contract(abi, tokenAddress)
      return token
    }
  }
}
