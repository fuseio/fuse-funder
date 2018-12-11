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

  const User = mongo.mongoose.model('User', UserSchema)

  function user () {}

  user.getByAccount = (account) => {
    console.log('hi')
    return new Promise((resolve, reject) => {
      console.log('hi2')
      User.find({}, console.log)
      User.findOne({ account }, (err, doc) => {
        console.log('DONE')
        if (err) {
          return reject(err)
        }
        if (!doc) {
          return reject(new Error(`User not found for address: ${account}`))
        }
        resolve(doc)
      })
    })
  }
  return user
}
