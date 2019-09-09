const request = require('request-promise-native')
const { get } = require('lodash')

module.exports = (osseus, agenda) => {
  const getTokenBonus = async ({ tokenAddress }) => {
    const response = await request.get(`${osseus.config.fuse_studio_api_base}/communities?homeTokenAddress=${tokenAddress}`)
    const community = get(JSON.parse(response), 'data')
    return get(community, 'plugins.joinBonus.joinInfo.amount')
  }

  const getNonce = async (web3, address) => {
    const transactionCount = await web3.eth.getTransactionCount(address)
    return transactionCount
  }

  const fundToken = async ({ accountAddress, tokenAddress }) => {
    try {
      const web3 = osseus.lib.web3.default
      const fundingAccountAddress = osseus.config.ethereum_admin_account
      const fundingAccountNonce = await getNonce(web3, fundingAccountAddress)
      const tokenBonus = await getTokenBonus({ tokenAddress })
      const tokenBonusAmountInWei = web3.utils.toWei(tokenBonus.toString())
      const token = osseus.lib.token.create(tokenAddress)
      let tx = await token.methods.transfer(accountAddress, tokenBonusAmountInWei).send({
        from: fundingAccountAddress,
        gas: osseus.config.ethereum_gas_per_transaction,
        gasPrice: osseus.config.ethereum_gas_price,
        nonce: fundingAccountNonce
      })
      await osseus.db_models.tokenFunding.finishFunding({ accountAddress, tokenAddress })
      return tx
    } catch (error) {
      await osseus.db_models.tokenFunding.failFunding({ accountAddress, tokenAddress })
      throw error
    }
  }

  agenda.define('fund-token', { concurrency: 1 }, async (job, done) => {
    if (!job || !job.attrs || !job.attrs.data) {
      return done(new Error(`Job data undefined`))
    }
    let { accountAddress, tokenAddress } = job.attrs.data
    if (!accountAddress) {
      return done(new Error(`Job data is missing "accountAddress"`))
    }
    if (!tokenAddress) {
      return done(new Error(`Job data is missing "tokenAddress"`))
    }

    try {
      let tx = await fundToken({ accountAddress, tokenAddress })
      done(null, tx)
    } catch (err) {
      done(err)
    }
  })
}