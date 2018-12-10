module.exports = (osseus) => {
  const balance = async ({ account }) => {
    const { web3, token } = osseus.lib
    const native = web3.utils.fromWei(await web3.eth.getBalance(account))
    const cryptoFiat = web3.utils.fromWei(await token.methods.balanceOf(account).call())
    return {
      native,
      cryptoFiat
    }
  }
  return {
    request: async (req, res) => {
      await osseus.lib.web3.eth.sendTransaction({
        from: osseus.config.ethereum_from_account,
        to: req.params.account,
        value: osseus.config.ethereum_native_bonus
      })
      res.send(await balance(req.params))
    },
    balance: async (req, res) => {
      res.send(await balance(req.params))
    }
  }
}
