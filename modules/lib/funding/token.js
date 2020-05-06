const request = require('request-promise-native')
const { get } = require('lodash')
const { getBaseUrl } = require('../utils')
const BigNumber = require('bignumber.js')

module.exports = (osseus, agenda) => {
  const getTokenBonusAmount = async ({ tokenAddress, originNetwork, bonusType }) => {
    const baseURL = getBaseUrl(osseus, originNetwork)
    const response = await request.get(`${baseURL}/communities?homeTokenAddress=${tokenAddress}`)
    const community = get(JSON.parse(response), 'data')
    const bonusAmount = get(community, `${bonusType}.amount`)
    const tokenDecimals = await getTokenDecimals({ tokenAddress, originNetwork })
    const tokenBonusAmount = new BigNumber(bonusAmount).mul(10 ** tokenDecimals)
    return tokenBonusAmount
  }

  const getTokenDecimals = async ({ tokenAddress, originNetwork }) => {
    const baseURL = getBaseUrl(osseus, originNetwork)
    const response = await request.get(`${baseURL}/tokens/${tokenAddress}`)
    const token = get(JSON.parse(response), 'data')
    return get(token, 'decimals')
  }

  const getNonce = async (web3, address) => {
    const transactionCount = await web3.eth.getTransactionCount(address)
    return transactionCount
  }

  const fundToken = async ({ phoneNumber, identifier, accountAddress, tokenAddress, originNetwork, bonusType }) => {
    try {
      const web3 = osseus.lib.web3.default
      const fundingAccountAddress = osseus.config.ethereum_admin_account
      const fundingAccountNonce = await getNonce(web3, fundingAccountAddress)
      const tokenBonusAmount = await getTokenBonusAmount({ tokenAddress, originNetwork, bonusType })
      const token = osseus.lib.token.create(tokenAddress)
      let tx = await token.methods.transfer(accountAddress, tokenBonusAmount).send({
        from: fundingAccountAddress,
        gas: osseus.config.ethereum_gas_per_transaction,
        gasPrice: osseus.config.ethereum_gas_price,
        nonce: fundingAccountNonce
      })
      await osseus.db_models.tokenFunding.finishFunding({ phoneNumber, identifier, accountAddress, tokenAddress })
      return tx
    } catch (error) {
      await osseus.db_models.tokenFunding.failFunding({ phoneNumber, identifier, accountAddress, tokenAddress })
      throw error
    }
  }

  agenda.define('fund-token', { concurrency: 1 }, async (job, done) => {
    if (!job || !job.attrs || !job.attrs.data) {
      return done(new Error(`Job data undefined`))
    }
    let { phoneNumber, accountAddress, identifier, tokenAddress, originNetwork, bonusType } = job.attrs.data
    if (!phoneNumber) {
      return done(new Error(`Job data is missing "phoneNumber"`))
    }
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
      let tx = await fundToken({ phoneNumber, identifier, accountAddress, tokenAddress, originNetwork, bonusType })
      job.attrs.data.txHash = tx.transactionHash
      job.attrs.data.status = 'SUCCEEDED'
      done(null, tx)
    } catch (err) {
      job.attrs.data.status = 'FAILED'
      done(err)
    }
  })

  const bonusToken = async ({ phoneNumber, identifier, accountAddress, tokenAddress, originNetwork, bonusType, bonusId }) => {
    try {
      const web3 = osseus.lib.web3.default
      const fundingAccountAddress = osseus.config.ethereum_admin_account
      const fundingAccountNonce = await getNonce(web3, fundingAccountAddress)
      const tokenBonusAmount = await getTokenBonusAmount({ tokenAddress, originNetwork, bonusType })
      const token = osseus.lib.token.create(tokenAddress)
      let tx = await token.methods.transfer(accountAddress, tokenBonusAmount).send({
        from: fundingAccountAddress,
        gas: osseus.config.ethereum_gas_per_transaction,
        gasPrice: osseus.config.ethereum_gas_price,
        nonce: fundingAccountNonce
      })
      await osseus.db_models.tokenBonus.finishBonus({ phoneNumber, identifier, accountAddress, tokenAddress, bonusType, bonusId })
      return tx
    } catch (error) {
      await osseus.db_models.tokenBonus.failBonus({ phoneNumber, identifier, accountAddress, tokenAddress, bonusType, bonusId })
      throw error
    }
  }

  agenda.define('bonus-token', { concurrency: 1 }, async (job, done) => {
    if (!job || !job.attrs || !job.attrs.data) {
      return done(new Error(`Job data undefined`))
    }
    let { phoneNumber, accountAddress, identifier, tokenAddress, originNetwork, bonusType, bonusId } = job.attrs.data
    if (!phoneNumber) {
      return done(new Error(`Job data is missing "phoneNumber"`))
    }
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
      let tx = await bonusToken({ phoneNumber, identifier, accountAddress, tokenAddress, originNetwork, bonusType, bonusId })
      job.attrs.data.txHash = tx.transactionHash
      job.attrs.data.status = 'SUCCEEDED'
      done(null, tx)
    } catch (err) {
      job.attrs.data.status = 'FAILED'
      done(err)
    }
  })
}
