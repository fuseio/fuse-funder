module.exports = {
  networks: {
    development: {
      network_id: '*',
      host: 'localhost',
      port: 8545
    }
  },
  rpc: {
    host: 'localhost',
    port: 8545
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
}
