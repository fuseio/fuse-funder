const request = require('request-promise-native')
const { get } = require('lodash')

module.exports = (osseus) => {
  /**
   * @api {get} /balance/native/:accountAddress Fetch native balance
   * @apiParam {String} accountAddress Account address
   * @apiName NativeBalance
   * @apiGroup Funding
   *
   *
   * @apiSuccess {String} balance Native balance
   */
  const getNativeBalance = async ({ accountAddress }) => {
    const web3 = osseus.lib.web3.default
    const balance = web3.utils.fromWei(await web3.eth.getBalance(accountAddress))
    return {
      balance
    }
  }

  /**
   * @api {get} /balance/token/:accountAddress/:tokenAddress Fetch token balance
   * @apiParam {String} accountAddress Account address
   * @apiName TokenBalance
   * @apiGroup Funding
   *
   *
   * @apiSuccess {String} balance Token balance
   */
  const getTokenBalance = async ({ accountAddress, tokenAddress }) => {
    const web3 = osseus.lib.web3.default
    const token = osseus.lib.token.create(tokenAddress)
    const balance = web3.utils.fromWei(await token.methods.balanceOf(accountAddress).call())
    return {
      balance
    }
  }

  const getTokenBonus = async ({ tokenAddress }) => {
    const response = await request.get(`${osseus.config.fuse_studio_api_base}/communities?homeTokenAddress=${tokenAddress}`)
    const community = get(JSON.parse(response), 'data')
    return get(community, 'plugins.joinBonus.joinInfo.amount')
  }

  /**
   * @api {post} /fund/native Fund account with native
   * @apiParam {String} accountAddress Account address to fund
   * @apiParam {String} tokenAddress Token address to determine the bonus amount (optional)
   * @apiName FundNative
   * @apiGroup Funding
   *
   *
   * @apiSuccess {String} bonusSent Join bonus amount
   * @apiSuccess {String} balance Native updated balance
   */
  const fundNative = async (req, res) => {
    const { accountAddress, tokenAddress } = req.body
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

    let fundingObject = await osseus.db_models.nativeFunding.getStartedByAccount({ accountAddress })

    osseus.lib.agenda.now('fund-native', { accountAddress: accountAddress, tokenAddress:  tokenAddress})

    res.send({
      id: fundingObject.id,
      status: fundingObject.fundingStatus
    })
  }

  /**
   * @api {post} /fund/token Fund account with token
   * @apiParam {String} accountAddress Account address to fund
   * @apiParam {String} tokenAddress Token address of the funding token
   * @apiName FundToken
   * @apiGroup Funding
   *
   *
   * @apiSuccess {String} bonusSent Join bonus amount
   * @apiSuccess {String} balance Token updated balance
   */
  const fundToken = async (req, res) => {
    const { accountAddress, tokenAddress } = req.body
    const tokenBonus = await getTokenBonus(req.body)

    if (!get(tokenBonus, 'plugins.joinBonus.hasTransferToFunder')) {
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

    let fundingObject = await osseus.db_models.tokenFunding.getStartedByAccount({ accountAddress, tokenAddress })

    osseus.lib.agenda.now('fund-token', { accountAddress: accountAddress, tokenAddress: tokenAddress })

    res.send({
      id: fundingObject.id,
      status: fundingObject.fundingStatus
    })
  }

  /**
   * @api {get} /fund/status/:id Fetch native funding status
   * @apiParam {String} id Native funding id
   * @apiName FundStatusNative
   * @apiGroup Funding
   *
   *
   * @apiSuccess {String} status Native funding status
   */
  const getNativeFundingStatus = async ({ id }) => {
    const fundingObject = await osseus.db_models.nativeFunding.getById(id)
    return fundingObject ? { status: fundingObject.fundingStatus } : { status: 'NOT_FOUND' }
  }

  /**
   * @api {get} /fund/status/:id Fetch token funding status
   * @apiParam {String} id Token funding id
   * @apiName FundStatusToken
   * @apiGroup Funding
   *
   *
   * @apiSuccess {String} status Token funding status
   */
  const getTokenFundingStatus = async ({ id }) => {
    const fundingObject = await osseus.db_models.tokenFunding.getById(id)
    return fundingObject ? { status: fundingObject.fundingStatus } : { status: 'NOT_FOUND' }
  }

  return {
    fundNative: async (req, res) => {
      await fundNative(req, res)
    },
    fundToken: async (req, res) => {
      await fundToken(req, res)
    },
    balanceNative: async (req, res) => {
      res.send(await getNativeBalance(req.params))
    },
    balanceToken: async (req, res) => {
      res.send(await getTokenBalance(req.params))
    },
    fundNativeStatus: async(req, res) => {
      res.send(await getNativeFundingStatus(req.params))
    },
    fundTokenStatus: async(req, res) => {
      res.send(await getTokenFundingStatus(req.params))
    }
  }
}
