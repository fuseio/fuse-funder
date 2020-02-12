const moment = require('moment')

module.exports = (osseus) => {
  const { mongo } = osseus
  const { Schema, Types } = mongo.mongoose

  const TokenBonusSchema = new Schema({
    accountAddress: { type: String, required: true },
    tokenAddress: { type: String, required: true },
    done: { type: Boolean, default: false },
    bonusStatus: { type: String },
    bonusDate: { type: Date },
    bonusId: { type: String, required: true}
  }, { timestamps: true })

  TokenBonusSchema.index({ accountAddress: 1, tokenAddress: 1, bonusId: 1 }, { unique: true })
  TokenBonusSchema.index({ bonusDate: -1 })

  TokenBonusSchema.set('toJSON', {
    versionKey: true
  })

  const TokenBonus = mongo.model('TokenBonus', TokenBonusSchema)

  function tokenBonus () {}

  tokenBonus.startBonus = ({ accountAddress, tokenAddress, bonusId }) => TokenBonus.findOneAndUpdate({ accountAddress, tokenAddress, bonusId }, { bonusStatus: 'STARTED', bonusDate: new Date() }, { upsert: true })

  tokenBonus.finishBonus = ({ accountAddress, tokenAddress, bonusId }) => TokenBonus.updateOne({ accountAddress, tokenAddress, bonusId, bonusStatus: 'STARTED' }, { $set: { bonusStatus: 'SUCCEEDED', bonusDate: new Date() }})

  tokenBonus.failBonus = ({ accountAddress, tokenAddress, bonusId }) => TokenBonus.updateOne({ accountAddress, tokenAddress, bonusId, bonusStatus: 'STARTED' }, { $set: { bonusStatus: 'FAILED' }})

  tokenBonus.isFunded = ({ accountAddress, tokenAddress, bonusId }) => TokenBonus.findOne({ accountAddress, tokenAddress, bonusId, bonusStatus: { $exists: true } })

  tokenBonus.getStartedByAccount = ({ accountAddress, tokenAddress, bonusId }) => TokenBonus.findOne({ accountAddress, tokenAddress, bonusId, bonusStatus: 'STARTED' })

  tokenBonus.revertBonus = (oldBonus) => TokenBonus.findOneAndUpdate({ accountAddress: oldBonus.accountAddress, tokenAddress: oldBonus.tokenAddress },
    { bonusStatus: oldBonus.bonusStatus, bonusDate: oldBonus.bonusDate })

  tokenBonus.bonusesPerAccount = ({ accountAddress, tokenAddress }) => TokenBonus.find({ accountAddress, tokenAddress, bonusStatus: {$in: ['STARTED', 'SUCCEEDED']} }).count()

  tokenBonus.getById = (id) => TokenBonus.findOne({_id: Types.ObjectId(id)})

  return tokenBonus
}
