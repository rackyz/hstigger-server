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

// o.initdb = async (ent_schema,forced)=>{

//   await MYSQL.initdb(T, t => {
//     t.integer('id').index()
//     t.string('name', 255).notNull()
//     t.integer('parent_id')
//     t.string('color',16).defaultTo('#333')
//     t.string('extra',32)
//     t.string('extra2',32)
//   }, forced, ent_schema)

//   if(forced){
//     if (ent_schema == "ENT_NBGZ") {
//       let groups = await Ding.getGroups()
//       await MYSQL(T).withSchema(ent_schema).insert(groups.map(v=>({id:v.id,parent_id:v.parentid,name:v.name})))
//     }
//   }
// }

o.initdb_e = async (ent_schema, forced) => {
  await MYSQL.initdb(T, t => {
    t.integer('id').index()
    t.string('name', 255).notNull()
    t.integer('parent_id')
    t.string('color', 16).defaultTo('#333')
    t.string('extra', 32)
    t.string('extra2', 32)
  }, forced, ent_schema)

  await MYSQL.initdb(T_USER, t => {
    t.integer('id').index()
    t.string('user_id', 43).notNull()
    t.integer('dep_id')
  }, forced, ent_schema)

  if (forced) {
    if (ent_schema == "ENT_NBGZ") {
      let groups = await Ding.getGroups()
      await MYSQL(T).withSchema(ent_schema).del()
      await MYSQL(T).withSchema(ent_schema).insert(groups.map(v => ({
        id: v.id,
        parent_id: v.parentid,
        name: v.name
      })))
    }
  }
}

o.listRelations = async(ent_id)=>{
  return await MYSQL.E(ent_id, "dep_employee")
}

o.getUserDeps = async (user_id,ent_id)=>{
  let res = await MYSQL.E(ent_id,"dep_employee").select('dep_id').where({user_id})
  return res.map(v=>v.dep_id)
}

o.list = async (ent_id)=>{
  let items = await MYSQL.E(ent_id,"dep")
  return items
}

module.exports = o