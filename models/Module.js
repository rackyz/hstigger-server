const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Enterprise = require('./Enterprise')
const Type = require("./Type")
const Permission = require('./Permission')
const { UserLogger } = require('../base/logger')
let o = {
  required: ["Type"]
}

// Database Initalization
const T_MODULE = 'module'
const T_ACCOUNT = "account"
const T_ENTERPRISE_MODULE = "enterprise_module"

const MODULE_TYPE = {
  COMMON:1,
  ADMIN:2,
  OPERATION:3,
  SYSTEM:4,
  FINANCE:5
}

const MODULE_LEVEL = ['体验级', '用户级', '企业级','企业管理','平台管理']
const TIMESTAMP = UTIL.getTimeStamp()
const initData = [{
   id: UTIL.createUUID(),
  key:"TASK",
  name:'计划任务',
  url:"/core/task",
  desc:"计划任务端口",
  type: MODULE_TYPE.COMMON,
  created_at: TIMESTAMP
},
{
   id: UTIL.createUUID(),
  key: "APPRIAISAL",
  name: "年终考核(汇总)",
  state:1,
  desc: "企业员工年终总结及考核评分",
  url: "/core/appraisal",
  type: MODULE_TYPE.ADMIN,
  private: true,
  level: 2,
  created_at: TIMESTAMP
},
{
   id: UTIL.createUUID(),
  key: "OPERATION",
  name:"经营状况",
  desc: "企业合约管理，产值、成本统计分析",
  url:"/core/bi/panel",
  type: MODULE_TYPE.OPERATION,
  
 private:true,
 level: 2,
 created_at: TIMESTAMP
},
{
   id: UTIL.createUUID(),
  key:"EADMIN",
  desc:"企业的管理后台",
  name: "企业后台",
  url:"/core/eadmin/",
  type: MODULE_TYPE.SYSTEM,
   level: 3,
   created_at: TIMESTAMP
},{
  id:UTIL.createUUID(),
  key: "ADMIN",
  name:"NEIP管理",
   desc: "NEIP平台的管理后台",
  url:"/core/admin",
  type: MODULE_TYPE.SYSTEM,
   level: 4,
   created_at: TIMESTAMP
}]

o.initdb = async (forced) => {
 
  if(forced){
    await Type.AddType('AccessLevel', MODULE_LEVEL)
    await Type.AddType('ModuleType', [{
      key: "COMMON",
      name: "通用模块",
      value: MODULE_TYPE.COMMON,
      icon: "supervisor",
      color: "rgb(51, 153, 255)",
    }, {
      key: "ENT_ADMIN",
      name: "企业行政",
      value: MODULE_TYPE.ADMIN,
      icon: "pm2",
      color: "rgb(51, 153, 255)"
    }, {
      key: "OEPRATION",
      name: "企业经营",
      value: MODULE_TYPE.OPERATION,
      icon: "pm2",
      color: "rgb(51, 153, 255)",
    }, {
      key: "FINANCE",
      name: "企业财务",
      value: MODULE_TYPE.FINANCE,
      icon: "pm2",
      color: "rgb(51, 153, 255)"
    }, {
      key: "SYSTEM",
      name: "系统模块",
      value: MODULE_TYPE.SYSTEM,
      icon: "parameter",
      color: "yellowgreen"
    }])

    await Type.AddType('ModuleState', [{
      key: "DEV",
      name: "研发中",
      color:"#aaa",
      value: 0
    }, {
      key: "TEST",
      color:"orange",
      name: "测试版",
      value: 1
    }, {
      key: "ONLINE",
      color:"yellowgreen",
      name: "正式版",
      value: 2
    }, {
      key: "LOCKED",
      color:"darkred",
      name: "禁用",
      value: 3
    }])
  }
  

  await MYSQL.initdb(T_MODULE, t => {
    t.uuid('id').index()
    t.string("key",32).index().unique()
    t.integer('parent_id')
    t.string('name', 64).notNull()
    t.string('desc',64)
    t.integer('state').defaultTo(0)
    t.integer('type').defaultTo(0)
    t.integer('level').defaultTo(0)
    t.string('version').defaultTo("1.0.0")
    // 定制版
    t.boolean('private').defaultTo(false)
    t.string('url',128)
    t.datetime('created_at')
    t.uuid('created_by')

  }, forced)

  await MYSQL.initdb(T_ENTERPRISE_MODULE,t=>{
    t.increments('id').index()
    t.uuid("ent_id").notNull()
    t.uuid("mod_id").notNull()
  },forced)

  await MYSQL.seeds(T_MODULE, initData, forced)

}

// Admin-LEVEL


o.getModules = async ()=>{
  let res = await MYSQL(T_MODULE).where('parent_id',null)
  return res
}

// EADMIN LEVEL
o.getEntModules = async ()=>{
  let res = await MYSQL(T_MODULE).where('level',4)
  // private 
  return res
}



// User-LEVEL
const pred_ids = [
  //房建：章建良 李增义 汤海平
  'ed4a8300-3b83-11eb-8e1e-c15d5c7db744',
  'ed4a34b4-3b83-11eb-8e1e-c15d5c7db744',
  'b8cabcb0-4014-11eb-813c-c1c9b9ee54e7',
  //市政： 王勤轰 玄先涛 庄辉
  'ed4a5be7-3b83-11eb-8e1e-c15d5c7db744',
  'ed4a5c0b-3b83-11eb-8e1e-c15d5c7db744',
   'ed4a82f9-3b83-11eb-8e1e-c15d5c7db744',
   //管理： 顾震 刘勇 吴献国
   'ed49e6d0-3b83-11eb-8e1e-c15d5c7db744', 
   'ed4a34be-3b83-11eb-8e1e-c15d5c7db744', 
   'ed4a5bf7-3b83-11eb-8e1e-c15d5c7db744',
   // 装修
   'ed4a82fb-3b83-11eb-8e1e-c15d5c7db744',
   // 造价 钱敏
   'ed4a8301-3b83-11eb-8e1e-c15d5c7db744',
   // 詹
   'ed49e690-3b83-11eb-8e1e-c15d5c7db744',
   'ed49e6c5-3b83-11eb-8e1e-c15d5c7db744',
   'ed49e6c7-3b83-11eb-8e1e-c15d5c7db744',
   'ed49e6a3-3b83-11eb-8e1e-c15d5c7db744',
   'ed49e6a9-3b83-11eb-8e1e-c15d5c7db744'

]
// @DESC: Get Authed Modules from User/Enterprise Privillege
//        1 - Get All public modules
//        2 - filter by levels(USER level <= MoD_level)
//        3 - ent_mode:
//            public modules filter by level
//            private modules filter by enterprise_previllege && uservilledge
o.getAuthedModules = async (user_id,ent_id,isEntAdmin,isAdmin)=>{
  if(!user_id)
    throw EXCEPTION.E_INVALID_DATA
  
  let queryModules = MYSQL(T_MODULE)
  if(isAdmin)
    queryModules = queryModules.where('level',4)
  else if(isEntAdmin)
    queryModules = queryModules.where('level',3)
  
  let modules = await queryModules

  if(ent_id)
  {
    let mod_idlist = await MYSQL(T_ENTERPRISE_MODULE).where({ent_id})
    modules = modules.filter(v => {
      if(v.private){
        if((pred_ids.includes(user_id) || isEntAdmin || isAdmin) && mod_idlist.find(m => m.mod_id != v.id))
          return true
        else
          return false
      }else{
        if(v.level == 4){
          return isAdmin
        }else if(v.level == 3)
          return isEntAdmin
        else
          return true
      }
    })
  }else{
    modules = modules.filter(v=>v.level < 2)
  }


  return modules
  // id=>account_type=>active_module_list
  // id=>ent_id=>active_module_list
  // [mixed]

}

o.addEnterpriseByKey = async (module_key,ent_id,op)=>{
  if(!module_key || !ent_id)
    throw EXCEPTION.E_INVALID_DATA

  let mod = await MYSQL(T_MODULE).first('id').where({key:module_key})
  if(!mod)
    throw EXCEPTION.E_INVALID_DATA
  
  await MYSQL(T_ENTERPRISE_MODULE).insert({ent_id,mod_id:mod.id})

  UserLogger.info(`${op}为企业${ent_id}授权了应用${module_key}`)
}

o.create = async (item,op)=>{
  if(!item || !op)
    throw EXCEPTION.E_INVALID_DATA

  delete item.id
  item.created_at = UTIL.getTimeStamp()
  item.created_by = op
  item.id = UTIL.createUUID()
  
  await MYSQL(T_MODULE).insert(item)
  let createInfo = {
    id:item.id,
    created_at : item.created_at,
    created_by :op
  }
  UserLogger.info(`${op}创建了系统应用${item.name}`)
  return createInfo
}

o.update = async (id,item,op)=>{
  if(!id || !item || !op)
    throw EXCEPTION.E_INVALID_DATA

  delete item.id
  MYSQL(T_MODULE).update(item).where({id})

  UserLogger.info(`${op}创建了修改了应用${item.name}的信息`)

}

o.deleteObjects = async (id_list,op)=>{
  if(!Array.isArray(id_list) || !op)
    throw EXCEPTION.E_INVALID_DATA

  await MYSQL(T_MODULE).whereIn("id",id_list).del()

  UserLogger.info(`${op}删除了应用${id_list.join(',')}`)
}



module.exports = o