const MYSQL = require('../base/mysql')
const Type = require('./Type')
const UTIL = require('../base/util')
const Exception = require('../base/exception')
let o = {}
const Contract = require('./Contract')
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
  
  if(condition && condition.contract_id)
    Q = Q.where(condition)
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

  if(data.contract_id){
    await o.UpdateContract(state,data.contract_id,ent_id)
  }
  return updateInfo
}


o.UpdateContract = async (state,contract_id,ent_id)=>{
  let items = await o.query(state,{contract_id},ent_id)
  let amount = 0
  items.forEach(v=>{
    amount += v.amount || 0
  })
 if(amount != undefined)
  await MYSQL.E(ent_id,'contract').update({payed_amount:amount}).where({id:contract_id})
}

o.get = async (state,id,ent_id)=>{
 let Q = DB.payment.Query(ent_id)
 let data = await Q.where({id})
 return data
}

o.patch = async (state,id,data,ent_id)=>{
  let Q = DB.payment.Query(ent_id)
  let p = await o.get(state,id,ent_id)
  await Q.update(data).where({id})
  if(p.contract_id && data.contract_id || data.amount != undefined){
    await o.UpdateContract(state,p.contract_id,ent_id)
    if(data.contract_id && data.contract_id != p.contract_id){

      await o.UpdateContract(state,data.contract_id,ent_id)
    }
  }
  return
}

o.remove = async (state,id,ent_id)=>{
  let Q = DB.payment.Query(ent_id)
  let p = await o.get(state,id,ent_id)
  if(p.contract_id)
    await o.UpdateContract(state,p.contract_id,ent_id)
  await Q.where({id}).del()
}

o.removeFromContracts = async (state,id_list,ent_id)=>{
  let Q  = DB.payment.Query(ent_id)
  await Q.whereIn('contract_id',id_list).del()
}

module.exports = o