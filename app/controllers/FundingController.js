const web3 = require('../services/web3')

module.exports = (osseus) => {
  return {
    request: async (req, res) => {
      console.log(req.params.account)
      const receipt = await web3.eth.sendTransaction({
        from: osseus.config.ethereum_from_account,
        to: req.params.account,
        value: osseus.config.ethereum_native_bonus
      })
      console.log(receipt)
      const balance = await web3.eth.getBalance(req.params.account)

      res.send(web3.utils.fromWei(balance))
    }
  }
}
