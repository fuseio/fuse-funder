const request = require('request-promise-native')
const { get } = require('lodash')

module.exports = (osseus, agenda) => {
  const getTokenBonus = async ({ tokenAddress }) => {
    const response = await request.get(`${osseus.config.fuse_studio_api_base}/communities?homeTokenAddress=${tokenAddress}`)
    const community = get(JSON.parse(response), 'data')
    return get(community, 'plugins.joinBonus.joinInfo.amount')
  }

  const fundToken = async ({ accountAddress, tokenAddress }) => {
    const fundingAccount = await osseus.db_models.account.lockAccount()
    const provider = osseus.lib.provider.create(fundingAccount.childIndex)
    const web3 = osseus.lib.web3.create(provider)
    // TODO find the funding account which holds this specific token
    const tokenBonus = await getTokenBonus({ tokenAddress })
    try {
      const amountInWei = web3.utils.toWei(tokenBonus.toString())
      const token = osseus.lib.token.create(tokenAddress, provider)
      await token.methods.transfer(accountAddress, amountInWei).send({
        from: fundingAccount.address,
        gas: osseus.config.ethereum_gas_per_transaction,
        gasPrice: osseus.config.ethereum_gas_price,
        nonce: fundingAccount.nonce
      })
      await osseus.db_models.account.unlockAccount(fundingAccount.address, fundingAccount.nonce + 1)
      await osseus.db_models.tokenFunding.finishFunding({ accountAddress, tokenAddress })
    } catch (error) {
      await osseus.db_models.account.unlockAccount(fundingAccount.address, fundingAccount.nonce)
      await osseus.db_models.tokenFunding.failFunding({ accountAddress, tokenAddress })
      throw error
    }
  }

  agenda.define('fund-token', {concurrency: osseus.config.funding_concurrency}, async (job, done) => {
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