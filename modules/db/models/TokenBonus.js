module.exports = (osseus) => {
  const { mongo } = osseus
  const { Schema, Types } = mongo.mongoose

  const TokenBonusSchema = new Schema({
    phoneNumber: { type: String, required: true },
    accountAddress: { type: String, required: true },
    tokenAddress: { type: String, required: true },
    bonusStatus: { type: String, enum: ['STARTED', 'SUCCEEDED', 'FAILED'], default: 'STARTED' },
    bonusDate: { type: Date },
    bonusType: { type: String, required: true },
    bonusId: { type: String, required: true }
  }, { timestamps: true })

  TokenBonusSchema.index({ phoneNumber: 1, accountAddress: 1, tokenAddress: 1, bonusType: 1, bonusId: 1 })
  TokenBonusSchema.index({ bonusDate: -1 })

  TokenBonusSchema.set('toJSON', {
    versionKey: true
  })

  const TokenBonus = mongo.model('TokenBonus', TokenBonusSchema)

  function tokenBonus () {}

  tokenBonus.startBonus = ({ phoneNumber, accountAddress, tokenAddress, bonusType, bonusId }) => new TokenBonus({ phoneNumber, accountAddress, tokenAddress, bonusType, bonusId, bonusStatus: 'STARTED', bonusDate: new Date() }).save()

  tokenBonus.finishBonus = ({ phoneNumber, accountAddress, tokenAddress, bonusType, bonusId }) => TokenBonus.updateOne({ phoneNumber, accountAddress, tokenAddress, bonusType, bonusId, bonusStatus: 'STARTED' }, { $set: { bonusStatus: 'SUCCEEDED', bonusDate: new Date() } })

  tokenBonus.failBonus = ({ phoneNumber, accountAddress, tokenAddress, bonusType, bonusId }) => TokenBonus.updateOne({ phoneNumber, accountAddress, tokenAddress, bonusType, bonusId, bonusStatus: 'STARTED' }, { $set: { bonusStatus: 'FAILED' } })

  tokenBonus.bonusesCount = ({ phoneNumber, tokenAddress, bonusType }) => TokenBonus.find({ phoneNumber, tokenAddress, bonusType, bonusStatus: { $in: ['STARTED', 'SUCCEEDED'] } }).count()

  tokenBonus.bonusesCountForId = ({ phoneNumber, tokenAddress, bonusType, bonusId }) => TokenBonus.find({ phoneNumber, tokenAddress, bonusType, bonusId, bonusStatus: { $in: ['STARTED', 'SUCCEEDED'] } }).count()

  tokenBonus.getById = (id) => TokenBonus.findOne({ _id: Types.ObjectId(id) })

  return tokenBonus
}
