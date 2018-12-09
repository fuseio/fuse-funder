
module.exports = (osseus) => {
  const { web3 } = osseus.lib
  // console.log(osseus.config.web3_token_abi_path)
  const abi = require(osseus.config.web3_token_abi_path).abi
  const token = new web3.eth.Contract(abi, osseus.config.ethereum_token_address)
  return token
}
