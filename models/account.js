const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const o = {}

// Database Initalization
const TABLE_ACCOUNT = 'account'

o.initdb = async (forced) => {
  await MYSQL.initdb(TABLE_ACCOUNT, t => {
    t.integer('id').index()
    t.string('from', 32).notNull()
    t.string('to', 32).notNull()
    t.text('content')
    t.datetime('created_at')
  }, forced)

  await MYSQL.schema.raw(`ALTER TABLE ${TABLE_ACCOUNT} AUTO_INCREMENT=1000`)

}





module.exports = o