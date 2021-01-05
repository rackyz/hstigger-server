const UTIL = require('../base/util')
const REDIS = require('../base/redis')
//const MYSQL = require('../base/mysql')
const EXCEPTION = require('../base/exception')
const TYPE = require('./Type')
const MYSQL = require('../base/mysql')
const { UserLogger } = require('../base/logger')
const o = {
  required: ['Type']
}

const Spiders = require('../spiders')
const T_RSS = "rss"
const RSS_SOURCE_TYPES = ['爬虫','平台接口','企业接口','部门接口','RSS源']
const RSS_SUBJECT_TYPES = ['建筑','造价','前端开发','后端开发']
const RSS_MEDIA_TYPES = ['news','picnews','articles','projects']

o.initdb = async (forced)=>{
 
  if(forced){
    await TYPE.AddType('RSS_SOURCE_TYPE',RSS_SOURCE_TYPES)
    await TYPE.AddType('RSS_SUBJECT_TYPE',RSS_SUBJECT_TYPES)
    await TYPE.AddType('RSS_MEDIA_TYPE',RSS_MEDIA_TYPES)

  }

  await MYSQL.initdb(T_RSS,t=>{
    t.string('id',64).index();
    t.string('name',64);
    t.integer('source_type').defaultTo(0);
    t.string('link',128)
    t.integer('subject_type').defaultTo(0);
    t.integer('media_type').defaultTo(0);
    t.integer('state').defaultTo(0)
    t.string('more',128)
    t.string('created_by',64);
   
    t.datetime('created_at');
  },forced)
  await MYSQL.seeds(T_RSS, Spiders.initData, forced)
}
let PlatformRSS = {}
o.register = (key,cb)=>{
  PlatformRSS[key] = cb
}

o.get = async (key,extra)=>{
  let rss = await MYSQL(T_RSS).first('source_type').where('id',key)
  if(!rss)
    throw EXCEPTION.E_INVALID_RSS_KEY
  if(rss.source_type == 0)
    return await Spiders.get(key)
  else if(rss.source_type == 1){
    let handler = PlatformRSS[key]
    if(!handler)
      throw EXCEPTION.E_INVALID_RSS_KEY
    
    return await handler()
  }
  else if(rss.source_type == 2){
    let ent_id = extra
    if(!ent_id)
      throw EXCEPTION.E_INVALID_DATA
    
      let handler = PlatformRSS[key]
      if (!handler)
        throw EXCEPTION.E_INVALID_RSS_KEY
    return await handler(ent_id)
  }else if(rss.source_type == 3){
    let {ent_id,dep_id} = extra
    if (!ent_id || !dep_id)
      throw EXCEPTION.E_INVALID_DATA

      let handler = PlatformRSS[key]
      if (!handler)
        throw EXCEPTION.E_INVALID_RSS_KEY
    return await handler(ent_id, dep_id)
  }
}




o.list = async ()=>{
  let items = await MYSQL(T_RSS)
  return items
}

o.create = async (item,op)=>{
  // validate
  let createInfo = {
    created_at:UTIL.getTimeStamp(),
    created_by:op
  }
  Object.assign(item,createInfo)
  await MYSQL(T_RSS).insert(item)
  UserLogger.info(`${op}创建了RSS源${item.name}`)
  return createInfo
}

o.patch = async (id,item,op)=>{
  if(!id || !item || !op)
    throw EXCEPTION.E_INVALID_DATA
  
  await MYSQL(T_RSS).update(item).where({id})
}

o.deleteObjects = async (id_list,op)=>{
  if(!Array.isArray(id_list) || id_list.length == 0)
    throw EXCEPTION.E_INVALID_DATA
  await MYSQL(T_RSS).whereIn('id',id_list).del()
}

o.deleteObjects = async (id_list,op)=>{
  if(!Array.isArray(id_list) || id_list.length == 0)
    throw EXCEPTION.E_INVALID_DATA
  await MYSQL(T_RSS).whereIn('id',id_list).del()
}


/// USER LEVEL


module.exports = o