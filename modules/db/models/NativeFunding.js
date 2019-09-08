const moment = require('moment')

module.exports = (osseus) => {
  const { mongo } = osseus
  const Schema = mongo.mongoose.Schema

  const NativeFundingSchema = new Schema({
    accountAddress: { type: String, required: true },
    funded: { type: Boolean, default: false },
    fundingStatus: { type: String },
    fundingDate: { type: Date }
  }, { timestamps: true })

  NativeFundingSchema.index({ accountAddress: 1 }, { unique: true })
  NativeFundingSchema.index({ fundingDate: -1 })

  NativeFundingSchema.set('toJSON', {
    versionKey: true
  })

  const NativeFunding = mongo.model('NativeFunding', NativeFundingSchema)

  function nativeFunding () {}

  nativeFunding.startFunding = ({ accountAddress }) => NativeFunding.findOneAndUpdate({ accountAddress }, { fundingStatus: 'STARTED', fundingDate: new Date() }, { upsert: true })

  nativeFunding.finishFunding = ({ accountAddress }) => NativeFunding.update({ accountAddress }, { $set: { fundingStatus: 'SUCCEEDED', fundingDate: new Date() }})

  nativeFunding.failFunding = ({ accountAddress }) => NativeFunding.update({ accountAddress }, { $set: { fundingStatus: 'FAILED' } })

  nativeFunding.isFunded = ({ accountAddress }) => NativeFunding.findOne({ accountAddress, fundingStatus: { $exists: true } })

  nativeFunding.getStartedByAccount = ({ accountAddress }) => NativeFunding.findOne({ accountAddress, fundingStatus: 'STARTED' })

  nativeFunding.revertFunding = (oldFunding) => NativeFunding.findOneAndUpdate({ accountAddress: oldFunding.accountAddress },
    { fundingStatus: oldFunding.fundingStatus, fundingDate: oldFunding.fundingDate })

  nativeFunding.fundingsPerDay = (date) => {
    var startOfDay = moment(date).startOf('day')
    var endOfDay = moment(date).endOf('day')

    return NativeFunding.find({
      fundingDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      fundingStatus: {
        $in: ['STARTED', 'SUCCEEDED']
      }
    }).count()
  }

  return nativeFunding
}
