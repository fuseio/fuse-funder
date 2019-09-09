const request = require('request')
const Web3 = require('web3')

const NUM_OF_TRIES = 10
const REQUEST_URL = 'http://localhost:8080/api/fund/native'

const test = () => {
  const web3 = new Web3()

  const accounts = []
  for (let i = 0; i < NUM_OF_TRIES; i++) {
    accounts.push(web3.eth.accounts.create())
  }

  for (let account of accounts) {
    request.post({url: REQUEST_URL, json: {accountAddress: account.address}}, (error, response, body) => {
      if (error) {
        console.log(error)
        return
      }
      console.log(body)
    })
  }
}

test()
