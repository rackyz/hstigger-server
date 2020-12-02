const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Enterprise = require('./Enterprise')
const Type = require("./Type")
const Permission = require('./Permission')
const moment = require('moment')
const COS = require('cos-nodejs-sdk-v5')
const config = require('../base/config')
const {
  UserLogger
} = require('../base/logger')

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

o.GetFileUrl = async (id)=>{
  let file = await MYSQL(T).first(url).where({id})
  if(file)
    return file.url
  else
    throw EXCEPTION.E_INVALID_DATA //not exist
}

o.post = async (files,op)=>{
  let createInfos = []
  files.forEach(v=>{
    let createInfo = {}
    createInfo.created_by = op
    createInfo.created_at = UTIL.getTimeStamp()
    createInfo.id = UTIL.createUUID()
    createInfo.url = v.vdisk + '/' + UTIL.getDateStamp() + '/' + v.id + '.' + v.ext
    Object.assign(v,createInfo)
    createInfos.push(createInfo)
  })

  
  await MYSQL(T).insert(files).returning('id')
 
  return createInfos
}

o.deleteObjects = async (id_list, op) => {
  await MYSQL(T).whereIn('id',id_list).delete()
}


o.AuthCOS = ()=>{
    return COS.getAuthorization({
      SecretId: config.cos.SecretId,
      SecretKey: config.cos.SecretKey,
      Method: 'post',
      Expires: 60 * 24,
      Query: {},
      Headers: {}
    })
}

module.exports = o