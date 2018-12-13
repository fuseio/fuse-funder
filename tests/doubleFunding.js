const request = require('request')
const Web3 = require('web3')

const NUM_OF_TRIES = 5
const REQUEST_URL = 'http://localhost:8080/api/balance/request'

const test = () => {
  const web3 = new Web3()

  const account = web3.eth.accounts.create()
  for (let i = 0; i < NUM_OF_TRIES; i++) {
    request(`${REQUEST_URL}/${account.address}`, (error, response, body) => {
      if (error) {
        console.log(error)
        return
      }
      console.log(body)
    })
  }
}

test()
