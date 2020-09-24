module.exports = {
  APPLICATION_NAME: 'fuse-funder',
  DEBUG: false,
  OSSEUS_LOGGER_LOG_LEVEL: 'debug',
  OSSEUS_LOGGER_NO_CONSOLE_OVERRIDE: true,
  OSSEUS_SERVER_DEPENDENCIES: ['logger', 'mongo'],
  OSSEUS_SERVER_PORT: '8080',
  OSSEUS_SERVER_MORGAN_FORMAT: ':date[iso] method=":method", url=":url", statusCode=":status", route=":route", host=":host", client-ip=":client-ip", user-agent=":user-agent", httpVersion=":http-version", responseTime=":response-time"',
  OSSEUS_SERVER_ADD_HEALTHCHECK: true,
  OSSEUS_SERVER_ADD_IS_RUNNING: true,
  OSSEUS_ROUTER_DEPENDENCIES: ['logger', 'server'],
  OSSEUS_ROUTER_ROUTES_PATH: '/app/routes',
  OSSEUS_ROUTER_CONTROLLERS_PATH: '/app/controllers',
  OSSEUS_ROUTER_POLICY_PATH: '/app/middlewares',
  OSSEUS_ROUTER_URL_PREFIX: '/api',
  OSSEUS_ROUTER_JWT_SECRET: '',
  OSSEUS_MONGO_DEPENDENCIES: ['logger'],
  OSSEUS_MONGO_URI: '',
  ETHEREUM_WEB3_PROVIDER: 'https://rpc.fuse.io',
  ETHEREUM_HD_WALLET_MNEMONIC: '',
  WEB3_TOKEN_ABI_PATH: 'abi/FiatTokenV1.json',
  ETHEREUM_ADMIN_ACCOUNT: '0x373c383b05c121e541f239afe5fd73c013fed20f',
  ETHEREUM_NATIVE_USER_BONUS: '1e17',
  ETHEREUM_NATIVE_ADMIN_BONUS_ROPSTEN: '1e20',
  ETHEREUM_NATIVE_ADMIN_BONUS_MAINNET: '1e21',
  ETHEREUM_TOKEN_ADDRESS: '0x415c11223bca1324f470cf72eac3046ea1e755a3',
  ETHEREUM_TOKEN_BONUS: '1e20',
  ETHEREUM_FUNDINGS_CAP_PER_DAY: 1000,
  ETHEREUM_GAS_PRICE: '1e9',
  FUSE_STUDIO_API_BASE: 'https://studio.fuse.io/api/v1',
  EXPLORER_BASE_API: 'https://explorer.fuse.io/api',
  FUNDING_CONCURRENCY: 5,
  BLOCKED_PHONE_PREFIXES: ''
}
