const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const Message = {
  required: ['Type']
}

const _TA = 'article'
Message.initdb = async (forced) => {

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

  await MYSQL.initdb(_TCMT, t => {
    t.increments('id').index().primary()
    t.text('content')
    t.uuid('created_by')
    t.datetime('created_at')
  })

  await MYSQL.initdb(_TAGOOD, t => {
    t.increments('id').index().primary()
    t.uuid('user_id')
    t.uuid('article_id')
  })

}
