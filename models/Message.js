
const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const {sendSMS} = require('../libs/qsms')
const Message = {
  required:['Type']
}


// Database Initalization
const TABLE_MESSAGE = 'message'
const TABLE_MESSAGE_READED = 'message_user_read'

Message.initdb = async (forced)=>{
 
  await MYSQL.initdb(TABLE_MESSAGE,t=>{
      t.increments('id').index()
      t.string('from', 64).notNull()
      t.string('to',64).notNull()
      t.text('content')
      t.datetime('created_at')
    },forced)

  await MYSQL.initdb(TABLE_MESSAGE_READED, t => {
     t.integer('id').index()
     t.string('user_id',64).notNull()
     t.integer('message_id').notNull()
     t.datetime('read_at')
   }, forced)

   if(forced){
     await MYSQL(TABLE_MESSAGE).del()
   }

}


// Methods
Message.Create = async (from, to, content) => {
  await MYSQL(TABLE_MESSAGE).insert({
    from,
    to,
    content,
    created_at: UTIL.getTimeStamp(),
  })
}

Message.getUnreadMessageCount = async (user_id)=>{
  let items = await MYSQL(TABLE_MESSAGE).select(`${TABLE_MESSAGE}.id`).leftOuterJoin(TABLE_MESSAGE_READED,`${TABLE_MESSAGE}.id`,'message_id').where({user_id}).where(`${TABLE_MESSAGE_READED}.id`,null)
  return items.length
}

Message.sendSMS = sendSMS
module.exports = Message