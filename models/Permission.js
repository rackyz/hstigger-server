const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Type = require("./Type")
let o = {
  required:["Type"]
}

// Database Initalization
const T_PERMISSION = 'permission'

const RESOURCE_TYPE = {
  MODULE:1,
  FLOW:2,
  SUBSCRIPTION:3,
  PROJECT_MODULE:4,
  API:5
}

o.RESOURCE_TYPE = RESOURCE_TYPE

o.initdb = async (forced)=>{
   await Type.AddType('RESOURCE_TYPE', [{
     name: "模块菜单",
     value: RESOURCE_TYPE.MODULE,
     color: "rgb(51, 153, 255)",
   }, {
     name: "流程",
     value: RESOURCE_TYPE.FLOW,
     color: "rgb(51, 153, 255)"
   }, {
     name: "订阅",
     value: RESOURCE_TYPE.SUBSCRIPTION,
     color: "yellowgreen"
   },{
     name: "项目模块",
     value: RESOURCE_TYPE.PROJECT_MODULE,
     color: "yellowgreen"
   },{
     name: "访问请求",
     value: RESOURCE_TYPE.API,
     color:"blue"
   }])

   await Type.AddType('ACCESS_TYPE', [{
     name: "用户",
     value: 1,
     color: "rgb(51, 153, 255)",
   }, {
     name: "角色",
     value: 2,
     color: "rgb(51, 153, 255)"
   }, {
     name: "部门",
     value: 3,
     color: "yellowgreen"
   }, {
     name: "企业",
     value: 4,
     color: "yellowgreen"
   }, {
     name: "组",
     value: 5,
     color: "yellowgreen"
   }])

  await MYSQL.initdb(T_PERMISSION,t=>{
    t.increments('id').index()
    t.string('access_id',64).notNull()
    t.integer('access_type')
    t.integer('res_type', 64).notNull()
    t.string('res_id', 64).notNull()
    t.boolean('permit').default(true)
  },forced)



  
}


o.getPermissions = async (access_ids,res_type)=>{
  let permissions = await MYSQL(T_PERMISSION).whereIn('access_id',access_ids).where({res_type})
  return permissions.map(v=>({key:v.res_id,value:v.permit}))
}

module.exports = o