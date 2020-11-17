const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Type = require("./Type")
const Permission = require('./Permission')
let o = {
  required: ["Type"]
}

// Database Initalization
const T_MODULE = 'module'


const MODULE_TYPE = {
  COMMON:1,
  OPERATION:2,
  SYSTEM:3
}

const initData = [{
  name:'任务',
  url:"/core/task",
  type: MODULE_TYPE.COMMON,
},
{
  name:"经营管理",
  url:"/core/bi",
  type: MODULE_TYPE.OPERATION,
  private:true
},
{
  name: "企业后台管理",
  url:"/core/eadmin/",
  type: MODULE_TYPE.SYSTEM,
},{
  name:"平台后台管理",
  url:"/core/admin",
  type: MODULE_TYPE.SYSTEM,
}]

o.initdb = async (forced) => {
  await Type.AddType('MODULE_TYPE', [{
    
    name: "通用模块",
    value: MODULE_TYPE.COMMON,
    icon: "supervisor",
    color: "rgb(51, 153, 255)",
  }, {
    name: "经营模块",
    value: MODULE_TYPE.OPERATION,
    icon: "pm2",
    color: "rgb(51, 153, 255)"
  }, {
    name: "系统模块",
    value: MODULE_TYPE.SYSTEM,
    icon: "application",
    color: "yellowgreen"
  }])

  await MYSQL.initdb(T_MODULE, t => {
    t.increments('id').index()
    t.string("key",32)
    t.integer('parent_id')
    t.string('name', 64).notNull()
    t.integer('type')
    t.boolean('private').defaultTo(false)
    t.string('version').defaultTo("1.0.0")
    t.string('developing').defaultTo(false)
    t.string('url',128)

  }, forced)

  await MYSQL.seeds(T_MODULE, initData, forced)
}

o.register = async ()=>{

}

o.getModules = async ()=>{
  let res = await MYSQL(T_MODULE).where('parent_id',0)
  return res
}



module.exports = o