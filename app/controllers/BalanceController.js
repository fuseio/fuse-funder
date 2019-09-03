const request = require('request-promise-native')
const { get } = require('lodash')

module.exports = (osseus) => {
  const getNativeBalance = async ({ accountAddress }) => {
    const { web3 } = osseus.lib
    const balance = web3.utils.fromWei(await web3.eth.getBalance(accountAddress))
    return {
      balance
    }
  }

  const getTokenBalance = async ({ accountAddress, tokenAddress }) => {
    const { web3 } = osseus.lib
    const token = osseus.lib.token.create(tokenAddress)
    const balance = web3.utils.fromWei(await token.methods.balanceOf(accountAddress).call())
    return {
      balance
    }
  }

  const getTokenBonus = async ({ tokenAddress }) => {
    const response = await request.get(`${osseus.config.fuse_studio_api_base}/communities?homeTokenAddress=${tokenAddress}`)
    const community = get(JSON.parse(response), 'data')
    return get(community, 'plugins.joinBonus.amount')
  }

  const getNativeBonus = async ({ accountAddress, tokenAddress }) => {
    if (!tokenAddress) {
      return osseus.config.ethereum_native_user_bonus
    }
    const response = await request.get(`${osseus.config.fuse_studio_api_base}/tokens/${tokenAddress}`)
    const owner = get(JSON.parse(response), 'data.owner')
    return owner === accountAddress ? osseus.config.ethereum_native_admin_bonus : osseus.config.ethereum_native_user_bonus
  }

  const fundNative = async (req, res) => {
    const { accountAddress } = req.body
    const oldFunding = await osseus.db_models.nativeFunding.startFunding({ accountAddress })

    if (oldFunding && oldFunding.fundingStatus !== 'FAILED') {
      await osseus.db_models.nativeFunding.revertFunding(oldFunding)
      return res.status(403).send({
        error: `Account  ${accountAddress} already received funding.`
      })
    }

    const fundingsCount = await osseus.db_models.nativeFunding.fundingsPerDay(new Date())

    if (fundingsCount > osseus.config.ethereum_fundings_cap_per_day) {
      await osseus.db_models.nativeFunding.failFunding({ accountAddress })
      return res.status(403).send({
        error: `Funding of ${accountAddress} failed. Reached maximum capacity per day.`
      })
    }

    try {
      const nativeBonus = await getNativeBonus(req.body)
      await osseus.lib.web3.eth.sendTransaction({
        from: osseus.config.ethereum_admin_account,
        to: accountAddress,
        value: nativeBonus,
        gasPrice: osseus.config.ethereum_gas_price
      })

      const { balance } = await getNativeBalance({ accountAddress })
      res.send({
        bonusSent: osseus.lib.web3.utils.fromWei(nativeBonus.toString()),
        balance
      })
    } catch (error) {
      console.log(error)
      await osseus.db_models.nativeFunding.failFunding({ accountAddress })
      return res.status(403).send({
        error: `Funding of ${accountAddress} failed.`
      })
    }

    await osseus.db_models.nativeFunding.finishFunding({ accountAddress })
  }

  const fundToken = async (req, res) => {
    const { accountAddress, tokenAddress } = req.body
    const tokenBonus = await getTokenBonus(req.body)

    if (!tokenBonus) {
      return res.status(403).send({
        error: `No join bonus defined for token ${tokenAddress}.`
      })
    }

    const oldFunding = await osseus.db_models.tokenFunding.startFunding({ accountAddress, tokenAddress })

    if (oldFunding && oldFunding.fundingStatus !== 'FAILED') {
      await osseus.db_models.tokenFunding.revertFunding(oldFunding)
      return res.status(403).send({
        error: `Account  ${accountAddress} already received funding.`
      })
    }

    const fundingsCount = await osseus.db_models.tokenFunding.fundingsPerDay(new Date())

    if (fundingsCount > osseus.config.ethereum_fundings_cap_per_day) {
      await osseus.db_models.tokenFunding.failFunding({ accountAddress, tokenAddress })
      return res.status(403).send({
        error: `Funding of ${accountAddress} failed. Reached maximum capacity per day.`
      })
    }

    try {
      const amountInWei = osseus.lib.web3.utils.toWei(tokenBonus.toString())
      const token = osseus.lib.token.create(tokenAddress)
      await token.methods.transfer(accountAddress, amountInWei).send({
        from: osseus.config.ethereum_admin_account,
        gas: osseus.config.ethereum_gas_per_transaction,
        gasPrice: osseus.config.ethereum_gas_price
      })
      const { balance } = await getTokenBalance({ accountAddress, tokenAddress })
      res.send({
        bonusSent: tokenBonus ? tokenBonus.toString() : '0',
        balance
      })
    } catch (error) {
      console.log(error)
      await osseus.db_models.tokenFunding.failFunding({ accountAddress, tokenAddress })
      return res.status(403).send({
        error: `Funding of ${accountAddress} failed.`
      })
    }

    await osseus.db_models.tokenFunding.finishFunding({ accountAddress, tokenAddress })
  }

  return {
    fundNative: async (req, res) => {
      await fundNative(req, res)
    },
    fundToken: async (req, res) => {
      await fundToken(req, res)
    },
    balanceNative: async (req, res) => {
      console.log(req.params)
      res.send(await getNativeBalance(req.params))
    },
    balanceToken: async (req, res) => {
      res.send(await getTokenBalance(req.params))
    }
  }
}
