const FCF = artifacts.require('./FCF.sol')

module.exports = function (deployer) {
  deployer.deploy(FCF, 'Fussy Crypto Fiat', 'FCF', 18)
}
