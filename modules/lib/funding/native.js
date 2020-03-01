const request = require('request-promise-native')
const { get } = require('lodash')
const { getBaseUrl } = require('../utils')

module.exports = (osseus, agenda) => {
  const getNativeBonus = async ({ accountAddress, tokenAddress, networkType = 'ropsten' }) => {
    if (!tokenAddress) {
      return osseus.config.ethereum_native_user_bonus
    }

    const baseUrl = getBaseUrl(osseus, networkType)
    const response = await request.get(`${baseUrl}/tokens/${tokenAddress}`)
    const owner = get(JSON.parse(response), 'data.owner')
    const isAdmin = owner === accountAddress
    if (isAdmin) {
      if (networkType === 'ropsten') {
        return osseus.config.ethereum_native_admin_bonus_ropsten
      } else {
        return osseus.config.ethereum_native_admin_bonus_mainnet
      }
    } else {
      return osseus.config.ethereum_native_user_bonus
    }
  }

  const fundNative = async ({ accountAddress, tokenAddress, networkType }) => {
    const fundingAccount = await osseus.db_models.account.lockAccount()
    const provider = osseus.lib.provider.create(fundingAccount.childIndex)
    const web3 = osseus.lib.web3.create(provider)
    const nativeBonus = await getNativeBonus({ accountAddress, tokenAddress, networkType })
    try {
      let tx = await web3.eth.sendTransaction({
        from: fundingAccount.address,
        to: accountAddress,
        value: nativeBonus,
        gasPrice: osseus.config.ethereum_gas_price,
        nonce: fundingAccount.nonce
      })
      await osseus.db_models.account.unlockAccount(fundingAccount.address, fundingAccount.nonce + 1)
      await osseus.db_models.nativeFunding.finishFunding({ accountAddress })
      return tx
    } catch (error) {
      await osseus.db_models.account.unlockAccount(fundingAccount.address, fundingAccount.nonce)
      await osseus.db_models.nativeFunding.failFunding({ accountAddress })
      throw error
    }
  }

  agenda.define('fund-native', { concurrency: osseus.config.funding_concurrency }, async (job, done) => {
    if (!job || !job.attrs || !job.attrs.data) {
      return done(new Error(`Job data undefined`))
    }
    let { accountAddress, tokenAddress, networkType } = job.attrs.data
    if (!accountAddress) {
      return done(new Error(`Job data is missing "accountAddress"`))
    }

    try {
      let tx = await fundNative({ accountAddress, tokenAddress, networkType })
      done(null, tx)
    } catch (err) {
      done(err)
    }
  })
}
