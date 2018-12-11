const moment = require('moment')

module.exports = (osseus) => {
  const { mongo } = osseus
  const Schema = mongo.mongoose.Schema
  mongo.mongoose.set('debug', true)
  const UserSchema = new Schema({
    account: { type: String, required: true },
    funded: { type: Boolean, default: false },
    fundingStatus: { type: String },
    fundingDate: { type: Date }
  }, { timestamps: true })

  UserSchema.index({ account: 1 }, { unique: true })
  UserSchema.index({ fundingDate: -1 })

  UserSchema.set('toJSON', {
    versionKey: true
  })

  const User = mongo.model('User', UserSchema)

  function user () {}

  user.startFunding = (account) => User.update({ account }, { fundingStatus: 'STARTED' }, { upsert: true })

  user.finishFunding = (account) => User.update({ account }, { fundingStatus: 'SUCCEEDED', fundingDate: new Date() })

  user.failFunding = (account) => User.update({ account }, { fundingStatus: 'FAILED' })

  user.isFunded = (account) => User.findOne({ account, fundingStatus: { $exists: true } })

  user.getByAccount = (account) => User.findOne({ account })

  user.fundingsPerDay = (date) => {
    var startOfDay = moment(date).startOf('day')
    var endOfDay = moment(date).endOf('day')

    return User.find({
      fundingDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).count()
  }

  return user
}
