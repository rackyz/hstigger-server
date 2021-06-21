const MYSQL = require('../base/mysql')
const GZSQL = require('../base/nbgz_db')
const UTIL = require('../base/util')
const moment = require('moment')

let DB = {}

let o = {}

DB.restorder = MYSQL.Create('restorder',t=>{
  t.increments('id').primary()
  t.uuid('user_id')
  t.string('date',12)
  t.datetime('created_at')
})


o.initdb_e = async (ent_id,forced) => {
  MYSQL.Migrate(DB, forced, ent_id)
}
o.query = async (state,queryCondition = {})=>{
  let q = DB.restorder.Query(state.enterprise_id)
  console.log(queryCondition)
  MYSQL.ParseCondition(q,queryCondition)
  let items = await q
  return items
}

o.order = async (state,idlist=[])=>{
  let q = DB.restorder.Query(state.enterprise_id)

  if(idlist.length == 0){
    idlist = [state.id]  
  }
  console.log(idlist)
  let params = idlist.map(id=>({
    user_id:id,
    created_at:UTIL.getTimeStamp(),
    date:moment().format("YYYYMMDD")
  }))
  let ids = await q.insert(params).returning('id')
  return ids
}

o.remove = async (state,idlist=[])=>{
  let q = DB.restorder.Query(state.enterprise_id)

  if (idlist.length == 0) {
    idlist = [state.id]
  }

  await q.whereIn('id',idlist).del()
}

module.exports = o