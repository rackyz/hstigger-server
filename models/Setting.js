const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Type = require('./Type')
const api = require('../base/api')
const o = {
  required:['Type']
}

const TABLE_SETTING = 'setting'


let DB = {}

DB.Setting = MYSQL.Create('setting', t => {
  t.increments('id').primary()
  t.string('key',256)
  t.text('value')

})

o.initdb_e = async(ent_id,forced)=>{
   await MYSQL.Migrate(DB, forced, ent_id)
}


/** Initialize Datebase */
o.initdb = async (forced)=>{
 
  
  await MYSQL.initdb(TABLE_SETTING,t=>{
    t.string("key",32).index()
    t.string("group",16).defaultTo('neip')
    t.string("name",32)
    t.string("desc",128)
    t.string("value",128)
    t.integer("value_key")
    t.integer("setting_type")
  },forced)

  if(forced){
    const SettingType = await Type.AddType("SettingType", ["Local", "Server", "User", "Enterprise"])
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
}



o.getAPISettings = async (api_root)=>{
  return api.GetAPIObject(api_root)
}

/** Methods */
o.getSettings = async (group,type)=>{
  let condition = {}
  if(group)
    condition.group = group
  if(type)
    condition.type = type
  let settings = await MYSQL(TABLE_SETTING).where(condition)
  return UTIL.ArrayToObject(settings,'key',t=>JSON.parse(t.value))
}


o.getEnterpriseSettings = async (state,key_list = [],ent_id)=>{
  let Query = DB.Setting.Query(ent_id).select('key', 'value')
  if(key_list.length > 0)
    Query = Query.whereIn('id',key_list)
  
  let settings = await Query
  return settings

}

o.postSettings = async (state,data,ent_id)=>{
    // 权限鉴定

    let key_list = data.map(v => v.key)
    let DelQuery = DB.Setting.Query(ent_id)
    let Query = DB.Setting.Query(ent_id)
    await DelQuery.whereIn('id', key_list).del()
    await Query.insert(data)
}

o.getValue = async (state,key,ent_id)=>{
   let Query = DB.Setting.Query(ent_id)

   let setting = await Query.first('value').where({
     key
   })
   if(setting){
     return setting.value
   }

}


o.setValue = async (state,key,value,ent_id)=>{
  // 权限鉴定

  let Query = DB.Setting.Query(ent_id)
  await Query.where({key}).del()
  await Query.insert({key,value})
}

module.exports = o