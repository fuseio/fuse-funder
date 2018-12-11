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
      const { account } = req.params
      let user
      console.log(osseus.db_models)
      if (osseus.config.ethereum_one_time_funding) {
        try {
          user = await osseus.db_models.user.getByAccount(account)
        } catch (e) {
          console.log(e)
        }
        console.log('hi2')

        if (user && user.funded) {
          return res.status(403).send({
            error: `Account  ${account} already received funding`
          })
        }
      }
      await osseus.lib.web3.eth.sendTransaction({
        from: osseus.config.ethereum_admin_account,
        to: account,
        value: osseus.config.ethereum_native_bonus
      })

      await osseus.lib.token.methods.mint(account, osseus.config.ethereum_token_bonus.toString()).send({
        from: osseus.config.ethereum_admin_account,
        gas: osseus.config.ethereum_gas_per_transaction
      })

      if (user) {
        user.funded = true
        user.save()
      }
      res.send(await balance(req.params))
    },
    balance: async (req, res) => {
      res.send(await balance(req.params))
    }
  }
}
