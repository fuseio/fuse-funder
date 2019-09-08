const path = require('path')

module.exports = (osseus) => {
  const abi = require(path.join('../../', osseus.config.web3_token_abi_path))
  return {
    create: (tokenAddress, childIndex) => {
      const { create } = osseus.lib.web3
      const web3 = create(childIndex)
      const token = new web3.eth.Contract(abi, tokenAddress)
      return token
    }
  }
}
