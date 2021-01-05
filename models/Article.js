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

o.initdb = async (forced) => {

  await MYSQL.initdb(_TA, t => {
    t.uuid('id').index()
    t.string('title', 64).notNull()
    t.string('author', 16).notNull()
    t.text('content')
    t.datetime('created_at')
    t.uuid('created_by')
  }, forced)

  await MYSQL.initdb(_TAC, t => {
    t.integer('id').index()
    t.uuid('article_id').notNull()
    t.integer('cat_id').notNull()
  }, forced)

  await MYSQL.initdb(_TC,t=>{
    t.increments('id').index().primary()
    t.integer('parent_id')
    t.text('content')
    t.uuid('created_by')
    t.datetime('created_at')
  })

  await MYSQL.initdb(_TAGOOD,t=>{
    t.increments('id').index().primary()
    t.uuid('user_id')
    t.uuid('article_id')
  })


}

o.query = async (option,ctx = {})=>{
  let SQL = ctx.ent_id?MYSQL.E(ctx.ent_id,_TA):MYSQL(_TA)
  let items = await SQL.select('article.id', 'title', 'created_at').where('cat_id', 56).leftJoin(_TAC,'article_id','article.id')
  return [{id:1,title:'测试文章'}]
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