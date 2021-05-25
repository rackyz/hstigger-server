
const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const Type = require('./Type')
const _ = require('lodash')
const {sendSMS} = require('../libs/qsms')
const Message = {
  required:['Type']
}


const DB = {}
let MESSAGE_TYPE = null
DB.message = MYSQL.Create('message',t=>{
    t.increments('id').index()
    t.integer('msg_type').defaultTo(1)
    // 1 - 系统消息
    // 2 - 企业通知
    // 3 - 部门消息
    // 4 - 项目部
    // 5 - 站内信
    t.integer('content_type').defaultTo(0)
    // 0 - text
    // 1 - md
    // 2 - html
    t.string('title',128)
    t.uuid('group_id')
    t.boolean('hurry').defaultTo(false)
    t.boolean('enable_readed').defaultTo(false)
    t.boolean('enable_list').defaultTo(false)
    t.text('content').defaultTo("")
    t.uuid('created_by')
    t.datetime('created_at')
})

DB.message_user_readed = MYSQL.Create('message_user_readed',t=>{
    t.increments('id').index()
    t.string('user_id', 64).notNull()
    t.integer('message_id').notNull()
    t.datetime('readed_at')
})

// Database Initalization
const TABLE_MESSAGE = 'message'
const TABLE_MESSAGE_READED = 'message_user_readed'

Message.initdb = async (forced)=>{
  
  await MYSQL.Migrate(DB,forced)
  MESSAGE_TYPE = await Type.AddType('MESSAGE_TYPE',['系统消息','企业通知','部门消息','项目部通知','站内信'])
}

Message.initdb_e = async (ent_id, forced) => {
  
  await MYSQL.Migrate(DB,forced,ent_id)
}

Message.getCategoryedMessageCount = async (user_id,ent_id)=>{
  let Query = Db.message.Query(ent_id)
  let readed = Query.select('message.id','msg_type','readed_at').leftOuterJoin('message_user_readed', 'message.id','message_id')
  return readed
}

Message.list = async (state,condition = {})=>{
  let Query = DB.message.Query(ent_id)
  Query = MYSQL.ParseCondition(Query,condition)
  let items = await Query
  return items
}

Message.listMine = async (state,condition = {})=>{
  let ent_id = state.enterprise_id
  let QueryMessage = DB.message_user_readed.Query(ent_id).distinct('message.id').select('readed_at', 'message.*').leftOuterJoin('message', 'message.id','message_user_readed.message_id').where({
    user_id: state.id
  }).whereNotNull('message.id')
  MYSQL.ParseCondition(QueryMessage, condition)
  let messages = await QueryMessage.orderBy('created_at','desc')
  return messages
}

Message.listMineUnreadCount = async (state, showDetail=false)=>{
  let ent_id = state.enterprise_id
  let QueryCategory = DB.message_user_readed.Query(ent_id).distinct('message.id').select('message.msg_type').leftOuterJoin('message', 'message.id', 'message_user_readed.message_id').where({
    user_id: state.id
  }).whereNull('readed_at').whereNotNull('message.id')
  let items = await QueryCategory
  if (showDetail) {
    let counts = [items.length]
    const msg_types = [0, 1, 2, 3, 4, 5]
    msg_types.forEach(v => {
      counts.push(items.filter(m => m.msg_type == v).length)
    })
    return counts
  }else{
    return items.length
  }
}

Message.get = async (state,id,ent_id)=>{
  let Query = DB.message.Query(ent_id)
  let item = await Query.first("message.*","readed_at").leftOuterJoin('message_user_readed','message_id','message.id').where({user_id:state.id,"message.id":id})

  await Message.mark_readed(state,[id],ent_id)
  let QueryPrev = DB.message_user_readed.Query(ent_id)
  let QueryNext = DB.message_user_readed.Query(ent_id)
  let prev = await QueryPrev.first('message_id').where("message_id", "<", id).where({user_id:state.id}).orderBy("message_id", "desc").limit(1)
  let next = await QueryNext.first('message_id').where("message_id", ">", id).where({
    user_id: state.id
  }).orderBy("message_id").limit(1)
  if(item){
    if(prev)
      item.prev = prev.message_id
    if(next)
      item.next = next.message_id
    return item
  }
  
  throw "消息不存在"
}

Message.mark_readed = async (state,id_list,ent_id)=>{
  let Query = DB.message_user_readed.Query(ent_id)
  Query = Query.update({readed_at:UTIL.getTimeStamp()}).where('user_id',state.id)
  if (id_list && id_list.length == 0)
    Query = Query.whereIn('message_id', id_list)
  await Query
  return
}

Message.create = async (state,data,ent_id)=>{
  if (!ent_id)
    return
  let Query = DB.message.Query(ent_id)
  let updateInfo = {
    created_by:state.id,
    created_at:UTIL.getTimeStamp()
  }
  let to = data.to
  delete data.to
  if(data.dep_id || data.project_id){
    data.group_id = data.dep_id || data.project_id
    delete data.dep_id
    delete data.project_id
  }
  
  Query = Query.insert(Object.assign(data,updateInfo)).returning('id')
  let message_id = await Query
  if(!to)
    throw 'UNEXPECTED MESSAGE SENDER - 不合法的接收者'
  else if(!Array.isArray(to))
    to = [to]


    let QueryCreateMessageRecevier = DB.message_user_readed.Query(ent_id)
    let user_list = []
    for(let i=0;i<to.length;i++){
      let v = to[i]
      // find from user
      let exist = await MYSQL('account_enterprise').first('id').where({
        user_id: v,
        enterprise_id: ent_id
      })
      if (!exist) {
        let groupUsers = await MYSQL.E(ent_id, 'dep_employee').select('id').where({
          dep_id: v
        })

        // if (groupUsers.length == 0) {
        //   groupUsers = await MYSQL.E(ent_id, 'employee_project').select('id').where({
        //     dep_id: v
        //   })
        // }

        if (groupUsers.length > 0)
          user_list = user.list.concat(groupUsers.map(v => v.id))

      } else {
        user_list.push(v)
      }
    
    _.uniqBy(user_list, e => e)
   
    await QueryCreateMessageRecevier.insert(user_list.map(v=>{
      return {
        user_id:v,
        message_id
      }
    }))
  }
  updateInfo.id = message_id
  return updateInfo
}

Message.removeList = async (state,id_list=[],ent_id)=>{
  if(!Array.isArray(id_list) || id_list.length == 0)
    throw "未选择消息进行删除"
  let Query = DB.message_user_readed.Query(ent_id)
  return await Query.where({user_id:state.id}).whereIn('message_id',id_list).del()
}


Message.removeMessageEntity = async (state,id,ent_id)=>{
  let Query = DB.message.Query(ent_id)
  let QueryRemoveUser = DB.message_user_readed.Query(ent_id)
  await Query.where({
    id
  }).del()
  await QueryRemoveUser.where({message_id:id}).del()
}

Message.SendMessage = async (to,title,content,ent_id)=>{
  await Message.create({
    id: 'NBGZ' //system_id
  },{
    to,
    msg_type:MESSAGE_TYPE.系统消息,
    content_type:Type.TEXT_CONT_TYPE.md,
    title,
    content,
    created_by:'NBGZ',
    created_at:UTIL.getTimeStamp()
  },ent_id)
}


Message.getUnreadMessageCount = async (user_id)=>{
  let items = await MYSQL(TABLE_MESSAGE).select(`${TABLE_MESSAGE}.id`).leftOuterJoin(TABLE_MESSAGE_READED,`${TABLE_MESSAGE}.id`,'message_id').where({user_id}).where(`${TABLE_MESSAGE_READED}.id`,null)
  return items.length
}

Message.FixData = async (state)=>{
 // removed distinct and unlinked message relation 
}

Message.sendSMS = sendSMS
module.exports = Message