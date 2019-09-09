const moment = require('moment')

module.exports = (osseus) => {
  const { mongo } = osseus
  const { Schema, Types } = mongo.mongoose

  const TokenFundingSchema = new Schema({
    accountAddress: { type: String, required: true },
    tokenAddress: { type: String, required: true },
    funded: { type: Boolean, default: false },
    fundingStatus: { type: String },
    fundingDate: { type: Date }
  }, { timestamps: true })

  TokenFundingSchema.index({ accountAddress: 1, tokenAddress: 1 }, { unique: true })
  TokenFundingSchema.index({ fundingDate: -1 })

  TokenFundingSchema.set('toJSON', {
    versionKey: true
  })

  const TokenFunding = mongo.model('TokenFunding', TokenFundingSchema)

  function tokenFunding () {}

  tokenFunding.startFunding = ({ accountAddress, tokenAddress }) => TokenFunding.findOneAndUpdate({ accountAddress, tokenAddress }, { fundingStatus: 'STARTED', fundingDate: new Date() }, { upsert: true })

  tokenFunding.finishFunding = ({ accountAddress, tokenAddress }) => TokenFunding.updateOne({ accountAddress, tokenAddress, fundingStatus: 'STARTED' }, { $set: { fundingStatus: 'SUCCEEDED', fundingDate: new Date() }})

  tokenFunding.failFunding = ({ accountAddress, tokenAddress }) => TokenFunding.updateOne({ accountAddress, tokenAddress, fundingStatus: 'STARTED' }, { $set: { fundingStatus: 'FAILED' }})

  tokenFunding.isFunded = ({ accountAddress, tokenAddress }) => TokenFunding.findOne({ accountAddress, tokenAddress, fundingStatus: { $exists: true } })

  tokenFunding.getStartedByAccount = ({ accountAddress, tokenAddress }) => TokenFunding.findOne({ accountAddress, tokenAddress, fundingStatus: 'STARTED' })

  tokenFunding.revertFunding = (oldFunding) => TokenFunding.findOneAndUpdate({ accountAddress: oldFunding.accountAddress, tokenAddress: oldFunding.tokenAddress },
    { fundingStatus: oldFunding.fundingStatus, fundingDate: oldFunding.fundingDate })

  tokenFunding.fundingsPerDay = (date) => {
    var startOfDay = moment(date).startOf('day')
    var endOfDay = moment(date).endOf('day')

    return TokenFunding.find({
      fundingDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      fundingStatus: {
        $in: ['STARTED', 'SUCCEEDED']
      }
    }).count()
  }

  tokenFunding.getById = (id) => TokenFunding.findOne({_id: Types.ObjectId(id)})

  return tokenFunding
}
