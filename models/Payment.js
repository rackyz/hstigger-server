const MYSQL = require('../base/mysql')
const Type = require('./Type')
const UTIL = require('../base/util')
const Exception = require('../base/exception')
let o = {}

o.required = ['Type']

let DB = {}
DB.payment = MYSQL.Create(
  "payment",
  t => {
    t.increments().primary()
    t.uuid('contract_id')
    t.string('code',16)
    t.string('desc', 64)
    t.double('amount')
    t.uuid('project_id')
    t.uuid('dep_id')
    t.uuid('condition_id')
    t.text('files')
    t.datetime('paydate')
    t.integer('state')
    t.datetime('created_at')
    t.uuid('created_by')
  }
)
o.initdb = async (forced) => {
  await MYSQL.Migrate(DB, forced)
}

o.initdb_e = async (ent_id, forced) => {
  await MYSQL.Migrate(DB, forced, ent_id)
 
}

o.query = async (state,condition,ent_id)=>{
  let Q = DB.payment.Query(ent_id)
  let items = await Q
  return items
}

o.create = async (state,data,ent_id)=>{
  let Q = DB.payment.Query(ent_id)
  let updateInfo = {
    created_by:state.id,
    created_at:UTIL.getTimeStamp(),
    state:0
  }
  Object.assign(data,updateInfo)
  let id = await Q.insert(data).returning('id')
  updateInfo.id = id
  return updateInfo
}

o.get = async (state,id,ent_id)=>{
 let Q = DB.payment.Query(ent_id)
 let data = await Q.where({id})
 return data
}

o.patch = async (state,id,data,ent_id)=>{
  let Q = DB.payment.Query(ent_id)
  await Q.update(data).where({id})
  return
}

o.remove = async (state,id,ent_id)=>{
  let Q = DB.payment.Query(ent_id)
  await Q.where({id}).del()
}

module.exports = o