const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Enterprise = require('./Enterprise')
const Type = require("./Type")
const Permission = require('./Permission')
const Rss = require('./Rss')
const moment = require('moment')
const {
  UserLogger
} = require('../base/logger')

let o = {
   required: ['Type','Rss']  
}

// -- PLATFORM
const T_NOTICE = 'notice'
const RSS_KEY = 'notice'
const NOTICE_TYPES = ['紧急通知','系统公告','营销活动']
const CONTENT_TYPES = ['TXT','HTML','MD']
o.initdb = async (forced) => {
    
      if (forced) {
        await Type.AddType('NOTICE_TYPE', NOTICE_TYPES)
        await Type.AddType('CONTENT_TYPE', CONTENT_TYPES)
      }

      await MYSQL.initdb(T_NOTICE, t => {
            t.increments('id').index()
            t.string('title',64).notNull()
            t.text('content').defaultTo("")
            t.integer('content_type').defaultTo(0)
            t.text('files').defaultTo("")
          
            t.boolean('private').defaultTo(false)
            t.uuid('created_by')
            t.datetime('created_at')
      },forced)

      const initData = [{
        title:"欢迎体验NEIP企业信息平台",
        content:"## 个人用户\n 用户名: **test** 密码: **test** \n ## 企业用户 \n 宁波高专 用户名密码均为 **nbgz** \n 江北开投 用户密码为 **jbkt** \n ## 平台管理: \n 用户名密码为: **root** \n 感谢您的提出宝贵的意见",
        content_type:2,
        created_at:UTIL.getTimeStamp()
      }]

      await MYSQL.seeds(T_NOTICE, initData, forced)

      if(forced){
        await Rss.create({
          id: RSS_KEY,
          name:"ENIP平台通知公告",
          source_type:1,
          link:'/notices',
          subject_type:2,
          media_type:2
        })
      }
}


o.list = async ()=>{
  let items = await MYSQL(T_NOTICE).select('id','title','created_by','created_at')
  return items
}

o.post = async (item,op)=>{
  let createInfo = {
    created_at : UTIL.getTimeStamp(),
    created_by : op
  }
  let id = await MYSQL(T_NOTICE).insert(item).returning('id')
  createInfo.id = id
  return createInfo
}

o.patch = async (id,item,op)=>{
  await MYSQL(T_NOTICE).update(item).where({id})
}

o.deleteObjects = async (id_list, op) => {
  await MYSQL(T_NOTICE).whereIn("id",id_list).del()
} 

o.get = async id=>{
  let item = await MYSQL(T_NOTICE).first().where({id})
  return item 
}

o.rss = async ()=>{
  let items = await o.list()
  return items.map(v=>({
  id:v.id,
  title:v.title,
  date:moment(v.created_at).format('YYYY-MM-DD'),
  link:"/notices/"+v.id

  }))
}
Rss.register(RSS_KEY, o.rss)


module.exports = o












module.exports = o