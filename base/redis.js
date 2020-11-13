const config = require('./config')
const debug = require('debug')('REDIS')
const {RedisLogger} = require('./logger')
console.log(config.redis.port,config.redis.host)
const RedisClient = require('redis').createClient(config.redis.port, config.redis.host, {})
RedisClient.on('ready', function () {
  RedisLogger.info('Redis初始化完毕')
})

RedisClient.on('error', function (err) {
  console.error('[REDIS]:', err)
  // RedisLogger.error(err)
})

RedisClient.on('connect', function () {
  debug('REDIS connected.')
})

module.exports = RedisClient