const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const moment = require('moment')
const o = {
  required: ['Type']
}
const Rss = require('./Rss')


// Database Initalization
const _TA = 'article'
const _TAC = 'article_category'
const _TC = 'comment'
const _TAGOOD = 'article_awesome'
const RSS_KEY = 'recommendation'

const DB = {}
DB.article = MYSQL.Create('article',t=>{
   t.uuid('id').primary()
   t.integer('article_type').defaultTo(0)
   t.string('title', 64).notNull()
   t.string('author', 16)
   t.text('content')
   t.datetime('created_at')
   t.uuid('created_by')
   t.text('files')
   t.integer('state').defaultTo(0)
})

DB.article_tag = MYSQL.Create('article_tag',t=>{
  t.increments('id').primary()
  t.uuid('article_id')
  t.string('tag',16)
})

DB.article_reply = MYSQL.Create('article_reply',t=>{
  t.uuid('id').primary()
  t.uuid('article_id')
  t.uuid('parent_id')
  t.uuid('created_by')
  t.datetime('created_at')
  t.text('content')
})

DB.article_readed = MYSQL.Create('article_readed',t=>{
   t.increments('id').primary()
  t.uuid('article_id')
  t.uuid('user_id')
})
let DB_platform = {}
DB_platform.article = DB.article

o.initdb = async (forced)=>{
 
  await MYSQL.Migrate(DB_platform, forced)

}

o.initdb_e = async (ent_id,forced)=>{
 
  await MYSQL.Migrate(DB, forced, ent_id)
}

o.query = async (state,queryCondition = {},ent_id)=>{
  let Q = DB.article.Query(ent_id).select('article.id', 'title', 'files','created_at','author','created_by','state')
  if(queryCondition.where){
    Q = Q.where(queryCondition.where)
  }
  let items = await Q
  return items
}

o.create = async (state,item,ent_id)=>{
   let Q = DB.article.Query(ent_id)
   let updateInfo = {
     id: UTIL.createUUID(),
     state:item.state || 0,
     created_by:state.id,
     created_at: UTIL.getTimeStamp()
   }
   Object.assign(item, updateInfo)
   await Q.insert(item)
   return updateInfo
}

o.get = async (state,id,ent_id)=>{
  let Q = DB.article.Query(ent_id)
  let item = await Q.first().where({id})
  return item 
}

o.patch = async (state,id,item,ent_id)=>{
   let Q = DB.article.Query(ent_id)
   let updateInfo = {
     updated_by: state.id,
     updated_at: U.getTimeStamp()
   }
   delete item.id
   Object.assign(item, updateInfo)
   await Q.update(item).where({id})
   return updateInfo
}

o.remove = async (state,id,ent_id)=>{
  let Q = DB.article.Query(ent_id)
  await Q.where({id}).delete()
}

o.rss = async (ctx = {}) => {
  let items = await o.query({cat:'Recommendation'},ctx)
  return items.map(v => ({
    id: v.id,
    title: v.title,
    date: moment(v.created_at).format('YYYY-MM-DD'),
    link: "/ent/articles/" + v.id

  }))
}
Rss.register(RSS_KEY, o.rss)

module.exports = o