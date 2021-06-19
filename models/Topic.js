const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Type = require('./Type')
const Dynamic = require('./Dynamic')
const { update } = require('./TrainingClass')

let DB = {}
DB.topic = MYSQL.Create('topic',t=>{
  t.increments('id').primary()
  t.string('title',32)
  t.uuid('project_id')
  t.uuid('module_id')
  t.text('content')
  t.datetime('created_at')
  t.uuid('created_by')
  t.datetime('updated_at')
  t.uuid('updated_by')
  t.datetime('replyed_at')
  t.uuid('replyed_by')
  t.integer('readed_count').defaultTo(0)
  t.integer('reply_count').defaultTo(0)
  t.integer('good_count').defaultTo(0)
})

DB.reply = MYSQL.Create('reply',t=>{
  t.increments('id').primary()
  t.integer('topic_id')
  t.integer('parent_id')
  t.text('content')
  t.datetime('created_at')
  t.uuid('created_by')
  t.datetime('updated_at')
  t.uuid('updated_by')
  t.integer('readed_count').defaultTo(0)
  t.integer('reply_count').defaultTo(0)
})
let o = {
  initdb_e:async (ent_id,forced)=>{
    await MYSQL.Migrate(DB,forced,ent_id)
  },
  query:async (state,condition={})=>{
    let queryTopics = DB.topic.Query(state.enterprise_id)
    queryTopics = queryTopics.select('id','title','created_at','created_by','replyed_at','replyed_by','readed_count','reply_count','good_count')
    MYSQL.ParseCondition(queryTopics,condition)
    let items = await queryTopics
    return items
  },
  create:async (state,item)=>{
    let queryCreateTopic = DB.topic.Query(state.enterprise_id)
    let updateInfo = {
      created_at:UTIL.getTimeStamp(),
      created_by:state.id,
    }
    Object.assign(item,updateInfo)
    let id = await queryCreateTopic.insert(item).returning('id')
    updateInfo.id = id
    await Dynamic.write(state,{
      project_id:item.project_id,
      content:"创建了话题-"+item.title
    })
    return updateInfo
  },
  get:async (state,id)=>{
    let queryTopic = DB.topic.Query(state.enterprise_id)
    let queryReply = DB.reply.Query(state.enterprise_id)
    let item = await queryTopic.first().where({
      id
    })
    item.replys = await queryReply.where({topic_id:id}).orderBy('created_at','desc')
    return item
  },
  remove:async (state,id)=>{
    let queryTopic = DB.topic.Query(state.enterprise_id)
    let queryReply = DB.reply.Query(state.enterprise_id)
    await queryTopic.where({id}).del()
    await queryReply.where({topic_id:id}).del()
  },
  update:async (state,id,item)=>{
    let queryTopic = DB.topic.Query(state.enterprise_id)
    let updateInfo = {
      updated_at: UTIL.getTimeStamp(),
      updated_by: state.id,
    }
     Object.assign(item, updateInfo)
     await queryTopic.update(item).where({
       id
     })
     return updateInfo
  },
  reply:async(state,id,item)=>{
    let queryReply = DB.reply.Query(state.enterprise_id)
    let updateInfo = {
       created_at: UTIL.getTimeStamp(),
         created_by: state.id,
         topic_id:id
    }
     Object.assign(item, updateInfo)
    let reply_id = await queryReply.insert(item).returning('id')
    updateInfo.id = reply_id

    let queryReplyCount = DB.reply.Query(state.enterprise_id)
    let resCount = await queryReplyCount.count('id as c').where({topic_id:id})
    let c = resCount[0].c
    let queryUpdateCount = DB.topic.Query(state.enterprise_id)
    await queryUpdateCount.update({reply_count:c}).where({id})
    return updateInfo
  },
  removeReply:async(state,id)=>{
     let queryReply = DB.reply.Query(state.enterprise_id)
     await queryReply.where({id}).del()
     let queryReplyCount = DB.reply.Query(state.enterprise_id)
     let resCount = await queryReplyCount.count('id as c').where({
       topic_id: id
     })
     let c = resCount[0].c
  
     let queryUpdateCount = DB.topic.Query(state.enterprise_id)
     await queryUpdateCount.update({reply_count:c}).where({
       id
     })
  }

}



module.exports = o