const moment = require('moment')

module.exports = (osseus) => {
  const { mongo } = osseus
  const { Schema, Types } = mongo.mongoose

  const TokenFundingSchema = new Schema({
    phoneNumber: { type: String, required: true },
    accountAddress: { type: String, required: true },
    tokenAddress: { type: String, required: true },
    fundingStatus: { type: String, enum: ['STARTED', 'SUCCEEDED', 'FAILED'], default: 'STARTED' },
    fundingDate: { type: Date }
  }, { timestamps: true })

  TokenFundingSchema.index({ phoneNumber: 1, accountAddress: 1, tokenAddress: 1 })
  TokenFundingSchema.index({ fundingDate: -1 })

  TokenFundingSchema.set('toJSON', {
    versionKey: true
  })

  const TokenFunding = mongo.model('TokenFunding', TokenFundingSchema)

  function tokenFunding () {}

  tokenFunding.startFunding = ({ phoneNumber, accountAddress, tokenAddress }) => TokenFunding.findOneAndUpdate({ phoneNumber, accountAddress, tokenAddress }, { fundingStatus: 'STARTED', fundingDate: new Date() }, { upsert: true })

  tokenFunding.finishFunding = ({ phoneNumber, accountAddress, tokenAddress }) => TokenFunding.updateOne({ phoneNumber, accountAddress, tokenAddress, fundingStatus: 'STARTED' }, { $set: { fundingStatus: 'SUCCEEDED', fundingDate: new Date() } })

  tokenFunding.failFunding = ({ phoneNumber, accountAddress, tokenAddress }) => TokenFunding.updateOne({ phoneNumber, accountAddress, tokenAddress, fundingStatus: 'STARTED' }, { $set: { fundingStatus: 'FAILED' } })

  tokenFunding.fundingsCount = ({ phoneNumber, tokenAddress }) => TokenFunding.find({ phoneNumber, tokenAddress, fundingStatus: { $in: ['STARTED', 'SUCCEEDED'] } }).count()

  tokenFunding.getById = (id) => TokenFunding.findOne({ _id: Types.ObjectId(id) })

  tokenFunding.fundingsPerDay = (date) => {
    var startOfDay = moment(date).startOf('day')
    var endOfDay = moment(date).endOf('day')

    return TokenFunding.find({ fundingDate: { $gte: startOfDay, $lte: endOfDay }, fundingStatus: { $in: ['STARTED', 'SUCCEEDED'] } }).count()
  }

  return tokenFunding
}
