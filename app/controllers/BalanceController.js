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

  const getCommunity = async ({ tokenAddress, originNetwork }) => {
    const urlComponents = osseus.config.fuse_studio_api_base.split('.')
    if (originNetwork === 'ropsten') {
      urlComponents[0] = `${urlComponents[0]}-ropsten`
    }
    const baseURL = urlComponents.join('.')
    const response = await request.get(`${baseURL}/communities?homeTokenAddress=${tokenAddress}`)
    const community = get(JSON.parse(response), 'data')
    return community
  }

  /**
   * @api {post} /fund/native Fund account with native
   * @apiParam {String} accountAddress Account address to fund
   * @apiParam {String} tokenAddress Token address to determine the bonus amount (optional)
   * @apiName FundNative
   * @apiGroup Funding
   *
   *
   * @apiSuccess {String} id Task id of the funding job
   * @apiSuccess {String} status Current status of the job. Should be "STARTED" if all good.
   */
  const fundNative = async (req, res) => {
    const { accountAddress, tokenAddress, networkType } = req.body
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

    osseus.lib.agenda.now('fund-native', { accountAddress, tokenAddress, networkType })

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
   * @apiSuccess {String} id Task id of the funding job
   * @apiSuccess {String} status Current status of the job. Should be "STARTED" if all good.
   */
  const fundToken = async (req, res) => {
    const { accountAddress, tokenAddress, originNetwork } = req.body
    const bonusType = 'plugins.joinBonus.joinInfo'
    const community = await getCommunity({ tokenAddress, originNetwork })
    const tokenBonus = get(community, `${bonusType}.amount`)

    if (!tokenBonus) {
      return res.status(403).send({
        error: `No join bonus defined for token ${tokenAddress}.`
      })
    }

    const oldFunding = await osseus.db_models.tokenFunding.startFunding({ accountAddress, tokenAddress })

    if (oldFunding && oldFunding.fundingStatus !== 'FAILED') {
      await osseus.db_models.tokenFunding.revertFunding(oldFunding)
      return res.status(403).send({
        error: `Account ${accountAddress} already received funding.`
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

    osseus.lib.agenda.now('fund-token', { accountAddress: accountAddress, tokenAddress:  tokenAddress, originNetwork, bonusType })

    res.send({
      id: fundingObject.id,
      status: fundingObject.fundingStatus
    })
  }

  /**
   * @api {post} /bonus/token Bonus account with token
   * @apiParam {String} accountAddress Account address to give bonus
   * @apiParam {String} tokenAddress Token address of the token to give as bonus
   * @apiParam {Object} bonusInfo The reason for the bonus
   * @apiName BonusToken
   * @apiGroup Bonus
   *
   *
   * @apiSuccess {String} id Task id of the bonus job
   * @apiSuccess {String} status Current status of the job. Should be "STARTED" if all good.
   */
  const bonusToken = async (req, res) => {
    const { accountAddress, tokenAddress, bonusInfo, originNetwork } = req.body
    const { bonusType, bonusId } = bonusInfo
    const community = await getCommunity({ tokenAddress, originNetwork })
    const tokenBonus = get(community, `${bonusType}.amount`)

    if (!tokenBonus) {
      return res.status(403).send({
        error: `No ${bonusType} defined for token ${tokenAddress}.`
      })
    }

    const oldBonus = await osseus.db_models.tokenBonus.startBonus({ accountAddress, tokenAddress, bonusId })

    if (oldBonus && oldBonus.bonusStatus !== 'FAILED') {
      await osseus.db_models.tokenBonus.revertBonus(oldBonus)
      return res.status(403).send({
        error: `Account ${accountAddress} already received bonus for bonusId: ${bonusId}.`
      })
    }

    const tokenBonusMaxTimes = get(community, `${bonusType}.maxTimes`) || 1

    const bonusesCount = await osseus.db_models.tokenBonus.bonusesPerAccount({ accountAddress, tokenAddress })

    if (bonusesCount > tokenBonusMaxTimes) {
      await osseus.db_models.tokenBonus.failBonus({ accountAddress, tokenAddress, bonusId })
      return res.status(403).send({
        error: `Bonus of ${accountAddress} for bonusId: ${bonusId} failed. Reached maximum times ${tokenBonusMaxTimes}.`
      })
    }

    let bonusObject = await osseus.db_models.tokenBonus.getStartedByAccount({ accountAddress, tokenAddress, bonusId })

    const job = await osseus.lib.agenda.now('bonus-token', { accountAddress: accountAddress, tokenAddress:  tokenAddress, originNetwork, bonusType, bonusId })

    res.send({ job: job.attrs })
  }

  /**
   * @api {get} /fund/status/:id Fetch native funding status
   * @apiParam {String} id Native funding id
   * @apiName FundStatusNative
   * @apiGroup Funding
   *
   *
   * @apiSuccess {String} status Native funding status, can be STARTED, SUCCEEDED or FAILED.
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
   * @apiSuccess {String} status Token funding status, can be STARTED, SUCCEEDED or FAILED.
   */
  const getTokenFundingStatus = async ({ id }) => {
    const fundingObject = await osseus.db_models.tokenFunding.getById(id)
    return fundingObject ? { status: fundingObject.fundingStatus } : { status: 'NOT_FOUND' }
  }

  /**
   * @api {get} /bonus/status/:id Fetch token funding status
   * @apiParam {String} id Token bonus id
   * @apiName BonusStatusToken
   * @apiGroup Bonus
   *
   *
   * @apiSuccess {String} status Token bonus status, can be STARTED, SUCCEEDED or FAILED.
   */
  const getTokenBonusStatus = async ({ id }) => {
    const bonusObject = await osseus.db_models.tokenBonus.getById(id)
    return bonusObject ? { status: bonusObject.bonusStatus } : { status: 'NOT_FOUND' }
  }

  return {
    fundNative: async (req, res) => {
      await fundNative(req, res)
    },
    fundToken: async (req, res) => {
      await fundToken(req, res)
    },
    bonusToken: async (req, res) => {
      await bonusToken(req, res)
    },
    balanceNative: async (req, res) => {
      res.send(await getNativeBalance(req.params))
    },
    balanceToken: async (req, res) => {
      res.send(await getTokenBalance(req.params))
    },
    fundNativeStatus: async (req, res) => {
      res.send(await getNativeFundingStatus(req.params))
    },
    fundTokenStatus: async (req, res) => {
      res.send(await getTokenFundingStatus(req.params))
    },
    bonusTokenStatus: async (req, res) => {
      res.send(await getTokenBonusStatus(req.params))
    }
  }
}
