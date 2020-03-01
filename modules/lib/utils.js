const getBaseUrl = (osseus, originNetwork) => {
  const urlComponents = osseus.config.fuse_studio_api_base.split('.')
  if (originNetwork === 'ropsten' && urlComponents.length > 1) {
    urlComponents[0] = `${urlComponents[0]}-ropsten`
  }
  return urlComponents.join('.')
}

module.exports = {
  getBaseUrl
}
