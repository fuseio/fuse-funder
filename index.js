const Osseus = require('@colucom/osseus')

const main = async () => {
  const osseus = await Osseus.init()

  await require('./modules/db').init(osseus)
  await require('./modules/lib').init(osseus)
}

main()
