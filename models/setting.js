const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Type = require('./Type')
const o = {
  required:['Type']
}

const TABLE_SETTING = 'setting'


/** Initialize Datebase */
o.initdb = async (forced)=>{

  const SettingType = await Type.AddType("SettingType",["Local","Server","User","Enterprise"])
  
  await MYSQL.initdb(TABLE_SETTING,t=>{
    t.string("key",32).index()
    t.string("group",16).defaultTo('neip')
    t.string("name",32)
    t.string("desc",128)
    t.string("value",128)
    t.integer("value_key")
    t.integer("setting_type")
  },forced)

  

  await MYSQL.seeds(TABLE_SETTING, {
    key: "ENABLE_REGISTER",
    group: "LOGIN",
    name: "启用新用户注册",
    desc: "在登录页面启用新用户注册功能",
    value: "false",
    setting_type: SettingType.Local
  }, {
    key: "ENABLE_AUTH_LOGIN",
    group: "LOGIN",
    name: "启用第三方登录",
    desc: "在登录页面启用第三方验证登录功能",
    value: "false",
    setting_type: SettingType.Local
  },forced)

}


/** Methods */
o.getSettings = async (group,type)=>{
  let condition = {}
  if(group)
    condition.group = group
  if(type)
    condition.type = type
  let settings = await MYSQL(TABLE_SETTING).where(condition)
  return UTIL.ArrayToObject(settings,'key',t=>t.value)
}


module.exports = o