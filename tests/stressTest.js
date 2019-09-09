const request = require('request')
const Web3 = require('web3')

const NUM_OF_TRIES = 10
const REQUEST_URL_NATIVE = 'http://localhost:8080/api/fund/native'
const REQUEST_URL_TOKEN = 'http://localhost:8080/api/fund/token'
const TOKEN_ADDRESS = '0xEC83FD24d39d20564a37b0ce311ab36809fA6975'

const test = () => {
  const web3 = new Web3()

  const accounts = []
  for (let i = 0; i < NUM_OF_TRIES; i++) {
    accounts.push(web3.eth.accounts.create())
  }

  for (let account of accounts) {
    request.post({url: REQUEST_URL_NATIVE, json: {accountAddress: account.address}}, (error, response, body) => {
      if (error) {
        console.log(error)
        return
      }
    })
    request.post({url: REQUEST_URL_TOKEN, json: {accountAddress: account.address, tokenAddress: TOKEN_ADDRESS}}, (error, response, body) => {
      if (error) {
        console.log(error)
        return
      }
    })
  }
}

test()
