module.exports = (osseus) => {
  return {
    request: async (req, res) => {
      const { web3, token } = osseus.lib
      const { account } = req.params
      await web3.eth.sendTransaction({
        from: osseus.config.ethereum_from_account,
        to: account,
        value: osseus.config.ethereum_native_bonus
      })
      const balance = await web3.eth.getBalance(account)
      const fcfBalance = await token.methods.balanceOf(account).call()
      res.send({
        native: web3.utils.fromWei(balance),
        fcf: fcfBalance
      })
    },
    balance: async (req, res) => {
      const { web3, token } = osseus.lib
      const { account } = req.params

      const native = web3.utils.fromWei(await web3.eth.getBalance(account))
      const fcf = web3.utils.fromWei(await token.methods.balanceOf(account).call())
      res.send({
        native,
        fcf
      })
    }
  }
}
