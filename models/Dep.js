const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Enterprise = require('./Enterprise')
const Type = require("./Type")
const Permission = require('./Permission')
const moment = require('moment')
const Ding = require('./Ding')
const config = require('../base/config')
const {
  UserLogger
} = require('../base/logger')
const REDIS = require('../base/redis')
const {
  ContextParser
} = require('../base/util')

let o = {
  required: ['Type']
}


const T = 'dep'
const T_USER = 'dep_employee'

let DB = {}

DB.dep = MYSQL.Create("dep",t=>{
   t.integer('id').index()
   t.string('name', 255).notNull()
   t.integer('parent_id')
   t.string('color', 16).defaultTo('#333')
   t.string('extra', 32)
   t.string('extra2', 32)
})


DB.dep_user = MYSQL.Create("dep",t=>{
    t.integer('id').index()
    t.string('user_id', 43).notNull()
    t.integer('dep_id')
})


o.initdb_e = async (ent_id, forced) => {
  for(let t in DB){
    await DB[t].Init(forced,ent_id)
  }

  if (forced) {
    if (ent_id == "NBGZ") {
      let groups = await Ding.getGroups()
      await MYSQL(T).withSchema("ENT_NBGZ").del()
      await MYSQL(T).withSchema("ENT_NBGZ").insert(groups.map(v => ({
        id: v.id,
        parent_id: v.parentid,
        name: v.name
      })))
    }
  }
}

o.listRelations = async(ent_id, queryCondition = {})=>{
  let Query = MYSQL.E(ent_id, "dep_employee")
  if(queryCondition.in){
    for(let x in queryCondition.in){
      Query = Query.whereIn(x,queryCondition.in[x])
    }
  }else if(queryCondition.where){
    for (let x in queryCondition.in) {
      Query = Query.where(x, queryCondition.where[x])
    }
  }
  return await Query
}

o.getUserDeps = async (user_id,ent_id)=>{
  let res = await MYSQL.E(ent_id,"dep_employee").select('dep_id').where({user_id})
  return res.map(v=>v.dep_id)
}

o.list = async (ent_id)=>{
  let items = await MYSQL.E(ent_id,"dep")
  return items
}
o.create = async (state,dep,ent_id)=>{
  let QueryCreate = DB.dep.Query(ent_id)
  let id = await QueryCreate.insert(dep).returning('id')
  return id
}

o.patch = async (state,id,dep,ent_id)=>{
  let QueryPatch = DB.dep.Query(ent_id)
   let op = state.id
   await QueryPatch.update(dep).where({
     id
   })
}

o.remove = async (state,id,ent_id)=>{
  let QueryDelete = DB.dep.Query(ent_id)
  await QueryDelete.where({
    id
  }).del()
}

o.addUser = async (state,user_id,dep_id,ent_id)=>{
  let InsertQuery = DB.dep_user.Query(ent_id)
  await o.removeUser(state,user_id,dep_id,ent_id)
  await InsertQuery.insert({user_id,dep_id})
}


o.removeUser = async (state,user_id,dep_id,ent_id)=>{
  let RemoveExistQuery = DB.dep_user.Query(ent_id)
   await RemoveExistQuery.where({
     user_id,
     dep_id
   }).del()
}

module.exports = o