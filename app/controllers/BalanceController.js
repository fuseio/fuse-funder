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

  const getCommunity = async ({ communityAddress, originNetwork }) => {
    try {
      const urlComponents = osseus.config.fuse_studio_api_base.split('.')
      if (originNetwork === 'ropsten') {
        urlComponents[0] = `${urlComponents[0]}-ropsten`
      }
      const baseURL = urlComponents.join('.')
      const response = await request.get(`${baseURL}/communities/${communityAddress}`)
      const community = get(JSON.parse(response), 'data')
      return community
    } catch (err) {
      console.error(err)
      return {}
    }
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

  const isTeam = (phoneNumber) => {
    return osseus.config.team_phone_numbers ? osseus.config.team_phone_numbers.split(',').includes(phoneNumber) : false
  }

  const isBlocked = (phoneNumber) => {
    if (!osseus.config.blocked_phone_prefixes) {
      return false
    }
    const blockedPrefixes = osseus.config.blocked_phone_prefixes.split(',') || []
    const isBlocked = blockedPrefixes.filter(bp => phoneNumber.startsWith(bp)).length > 0
    return isBlocked
  }

  /**
   * @api {post} /fund/token Fund account with token
   * @apiParam {String} phoneNumbber Phone number of bonus receiver
   * @apiParam {String} accountAddress Account address to fund
   * @apiParam {String} tokenAddress Token address of the funding token
   * @apiParam {Object} originNetwork ropsten/mainnet
   * @apiName FundToken
   * @apiGroup Funding
   *
   *
   * @apiSuccess {String} id Task id of the funding job
   * @apiSuccess {String} status Current status of the job. Should be "STARTED" if all good.
   */
  const fundToken = async (req, res) => {
    const { phoneNumber, accountAddress, identifier, tokenAddress, communityAddress, originNetwork } = req.body
    const bonusType = 'plugins.joinBonus.joinInfo'
    const community = await getCommunity({ tokenAddress, communityAddress, originNetwork })
    const tokenFunding = get(community, `${bonusType}.amount`)

    if (!tokenFunding) {
      return res.status(403).send({
        error: `No join bonus defined for community ${communityAddress}.`
      })
    }

    if (!isTeam(phoneNumber)) {
      if (isBlocked(phoneNumber)) {
        return res.status(403).json({ error: `${phoneNumber} is blocked` })
      }

      const tokenFundingMaxTimes = get(community, `${bonusType}.maxTimes`) || 1
      const fundingsCountForPhoneNumber = await osseus.db_models.tokenFunding.fundingsCountForPhoneNumber({ phoneNumber, communityAddress, tokenAddress })
      if (fundingsCountForPhoneNumber >= tokenFundingMaxTimes) {
        return res.status(403).send({
          error: `Join bonus reached maximum times ${tokenFundingMaxTimes}. [phoneNumber: ${phoneNumber}, accountAddress: ${accountAddress}, tokenAddress: ${tokenAddress}, communityAddress: ${communityAddress}, bonusType: ${bonusType}]`
        })
      }

      if (!identifier) {
        return res.status(403).send({
          error: `No identifier defined. [phoneNumber: ${phoneNumber}, accountAddress: ${accountAddress}, tokenAddress: ${tokenAddress}, communityAddress: ${communityAddress}, bonusType: ${bonusType}]`
        })
      }

      const fundingsCountForIdentifier = await osseus.db_models.tokenFunding.fundingsCountForIdentifier({ identifier, tokenAddress })
      if (fundingsCountForIdentifier >= tokenFundingMaxTimes) {
        return res.status(403).send({
          error: `Join bonus reached maximum times ${tokenFundingMaxTimes}. [identifier: ${identifier}, accountAddress: ${accountAddress}, tokenAddress: ${tokenAddress}, communityAddress: ${communityAddress}, bonusType: ${bonusType}]`
        })
      }

      const fundingsCountDaily = await osseus.db_models.tokenFunding.fundingsPerDay(new Date())
      if (fundingsCountDaily > osseus.config.ethereum_fundings_cap_per_day) {
        return res.status(403).send({
          error: `Join bonus reached maximum capacity per day. [phoneNumber: ${phoneNumber}, identifier: ${identifier}, accountAddress: ${accountAddress}, tokenAddress: ${tokenAddress}, communityAddress: ${communityAddress}, bonusType: ${bonusType}]`
        })
      }
    }

    await osseus.db_models.tokenFunding.startFunding({ phoneNumber, identifier, accountAddress, tokenAddress, communityAddress })

    const job = await osseus.lib.agenda.now('fund-token', { phoneNumber, identifier, accountAddress, tokenAddress, originNetwork, bonusType, tokenFunding })

    res.send({ job: job.attrs })
  }

  /**
   * @api {post} /bonus/token Bonus account with token
   * @apiParam {String} phoneNumber Phone number of bonus receiver
   * @apiParam {String} accountAddress Account address to give bonus
   * @apiParam {String} tokenAddress Token address of the token to give as bonus
   * @apiParam {Object} bonusInfo The reason for the bonus
   * @apiParam {Object} originNetwork ropsten/mainnet
   * @apiName BonusToken
   * @apiGroup Bonus
   *
   *
   * @apiSuccess {String} id Task id of the bonus job
   * @apiSuccess {String} status Current status of the job. Should be "STARTED" if all good.
   */
  const bonusToken = async (req, res) => {
    const { phoneNumber, accountAddress, identifier, tokenAddress, communityAddress, bonusInfo, originNetwork } = req.body
    const { bonusType, bonusId } = bonusInfo
    const community = await getCommunity({ communityAddress, originNetwork })
    const tokenBonus = get(community, `${bonusType}.amount`)

    if (!tokenBonus) {
      return res.status(403).send({
        error: `No ${bonusType} defined for community ${communityAddress}.`
      })
    }

    if (!isTeam(phoneNumber)) {
      if (isBlocked(phoneNumber)) {
        return res.status(403).json({ error: `${phoneNumber} is blocked` })
      }

      const tokenBonusMaxTimes = get(community, `${bonusType}.maxTimes`) || 1
      const bonusesCountForPhoneNumber = await osseus.db_models.tokenBonus.bonusesCountForPhoneNumber({ phoneNumber, tokenAddress, communityAddress, bonusType })
      if (bonusesCountForPhoneNumber >= tokenBonusMaxTimes) {
        return res.status(403).send({
          error: `Bonus reached maximum times ${tokenBonusMaxTimes}. [phoneNumber: ${phoneNumber}, accountAddress: ${accountAddress}, tokenAddress: ${tokenAddress}, communityAddress: ${communityAddress}, bonusType: ${bonusType}, bonusId: ${bonusId}]`
        })
      }

      if (!identifier) {
        return res.status(403).send({
          error: `No identifier defined. [phoneNumber: ${phoneNumber}, accountAddress: ${accountAddress}, tokenAddress: ${tokenAddress}, communityAddress: ${communityAddress}, bonusType: ${bonusType}]`
        })
      }

      const bonusesCountForIdentifier = await osseus.db_models.tokenBonus.bonusesCountForIdentifier({ identifier, tokenAddress, bonusType })
      if (bonusesCountForIdentifier >= tokenBonusMaxTimes) {
        return res.status(403).send({
          error: `Bonus reached maximum times ${tokenBonusMaxTimes}. [identifier: ${identifier}, accountAddress: ${accountAddress}, tokenAddress: ${tokenAddress}, communityAddress: ${communityAddress}, bonusType: ${bonusType}, bonusId: ${bonusId}]`
        })
      }

      if (bonusType.includes('invite')) {
        const bonusesCountForId = await osseus.db_models.tokenBonus.bonusesCountForId({ phoneNumber, identifier, tokenAddress, communityAddress, bonusType, bonusId })
        if (bonusesCountForId > 0) {
          return res.status(403).send({
            error: `Invite bonus already received. [phoneNumber: ${phoneNumber}, identifier: ${identifier}, accountAddress: ${accountAddress}, tokenAddress: ${tokenAddress}, communityAddress: ${communityAddress}, bonusType: ${bonusType}, bonusId: ${bonusId}]`
          })
        }
      }
    }

    await osseus.db_models.tokenBonus.startBonus({ phoneNumber, identifier, accountAddress, tokenAddress, communityAddress, bonusType, bonusId })

    const job = await osseus.lib.agenda.now('bonus-token', { phoneNumber, identifier, accountAddress, tokenAddress, originNetwork, bonusType, bonusId })

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

  /**
   * @api {get} /job/:id Fetch job by id
   * @apiParam {String} id Job id
   * @apiName GetJob
   * @apiGroup Job
   *
   * @apiSuccess {Object} data Job object
   */
  const getJobStatus = async ({ id }) => {
    const jobs = await osseus.lib.agenda.jobs({ _id: osseus.mongo.mongoose.Types.ObjectId(id) })
    return { data: jobs[0] }
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
    },
    jobStatus: async (req, res) => {
      res.send(await getJobStatus(req.params))
    }
  }
}
