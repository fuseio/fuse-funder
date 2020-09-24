module.exports = (osseus) => {
  const { mongo } = osseus
  const { Schema, Types } = mongo.mongoose

  const TokenBonusSchema = new Schema({
    phoneNumber: { type: String, required: true },
    accountAddress: { type: String, required: true },
    identifier: { type: String },
    tokenAddress: { type: String, required: true },
    communityAddress: { type: String, required: true },
    bonusStatus: { type: String, enum: ['STARTED', 'SUCCEEDED', 'FAILED'], default: 'STARTED' },
    bonusDate: { type: Date },
    bonusType: { type: String, required: true },
    bonusId: { type: String, required: true }
  }, { timestamps: true })

  TokenBonusSchema.index({ phoneNumber: 1, identifier: 1, accountAddress: 1, tokenAddress: 1, communityAddress: 1,bonusType: 1, bonusId: 1 })
  TokenBonusSchema.index({ bonusDate: -1 })

  TokenBonusSchema.set('toJSON', {
    versionKey: true
  })

  const TokenBonus = mongo.model('TokenBonus', TokenBonusSchema)

  function tokenBonus () {}

  tokenBonus.startBonus = ({ phoneNumber, identifier, accountAddress, tokenAddress, communityAddress, bonusType, bonusId }) => new TokenBonus({ phoneNumber, identifier, accountAddress, tokenAddress, communityAddress, bonusType, bonusId, bonusStatus: 'STARTED', bonusDate: new Date() }).save()

  tokenBonus.finishBonus = ({ phoneNumber, identifier, accountAddress, tokenAddress, communityAddress, bonusType, bonusId }) => TokenBonus.updateOne({ phoneNumber, identifier, accountAddress, tokenAddress, communityAddress, bonusType, bonusId, bonusStatus: 'STARTED' }, { $set: { bonusStatus: 'SUCCEEDED', bonusDate: new Date() } })

  tokenBonus.failBonus = ({ phoneNumber, identifier, accountAddress, tokenAddress, communityAddress, bonusType, bonusId }) => TokenBonus.updateOne({ phoneNumber, identifier, accountAddress, tokenAddress, communityAddress, bonusType, bonusId, bonusStatus: 'STARTED' }, { $set: { bonusStatus: 'FAILED' } })

  tokenBonus.bonusesCountForPhoneNumber = ({ phoneNumber, tokenAddress, communityAddress, bonusType }) => TokenBonus.find({ phoneNumber, tokenAddress, communityAddress, bonusType, bonusStatus: { $in: ['STARTED', 'SUCCEEDED'] } }).count()

  tokenBonus.bonusesCountForIdentifier = ({ identifier, tokenAddress, communityAddress, bonusType }) => TokenBonus.find({ identifier, tokenAddress, communityAddress, bonusType, bonusStatus: { $in: ['STARTED', 'SUCCEEDED'] } }).count()

  tokenBonus.bonusesCountForId = ({ phoneNumber, identifier, tokenAddress, communityAddress, bonusType, bonusId }) => TokenBonus.find({ phoneNumber, identifier, tokenAddress, communityAddress, bonusType, bonusId, bonusStatus: { $in: ['STARTED', 'SUCCEEDED'] } }).count()

  tokenBonus.getById = (id) => TokenBonus.findOne({ _id: Types.ObjectId(id) })

  return tokenBonus
}
