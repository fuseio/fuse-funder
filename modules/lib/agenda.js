const Agenda = require('agenda')

module.exports = (osseus) => {
  const agenda = new Agenda({ db: { address: osseus.config.mongo_uri } })

  agenda.on('start', job => console.info(`Job ${job.attrs.name} starting. id: ${job.attrs._id}`))
  agenda.on('complete', job => console.info(`Job ${job.attrs.name} finished. id: ${job.attrs._id}`))
  agenda.on('success', job => console.info(`Job ${job.attrs.name} succeeded. id: ${job.attrs._id}`))
  agenda.on('fail', (error, job) => console.error(`Job ${job.attrs.name} failed. id: ${job.attrs._id}. ${error}`))

  agenda.start()

}
