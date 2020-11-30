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

const T_RSS = "rss"
const RSS_SOURCE_TYPES = ['爬虫','平台接口','企业接口','部门接口','RSS源']
const RSS_SUBJECT_TYPES = ['建筑','造价','前端开发','后端开发']
const RSS_CONTENT_TYPES = ['新闻动态','图片新闻','政策','知识文章','项目']
const RSS_MEDIA_TYPES = ['news','picnews','articles','projects']
const NBFJ_PIC_NEWS = {
  id:UTIL.createUUID(),
  name: "宁波市房建局官网 - 图片新闻",
  source_type: 0,
  subject_type:0,
  content_type: 1,
  media_type: 1,
  state: 1,
  created_at: UTIL.getTimeStamp()
}

const NBFJ_NEWS = {
  id:UTIL.createUUID(),
  name: "宁波市房建局官网 - 行业动态",
  source_type: 0,
  subject_type:0,
  content_type: 0,
  media_type: 0,
  state: 1,
  created_at: UTIL.getTimeStamp()
}
o.initdb = async (forced)=>{
  if(forced){
    await TYPE.AddType('RSS_SOURCE_TYPE',RSS_SOURCE_TYPES)
    await TYPE.AddType('RSS_SUBJECT_TYPE',RSS_SUBJECT_TYPES)
    await TYPE.AddType('RSS_CONTENT_TYPE',RSS_CONTENT_TYPES)
    await TYPE.AddType('RSS_MEDIA_TYPE',RSS_MEDIA_TYPES)

  }

  await MYSQL.initdb(T_RSS,t=>{
    t.string('id',64).index();
    t.string('name',64);
    t.integer('source_type').defaultTo(0);
    t.integer('subject_type').defaultTo(0);
    t.integer('content_type').defaultTo(0);
    t.integer('media_type').defaultTo(0);
    t.integer('state').defaultTo(0)

    t.string('created_by',64);
   
    t.datetime('created_at');
   

  },forced)

  await MYSQL.seeds(T_RSS,[NBFJ_PIC_NEWS,NBFJ_NEWS],forced)


}


o.list = async ()=>{
  let items = await MYSQL(T_RSS)
  return items
}

o.create = async (item,op)=>{
  // validate
  let createInfo = {
    id:UTIL.createUUID,
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


module.exports = o