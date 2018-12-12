const moment = require('moment')

module.exports = (osseus) => {
  const { mongo } = osseus
  const Schema = mongo.mongoose.Schema

  const FundingSchema = new Schema({
    account: { type: String, required: true },
    funded: { type: Boolean, default: false },
    fundingStatus: { type: String },
    fundingDate: { type: Date }
  }, { timestamps: true })

  FundingSchema.index({ account: 1 }, { unique: true })
  FundingSchema.index({ fundingDate: -1 })

  FundingSchema.set('toJSON', {
    versionKey: true
  })

  const Funding = mongo.model('Funding', FundingSchema)

  function funding () {}

  funding.startFunding = (account) => Funding.findOneAndUpdate({ account }, { fundingStatus: 'STARTED', fundingDate: new Date() }, { upsert: true })

  funding.finishFunding = (account) => Funding.update({ account }, { fundingStatus: 'SUCCEEDED', fundingDate: new Date() })

  funding.failFunding = (account) => Funding.update({ account }, { fundingStatus: 'FAILED' })

  funding.isFunded = (account) => Funding.findOne({ account, fundingStatus: { $exists: true } })

  funding.getByAccount = (account) => Funding.findOne({ account })

  funding.fundingsPerDay = (date) => {
    var startOfDay = moment(date).startOf('day')
    var endOfDay = moment(date).endOf('day')

    return Funding.find({
      fundingDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      fundingStatus: {
        $in: ['STARTED', 'SUCCEEDED']
      }
    }).count()
  }

  return funding
}
