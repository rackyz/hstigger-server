const util = {}
const uuid = require('uuid')
const crypto = require('crypto')
const moment = require('moment')
const jwt = require('jsonwebtoken')
const config = require('./config')
const MYSQL = require('./mysql')
const { table } = require('console')
// Module:ContextParser
// Description:
//  parsing request context
let ContextParser = {}

ContextParser.getIP = function (ctx) {
  let req = ctx.req
  let ip = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
  if (typeof ip == 'string' && ip.includes('ffff'))
    ip = ip.slice(7)
  return ip
}

ContextParser.getDevice = function (ctx) {
  return ctx.request.header['user-agent']
}

ContextParser.extractProp = (object, prop) => {
  let p = object[prop]
  delete object[prop]
  return p
}

ContextParser.filterByProps = (object, props = []) => {
  let r = {}
  props.forEach(v => {
    if (object[v] != undefined)
      r[v] = object[v]
  })
  return r
}

util.ContextParser = ContextParser


// Module:Generator
// Description:
//  generate specific or random value for given type
util.createUUID = () => {
  return uuid.v1()
}

util.getTimeStamp = () => moment().format('YYYY-MM-DD HH:mm:ss')
util.getDateStamp = () => moment().format('YYYY-MM-DD')
util.dateAddDays = (d, offset) => moment(d).add('days', offset).format('YYYY-MM-DD')


// util.Page
util.DEFAULT_PAGE_SIZE = 100



util.generateVerifyCode = () => {
  let result = ""
  for (let i = 0; i < 6; i++)
    result += (parseInt(9 * Math.random()) + 1)
  return result
}

const PHONE_REGX = /^((0\d{2,3}-\d{7,8})|(1[3584]\d{9}))$/;
util.test = (type, value) => {
  let result = false
  if (type == 'phone') {
    result = PHONE_REGX.test(value)
  }

  return result
}

util.encodeMD5 = (text) => {
  return crypto.createHash("md5").update(text).digest('hex')
}

util.maskPhone = phone => phone && phone.length == 11 ? (phone.slice(0, 3) + "****" + phone.slice(-4)) : '电话不合法'

util.encodeJWT = (data,expire_time=3600*24) =>{
  return jwt.sign(data, config.appSecret, {
    expiresIn: expire_time
  })
}

util.decodeJWT = async token=>{
  return new Promise((resolve) => {
    jwt.verify(token, config.appSecret, async (err, decoded) => {
      if (err) {
        resolve(false)
      } else {
        resolve(decoded)
      }
    })
  })
}


util.ArrayToObject = (arr,key,_cb)=>{
  let o = {}
  arr.forEach(v=>{
    o[v[key]] = _cb(v)
  })
  return o
}

util.updateCacheTime = async (key) => {
  // await mysql('cache').update({
  //     id: key,
  //     update: moment().toString()
  // })
}
util.checkCached = async (key, updateTime) => {
  // let cacheRecord = await mysql('cache').first('update').where('id', key)
  // if (cacheRecord && cacheRecord.update) {
  //     if (moment(updateTime).isAfter(cacheRecord.update) == false) {
  //         return true
  //     }
  // }

  return false
}





/**
 * DESC    : Create a basic common proxy interface with validators
 * METHODS : POST/PATCH/DELETE/GET(list,item)
 * NOTE    : You can inherit from this basic class with .extend methods
 * @param {*} knex 
 * @param {*} proxy 
 * @param {*} config
 *   config.prefix    (default=proxy)
 *      prefix of id (used by util.createId)
 *   config.list
 *   config.get
 *      each method configuration
 *   {
 *      .columns
 *      .formatter(dataItem)=>dataItemFormatted
 *      .extend(ctx, query) => queryExtended *
          you can use this function to extend get query by ctx
 *   }
 *   config.post
 *   config.patch
 *   {
 *      validator(dataItem) => dataItemValidated throw (Invalid Data)
 *   }
 */
util.CreateRestfulController = (knex, proxy, config) => {
  const List = async (ctx) => {
    // if (ctx.params.cachedtime && util.checkCached(ctx.params.cacheTime)){
    //     return "cached"
    // }

    let query = knex(proxy)
    if (config && config.list && config.list.extend) {
      query = config.list.extend(ctx, query)
    }
    let res = await query
    if (config && config.list && config.list.formatter)
      res = config.list.formatter(res)
    return res
  }

  const Post = async (ctx) => {
    let dataItem = ctx.request.body
    let now = moment().format()
    if (config && config.post && config.post.validator)
      dataItem = config.post.validator(dataItem)

    if (config.autosign) {
      dataItem.inputor = ctx.state.id
      dataItem.inputTime = now
    }

    await knex(proxy).insert(dataItem)
    //await util.updateCacheTime(proxy)
    if (config.autosign) {
      return {
        [idkey]: dataItem[idkey],
        inputor: dataItem.inputor,
        inputTime: dataItem.inputTime
      }
    }
    return dataItem.id
  }

  const Get = async (ctx) => {
    let dataId = ctx.params.id
    if (!dataId) {
      throw ("对象ID为丢失")
    }
    let idkey = config.idkey || "id"
    let query = knex(proxy).first().where({
      [idkey]: dataId
    })
    if (config.get && config.get.extend) {
      query = config.get.extend(ctx, query)
    }
    let res = await query
    if (config && config.get && config.get.formatter)
      res = config.get.formatter(res)
    return res
  }

  const Patch = async (ctx) => {
    let dataId = ctx.params.id
    let idkey = config.idkey || "id"
    if (!dataId) {
      throw ("对象ID为丢失")
    }
    let dataItem = ctx.request.body
    if (config && config.patch && config.patch.validator)
      dataItem = config.patch.validator(dataItem)

    let now = moment().format()
    if (config.autosign) {
      dataItem.updator = ctx.state.id
      dataItem.updateTime = now
    }

    await knex(proxy).update(dataItem).where({
      [idkey]: dataId
    })
    //await util.updateCacheTime(proxy)

    return {
      updateTime: now
    }
  }

  const Delete = async (ctx) => {
    let dataId = ctx.params.id
    let idkey = config.idkey || "id"
    if (!dataId) {
      throw ("对象ID为丢失")
    }
    await knex(proxy).where({
      [idkey]: dataId
    }).del()
    //await util.updateCacheTime(proxy)
  }

  return {
    List: config.List ? config.List(knex) : List,
    Post: config.Post ? config.Post(knex) : Post,
    Patch: config.Patch ? config.Patch(knex) : Patch,
    Delete: config.Delete ? config.Delete(knex) : Delete,
    Get: (config.Get ? config.Get(knex) : Get),
    Related: config.Related,
    AddRelated: config.AddRelated,
    PatchRelated: config.PatchRelated,
    DelRelated: config.DelRelated
  }
}

util.hasTable = async (MYSQL,table_name,ent_schema)=>{
  let res = null
  if(ent_schema){
    res = await MYSQL.raw(`select TABLE_NAME from information_schema.TABLES where TABLE_NAME = '${table_name}' and TABLE_SCHEMA = '${ent_schema}'`)
    if(Array.isArray(res) && Array.isArray(res[0]))
      res = res[0][0]
    else
      res = false
  }
  else
    res = await MYSQL.schema.hasTable(table_name)
  if(res)
    return true
  else
    return false
}

util.getEnterpriseSchemeName = ent_id => {
  return 'ENT_' + ent_id.replace(/(\-)/g, '_')
}

util.initdb = async (MYSQL, table_name, initializer, forced, ent_id) => {
  let ent_schema = ent_id?util.getEnterpriseSchemeName(ent_id):null
  let Schema = ent_schema ? MYSQL.schema.withSchema(ent_schema) : MYSQL.schema
  let isExist = await util.hasTable(MYSQL,table_name,ent_schema)
  
  if (isExist) {
    if (!forced)
      return
    await Schema.dropTableIfExists(table_name)
    // console.log("drop",table_name)
  }

  await Schema.createTable(table_name, initializer)
  console.log(` [model-db] -- created table (${table_name}))`)
}

util.initdb_e = async (MYSQL, table_name, initializer, forced, ent_id) => {
  let ent_schema = getEnterpriseSchemeName(ent_id)
  let Schema = ent_schema ? MYSQL.schema.withSchema(ent_schema) : MYSQL.schema
  let isExist = await util.hasTable(MYSQL, table_name, ent_schema)

  if (isExist) {
    if (!forced)
      return
    await Schema.dropTableIfExists(table_name)
    // console.log("drop",table_name)
  }

  await Schema.createTable(table_name, initializer)
  console.log(` [model-db] -- created table (${table_name}))`)
}

util.seeds = async (MYSQL, table_name, items, forced, ent_schema) => {
  let Schema = ent_schema ? MYSQL.withSchema(ent_schema) : MYSQL
  if (forced) {
    await Schema(table_name).del()
    await Schema(table_name).insert(items)
    console.log("[model-db] -- seeds:",table_name,items.length)
  }
}

module.exports = util