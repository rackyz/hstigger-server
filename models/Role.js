
const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Type = require("./Type")
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

module.exports = o