var FiatTokenV1 = artifacts.require('./FiatTokenV1.sol')
var FiatTokenProxy = artifacts.require('./FiatTokenProxy.sol')

// Any address will do, preferably one we generated
var throwawayAddress = '0x74544d100dcc26265359db8f766c72cea87394a2'

module.exports = function (deployer, network, accounts) {
  if (network === 'development' || network === 'coverage') {
    // Change these to the cold storage addresses provided by ops
    // these are the deterministic addresses from ganache, so the private keys are well known
    // and match the values we use in the tests
    var admin = '0xd686b4a1e52971d3315f355251759eb6813f910d'
    var masterMinter = '0xed913ef99be4d74cb7e04d64df75ee84123b8ac1'
    var pauser = '0xed9d5d2a91b79959c137d98acdbb92057e06f692'
    var blacklister = '0xe207c3657acd77c6eaaa0f2e2440c2815765f685'
    var owner = '0x9d745c59b3055f81a52d68c62760a3fe604dab51'
    var minter = '0x18ee823334f216e4f8e0467c1092437edb927fdf'
  }

  console.log('deploying impl')

  var fiatTokenImpl
  var tokenProxy
  // deploy implementation contract
  deployer.deploy(FiatTokenV1)
    .then(function (impl) {
      fiatTokenImpl = impl
      console.log('initializing impl with dummy values')
      return impl.initialize(
        '',
        '',
        '',
        0,
        throwawayAddress,
        throwawayAddress,
        throwawayAddress,
        throwawayAddress
      )
    })
    .then(function (initDone) {
      console.log('deploying proxy')
      return deployer.deploy(FiatTokenProxy, fiatTokenImpl.address)
    })
    .then(function (proxy) {
      tokenProxy = proxy
      console.log('reassigning proxy admin')
      // need to change admin first, or the call to initialize won't work
      // since admin can only call methods in the proxy, and not forwarded methods
      return proxy.changeAdmin(admin)
    })
    .then(function (changeAdminDone) {
      console.log('initializing proxy')
      // Pretend that the proxy address is a FiatTokenV1
      // this is fine because the proxy will forward all the calls to the FiatTokenV1 impl
      tokenProxy = FiatTokenV1.at(tokenProxy.address)
      return tokenProxy.initialize(
        'USD//C',
        'USDC',
        'USD',
        6,
        masterMinter,
        pauser,
        blacklister,
        owner
      ).then(function (initializeDone) {
        return tokenProxy.configureMinter(minter, 1e24, {
          from: masterMinter
        })
      })
    })
    .then(function (initDone) {
      console.log('Deployer proxy at ', tokenProxy.address)
    })
}
