// function timeout(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

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

  const fund = async ({ account }) => {
    await osseus.lib.web3.eth.sendTransaction({
      from: osseus.config.ethereum_admin_account,
      to: account,
      value: osseus.config.ethereum_native_bonus
    })

    await osseus.lib.token.methods.mint(account, osseus.config.ethereum_token_bonus.toString()).send({
      from: osseus.config.ethereum_admin_account,
      gas: osseus.config.ethereum_gas_per_transaction
    })
  }

  return {
    request: async (req, res) => {
      const { account } = req.params
      const oldFunding = await osseus.db_models.funding.startFunding(account)

      if (oldFunding && oldFunding.fundingStatus !== 'FAILED') {
        await osseus.db_models.funding.failFunding(account)
        return res.status(403).send({
          error: `Account  ${account} already received funding.`
        })
      }

      const fundingsCount = await osseus.db_models.funding.fundingsPerDay(new Date())
      console.log('check: ' + fundingsCount)

      if (fundingsCount > osseus.config.ethereum_fundings_cap_per_day) {
        await osseus.db_models.funding.failFunding(account)
        return res.status(403).send({
          error: `Funding of ${account} failed. Reached maximum capacity per day.`
        })
      }

      try {
        await fund(req.params)
      } catch (error) {
        await osseus.db_models.funding.failFunding(account)
        return res.status(403).send({
          error: `Funding of ${account} failed.`
        })
      }

      await osseus.db_models.funding.finishFunding(account)
      res.send(await balance(req.params))
    },
    balance: async (req, res) => {
      res.send(await balance(req.params))
    }
  }
}
