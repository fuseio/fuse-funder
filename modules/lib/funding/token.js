const request = require('request-promise-native')
const { get } = require('lodash')

module.exports = (osseus, agenda) => {
  const getTokenBonus = async ({ tokenAddress, originNetwork, bonusType }) => {
    const urlComponents = osseus.config.fuse_studio_api_base.split('.')
    if (originNetwork == 'ropsten') {
      urlComponents[0] = `${urlComponents[0]}-ropsten`
    }
    const baseURL = urlComponents.join('.')
    const response = await request.get(`${baseURL}/communities?homeTokenAddress=${tokenAddress}`)
    const community = get(JSON.parse(response), 'data')
    return get(community, `${bonusType}.amount`)
  }

  const getNonce = async (web3, address) => {
    const transactionCount = await web3.eth.getTransactionCount(address)
    return transactionCount
  }

  const fundToken = async ({ accountAddress, tokenAddress, originNetwork, bonusType }) => {
    try {
      const web3 = osseus.lib.web3.default
      const fundingAccountAddress = osseus.config.ethereum_admin_account
      const fundingAccountNonce = await getNonce(web3, fundingAccountAddress)
      const tokenBonus = await getTokenBonus({ tokenAddress, originNetwork, bonusType })
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

  agenda.define('fund-token', {concurrency: 1}, async (job, done) => {
    if (!job || !job.attrs || !job.attrs.data) {
      return done(new Error(`Job data undefined`))
    }
    let { accountAddress, tokenAddress, originNetwork, bonusType } = job.attrs.data
    if (!accountAddress) {
      return done(new Error(`Job data is missing "accountAddress"`))
    }
    if (!tokenAddress) {
      return done(new Error(`Job data is missing "tokenAddress"`))
    }
    if (!originNetwork) {
      return done(new Error(`Job data is missing "originNetwork"`))
    }
    if (!bonusType) {
      return done(new Error(`Job data is missing "bonusType"`))
    }

    try {
      let tx = await fundToken({ accountAddress, tokenAddress, originNetwork, bonusType })
      done(null, tx)
    } catch (err) {
      done(err)
    }
  })

  const bonusToken = async ({ accountAddress, tokenAddress, originNetwork, bonusType, bonusId }) => {
    try {
      const web3 = osseus.lib.web3.default
      const fundingAccountAddress = osseus.config.ethereum_admin_account
      const fundingAccountNonce = await getNonce(web3, fundingAccountAddress)
      const tokenBonus = await getTokenBonus({ tokenAddress, originNetwork, bonusType })
      const tokenBonusAmountInWei = web3.utils.toWei(tokenBonus.toString())
      const token = osseus.lib.token.create(tokenAddress)
      let tx = await token.methods.transfer(accountAddress, tokenBonusAmountInWei).send({
        from: fundingAccountAddress,
        gas: osseus.config.ethereum_gas_per_transaction,
        gasPrice: osseus.config.ethereum_gas_price,
        nonce: fundingAccountNonce
      })
      await osseus.db_models.tokenBonus.finishBonus({ accountAddress, tokenAddress, bonusId })
      return tx
    } catch (error) {
      await osseus.db_models.tokenBonus.failBonus({ accountAddress, tokenAddress, bonusId })
      throw error
    }
  }

  agenda.define('bonus-token', {concurrency: 1}, async (job, done) => {
    if (!job || !job.attrs || !job.attrs.data) {
      return done(new Error(`Job data undefined`))
    }
    let { accountAddress, tokenAddress, originNetwork, bonusType, bonusId } = job.attrs.data
    if (!accountAddress) {
      return done(new Error(`Job data is missing "accountAddress"`))
    }
    if (!tokenAddress) {
      return done(new Error(`Job data is missing "tokenAddress"`))
    }
    if (!originNetwork) {
      return done(new Error(`Job data is missing "originNetwork"`))
    }
    if (!bonusType) {
      return done(new Error(`Job data is missing "bonusType"`))
    }
    if (!bonusId) {
      return done(new Error(`Job data is missing "bonusId"`))
    }

    try {
      let tx = await bonusToken({ accountAddress, tokenAddress, originNetwork, bonusType, bonusId })

      job.attrs.data.txHash = tx
      job.attrs.data.status = 'SUCCEEDED'
      job.save()

      done(null, tx)
    } catch (err) {
      job.attrs.data.status = 'FAILED'
      job.save()

      done(err)
    }
  })
}