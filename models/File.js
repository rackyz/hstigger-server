const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Enterprise = require('./Enterprise')
const Type = require("./Type")
const Permission = require('./Permission')
const moment = require('moment')

const config = require('../base/config')
const COS = require('cos-nodejs-sdk-v5')
const cOSClient = new COS(config.cos)
const {
  UserLogger
} = require('../base/logger')
const REDIS = require('../base/redis')
const { ContextParser } = require('../base/util')

let o = {
  required: ['Type']
}


const T = 'file'
o.initdb = async (forced) => {
  
  await MYSQL.initdb(T, t => {
    t.uuid('id').index()
    t.string('name', 255).notNull()
    t.integer('size', 20)
    t.string('ext', 16)
    t.string('url',255)
    t.string('vdisk',16)
    t.boolean('private').defaultTo(false)
    t.uuid('created_by')
    t.datetime('created_at')
  }, forced)


}

o.list = async ()=>{
  await MYSQL(T)
}

o.listFromUser = async (id,vdisk=undefined)=>{
  let items = await MYSQL(T).where({
    "created_by": id,
    vdisk
  }).orderBy('created_at', 'desc').limit(5)
  return items
}

o.GetFileUrl = async (id)=>{
   if (!id)
     throw EXCEPTION.E_INVALID_DATA
  let baseURL = config.cos.url
  let file = await MYSQL(T).first("url").where({id})
  console.log(id,file)
  if(file)
    return baseURL + '/files/' + file.url
  else
    throw EXCEPTION.E_INVALID_DATA //not exist
}

o.GetTempFileUrl = async (id)=>{
  if(!id)
    throw EXCEPTION.E_INVALID_DATA
  let url = await o.GetFileUrl(id)
  console.log('GetTempFileUrl:', url)
  REDIS.ASC_SET('file-'+id,url)
  REDIS.EXPIRE('file-' + id, 3600)
  return '/public/files/'+id
}

o.GetURL = async (id)=>{
  if (!id)
     throw EXCEPTION.E_INVALID_DATA
  let url = await REDIS.ASC_GET('file-' + id)
  return url
}

o.post = async (files,op)=>{
  let createInfos = []
  files.forEach(v=>{
    let createInfo = {}
    createInfo.created_by = op
    createInfo.created_at = UTIL.getTimeStamp()
    createInfo.id = UTIL.createUUID()
    createInfo.url = v.vdisk + '/' + UTIL.getDateStamp() + '/' + createInfo.id + '.' + v.ext
    Object.assign(v,createInfo)
    createInfos.push(createInfo)
  })

  console.log('FILES:',files)
  
  await MYSQL(T).insert(files).returning('id')
 
  return createInfos
}

const AsyncCOSDeleteObject = async (option)=>{
  return new Promise((resolve,reject)=>{
    cOSClient.deleteObject(option,(err)=>{
      console.log("ERR:",option)
      if(err)
        resolve(err)
      else
        resolve()
    })
  })
}

o.deleteObjects = async (id_list, op) => {
  const result = id_list.map(v=>false)
  for(let i=0;i<id_list.length;i++)
  {
    let id = id_list[i]
    let file = await MYSQL(T).first("url").where('id',id)
    if(!file){
      result[i] = "FILE_NOT_FOUND"
      continue
    }
    let err = await AsyncCOSDeleteObject({Bucket:config.cos.fileBucket,Region:config.cos.region,
Key:"files/"+file.url})
console.log("DELETE:",err)
    if(err)
      result[i] = err
  }
  
  await MYSQL(T).whereIn('id',id_list).delete()
  return result
}


o.AuthCOS = ()=>{
    return COS.getAuthorization({
      SecretId: config.cos.SecretId,
      SecretKey: config.cos.SecretKey,
      Method: 'post',
      Expires: 60 * 24 *60,
      Query: {},
      Headers: {}
    })
}

module.exports = o