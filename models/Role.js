
const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Type = require("./Type")
const Permission = require('./Permission')
let o = {}

let DB = {}
DB.role = MYSQL.Create("role",t=>{
  t.increments().primary()
  t.string('name',32)
  t.string('color',16)
  t.string('icon',16)
  t.integer('type_id')
  t.string('desc',128)
})

DB.role_user = MYSQL.Create("role_user",t=>{
  t.increments().primary()
  t.uuid('client_id')
  t.integer('role_id')
  t.uuid('user_id')
})

o.initdb = async (forced) => {
  for(t in DB){
    await DB[t].Init(forced)
  }
}

o.initdb_e = async (ent_id, forced) => {
 for (t in DB) {
   await DB[t].Init(forced, ent_id)
 }
}


o.list = async (ent_id)=>{
  let Q = DB.role.Query(ent_id)
  let items = await Q
  return items
}

o.create = async (state,role)=>{
  let Q = DB.role.Query(state.enterprise_id)
  let id = await Q.insert(role).returning('id')
  return {id}
}

o.patch = async (state,id,role,ent_id)=>{
  console.log("PATCH:",id,role)
 let Q = DB.role.Query(ent_id)
 await Q.update(role).where({id})
 return {}
}

o.listRelations = async (ent_id, queryCondition = {}) => {
   let Query = DB.role_user.Query(ent_id)
   if (queryCondition.in) {
     for (let x in queryCondition.in) {
       Query = Query.whereIn(x, queryCondition.in[x])
     }
   } else if (queryCondition.where) {
     for (let x in queryCondition.where) {
       Query = Query.where(x, queryCondition.where[x])
     }
   }
   return await Query
}

o.addUser = async (state,user_id,role_id)=>{
  let DeleteExist = DB.role_user.Query(state.enterprise_id)
  let Insert = DB.role_user.Query(state.enterprise_id)
  await DeleteExist.where({user_id,role_id}).del()
  await Insert.insert({user_id,role_id})
}

o.removeUser = async (state,user_id,role_id)=>{
  let Remove = DB.role_user.Query(state.enterprise_id)
  await Remove.where({user_id,role_id}).del()
}


o.remove = async (state,id,role)=>{
  let Q = DB.role.Query(state.enterprise_id)
  await Q.where({
    id
  }).del()
}

o.removeList =  async (state,id_list)=>{
   let Q = DB.role.Query(state.enterprise_id)
   await Q.whereIn("id",id_list).del()
}

o.getACL = async (state,id,ent_id)=>{
  return await Permission.getACL(id,ent_id)

}

o.patchACL = async (state,id,data,ent_id)=>{
  return await Permission.patchACL(id,data,ent_id)
}

o.getUserACL = async (state,user_id,ent_id)=>{
  // 1 - get all roles/deps
  // 2 - get all permissions In deps
  // 3 - override permissions in different region
  // 4 - return final ACL table
  console.log('getuseracl',user_id,ent_id)
  let roles = await o.listRelations(ent_id,{where:{user_id}})
  let deps = await MYSQL.E(ent_id ,'dep_employee').select('dep_id').where({
    user_id
  })
  let id_list = []
  roles.forEach(v=>{
    id_list.push(v.role_id)
  })
  deps.forEach(v=>{
    id_list.push(v.dep_id)
  })

  let permissions = await MYSQL.E(ent_id,'authed_permission').select('permission_id','value').whereIn('client_id',id_list)


  let acl = {}
  permissions.forEach(v => {
    if(v.value == false){
      acl[v.permission_id] = false
    }else if(v.value && acl[v.permission_id] != undefined){
      acl[v.permission_id] = true
    }
  })

  console.log("ACL:",acl)
  return acl
}

module.exports = o