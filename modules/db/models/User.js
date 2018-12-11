module.exports = (osseus) => {
  const { mongo } = osseus
  const Schema = mongo.mongoose.Schema

  const UserSchema = new Schema({
    account: { type: String, required: true },
    funded: { type: Boolean, default: false }
  })

  UserSchema.index({ account: 1 }, { unique: true })
  UserSchema.set('toJSON', {
    versionKey: true
  })

  const User = mongo.model('User', UserSchema)

  function user () {}

  user.fund = (account) => User.update({ account }, { funded: true }, { upsert: true })

  user.getByAccount = (account) => User.findOne({ account })

  return user
}
