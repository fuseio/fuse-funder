const request = require('request-promise-native')
const { get } = require('lodash')

module.exports = (osseus) => {
  const getNativeBonus = async ({ accountAddress, tokenAddress }) => {
    if (!tokenAddress) {
      return osseus.config.ethereum_native_user_bonus
    }
    const response = await request.get(`${osseus.config.fuse_studio_api_base}/tokens/${tokenAddress}`)
    const owner = get(JSON.parse(response), 'data.owner')
    return owner === accountAddress ? osseus.config.ethereum_native_admin_bonus : osseus.config.ethereum_native_user_bonus
  }

  const fundNative = async ({ accountAddress, tokenAddress }) => {
    const fundingAccount = await osseus.models.account.lockAccount()
    const web3 = osseus.lib.web3.create(fundingAccount.childIndex)

    const nativeBonus = await getNativeBonus({ accountAddress, tokenAddress })
    try {
      await web3.eth.sendTransaction({
        from: fundingAccount.address,
        to: accountAddress,
        value: nativeBonus,
        gasPrice: osseus.config.ethereum_gas_price,
        nonce: fundingAccount.nonce
      })
      osseus.models.account.unlockAccount(fundingAccount.address, fundingAccount.nonce + 1)
    } catch (error) {
      osseus.models.account.unlockAccount(fundingAccount.address)
    }
  }

  return {
    getNativeBonus,
    fundNative
  }
}
