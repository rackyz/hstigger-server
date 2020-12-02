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

const MODULE_LEVEL = ['体验级','用户级','平台运维级','企业级']
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
  name: "年终考核",
  state:1,
  desc: "企业员工年终总结及考核评分",
  url: "/core/appraisal",
  type: MODULE_TYPE.ADMIN,
  private: true,
  level: 4,
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
 level: 4,
 created_at: TIMESTAMP
},
{
   id: UTIL.createUUID(),
  key:"EADMIN",
  desc:"企业的管理后台",
  name: "企业后台",
  url:"/core/eadmin/",
  type: MODULE_TYPE.SYSTEM,
   level: 2,
   created_at: TIMESTAMP
},{
  id:UTIL.createUUID(),
  key: "ADMIN",
  name:"NEIP管理",
   desc: "NEIP平台的管理后台",
  url:"/core/admin",
  type: MODULE_TYPE.SYSTEM,
   level: 2,
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
    t.increments('id').index().primary()
    t.uuid("ent_id").notNull()
    t.uuid("mod_id",32).notNull()
  })

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
o.getAuthedModules = async (user_id,ent_id)=>{
  if(!user_id)
    throw EXCEPTION.E_INVALID_DATA
  let account = await MYSQL(T_ACCOUNT).first('type').where({id:user_id})
  let modules = await MYSQL(T_MODULE).where('level','<=',account.type)
  if(ent_id)
  {
    let mod_idlist = await MYSQL(T_ENTERPRISE_MODULE).where({ent_id})
    modules = modules.filter(v=>mod_idlist.find(m=>m.mod_id != v.id))
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

  
  let id = await MYSQL(T_MODULE).insert(item).returning('id')
  let createInfo = {
    id,
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