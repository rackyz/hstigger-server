const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Type = require("./Type")
const { getTimeStamp } = require('../base/util')
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

const DB = {}

DB.permission = MYSQL.Create('permission',t=>{
  t.increments().primary()
  t.string('name',32)
  t.string('desc',256)
  t.string('key',32)
  t.integer('client_type')
  t.integer('server_type')
  t.integer('parent_id')
  t.integer('permission_type')
  t.integer('extra_data')
  t.integer('created_at')
})

DB.authed_permission = MYSQL.Create('authed_permission',t=>{
   t.increments().primary()
   t.uuid('client_id')
   t.uuid('permission_id')
   t.string('value',32)
   t.datetime('updated_at')
})

o.initdb = async (forced)=>{
  if(forced){
   await Type.AddType('ResourceType', [{
     key:"MOD",
     name: "模块菜单",
     value: RESOURCE_TYPE.MODULE,
     color: "rgb(51, 153, 255)",
   }, {
     name: "流程",
     key:"FLOW",
     value: RESOURCE_TYPE.FLOW,
     color: "rgb(51, 153, 255)"
   }, {
     name: "订阅",
     key:"RSS",
     value: RESOURCE_TYPE.SUBSCRIPTION,
     color: "yellowgreen"
   },{
     name: "项目模块",
     key:"PMOD",
     value: RESOURCE_TYPE.PROJECT_MODULE,
     color: "yellowgreen"
   },{
     key:"API",
     name: "访问请求",
     value: RESOURCE_TYPE.API,
     color:"blue"
   }])

   await Type.AddType('AccessType', [{
     key:"USER",
     name: "用户",
     value: 1,
     color: "rgb(51, 153, 255)",
   }, {
     key:"ROLE",
     name: "角色",
     value: 2,
     color: "rgb(51, 153, 255)"
   }, {
     key:"DEP",
     name: "部门",
     value: 3,
     color: "yellowgreen"
   }, {
     key:"ENTERPRISE",
     name: "企业",
     value: 4,
     color: "yellowgreen"
   }, {
     key:"PROJECT",
     name: "项目组",
     value: 5,
     color: "yellowgreen"
   }, {
     key: "GROUP",
     name: "组",
     value: 5,
     color: "yellowgreen"
   }])
  }

  await MYSQL.initdb(T_PERMISSION,t=>{
    t.increments('id').index()
    t.string('access_id',64).notNull()
    t.integer('access_type')
    t.integer('res_type').notNull()
    t.string('res_id', 64).notNull()
    t.boolean('permit').default(true)
  },forced)

}

o.initdb_e = async (ent_id,forced)=>{

  await MYSQL.Migrate(DB, forced,ent_id)
}

o.getPermissions = async (access_ids,res_type)=>{
  let Query = MYSQL(T_PERMISSION).whereIn('key', access_ids)
  if(res_type)
    Query = Query.where({
      res_type
    })
  let permissions = await Query
  return permissions.map(v=>({key:v.res_id,value:v.permit}))
}


o.getACL = async (client_id,ent_id)=>{
  let query = DB.authed_permission.Query(ent_id)
  let items = await query.where({client_id})
  items.forEach(v=>{
    v.key = v.permission_id
  })
  return items
}


o.patchACL = async (client_id,data = [],ent_id)=>{
  let query = DB.authed_permission.Query(ent_id)
  let remove = DB.authed_permission.Query(ent_id)
  let timeStamp = getTimeStamp()
  data.forEach(v=>{
    v.permission_id = v.key
    delete v.key
    v.client_id = client_id
    v.updated_at = timeStamp
  })
  await remove.where({client_id}).del()
  await query.insert(data)
}

module.exports = o