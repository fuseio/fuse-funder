
module.exports = (osseus) => {
  const { mongo } = osseus
  const Schema = mongo.mongoose.Schema

  const AccountSchema = new Schema({
    address: { type: String, required: [true, "can't be blank"] },
    childIndex: { type: Number, required: [true, "can't be blank"] },
    nonce: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
    lockingTime: { type: Date }
  })

  AccountSchema.index({ address: 1 }, { unique: true })

  const Account = mongo.model('Account', AccountSchema)

  function account () {}

  account.getModel = () => {
    return Account
  }

  account.lockAccount = () => {
    return Account.findOneAndUpdate({ isLocked: false }, { isLocked: true, lockingTime: new Date() })
  }

  account.unlockAccount = async (address, nonce) =>
    Account.findOneAndUpdate({ address }, { isLocked: false, lockingTime: null, nonce })

  return account
}
