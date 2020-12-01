const config = require('./config')
const debug = require('debug')('REDIS')
const {RedisLogger} = require('./logger')
console.log(`[redis] REDIS Connected to ${config.redis.host}:${config.redis.port}`)
const RedisClient = require('redis').createClient(config.redis.port, config.redis.host, {})
RedisClient.on('ready', function () {
  RedisLogger.info('Redis初始化完毕')
})


RedisClient.on('error', function (err) {
  console.error('[REDIS]:', err)
  RedisLogger.error(err)
})

RedisClient.on('connect', function () {
  debug('REDIS connected.')
})

let REDIS = RedisClient
REDIS.ASC_GET = async (key) => {
  return new Promise((resolve,reject)=>{
    RedisClient.get(key,(err,value)=>{
      if(err)
        resolve(null)
      else
        resolve(value)
    })
  })
}

REDIS.ASC_SET = async (key,data)=>{
  return new Promise((resovle,reject)=>{
    RedisClient.set(key,data,(err)=>{
      if(err)
        reject(err)
      else
        resolve()
    })
  })
}

REDIS.ASC_SMEMBERS = async (key) =>{
  return new Promise((resolve,reject)=>{
    RedisClient.get(key,(err,value)=>{
      if(err)
        resolve(null)
      else
        resolve(value)
    })
  })
}


REDIS.SET_JSON = async (key,value)=>{
  RedisClient.set(key,JSON.stringify(value))
}

REDIS.ASC_SET_JSON = async (key, data) => {
  return new Promise((resolve, reject) => {
    RedisClient.set(key, JSON.stringify(data), (err) => {
      if (err)
        reject(err)
      else
        resolve()
    })
  })
}

REDIS.ASC_GET_JSON = async (key)=>{
  let res = await REDIS.ASC_GET(key)
  return JSON.parse(res)
}

module.exports = REDIS