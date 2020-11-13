
const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const sms = require('../libs/qsms')
const Message = {}

// Database Initalization
const TABLE_MESSAGE = 'message'
const TABLE_MESSAGE_USER = 'message_user'

Message.initdb = async (forced)=>{
  await MYSQL.initdb(TABLE_MESSAGE,t=>{
      t.integer('id').index()
      t.string('from', 32).notNull()
      t.string('to',32).notNull()
      t.text('content')
      t.datetime('created_at')
    },forced)

  await MYSQL.initdb(TABLE_MESSAGE_USER, t => {
     t.integer('id').index()
     t.string('user_id',32).notNull()
     t.integer('message_id').notNull()
   }, forced)
}


// Methods
Message.Create = async (from, to, content) => {
  await mysql('message').insert({
    from,
    to,
    content,
    created_at: utils.getTimeStamp(),
  })
}


Message.sendSMS = sms.sendSMS

module.exports = Message