const MYSQL = require('../base/mysql')
const GZSQL = require('../base/nbgz_db')
const UTIL = require('../base/util')
const moment = require('moment')
const Message = require('./Message')

let DB = {}

let o = {}

DB.restorder = MYSQL.Create('restorder',t=>{
  t.increments('id').primary()
  t.uuid('user_id')
  t.string('date',12)
  t.datetime('created_at')
})

o.loginWithDD = async (authCode)=>{

}

o.initdb_e = async (ent_id,forced) => {
  MYSQL.Migrate(DB, forced, ent_id)
}
o.query = async (state,queryCondition = {})=>{
  let q = DB.restorder.Query(state.enterprise_id)
  
  MYSQL.ParseCondition(q,queryCondition)
  let items = await q
  return items
}

o.queryWeek = async (state,date)=>{
  // 读取一周的数据
  let dates = []
  let start = date?moment(date,'YYYYMMDD'):moment()
  for(let i=0;i<7;i++){
    let day = start.clone().add(i, 'day')
    
    if(day.day()!=6 && day.day()!=0)
      dates.push(day.format('YYYYMMDD'))
  }
  let q = DB.restorder.Query(state.enterprise_id)
  let items = await q.whereIn('date',dates)
  let days = dates.map(v=>({
    date:v,
    items:items.filter(u=>u.date === v)
  }))
  return days

}

o.order = async (state,idlist=[],date)=>{
  let q = DB.restorder.Query(state.enterprise_id)
  let qe = DB.restorder.Query(state.enterprise_id)
  if(idlist.length == 0){
    idlist = [state.id]  
  }
  let d = moment().add(1, 'day')
  if(date)
    d = moment(date,'YYYYMMDD')
  let exist = await qe.select('user_id').where('date', d.format("YYYYMMDD")).where('user_id',state.id)
  let exist_users = exist.map(v=>v.user_id)
  let params = idlist.filter(v=>!exist_users.includes(v)).map(id=>({
    user_id:id,
    created_at:UTIL.getTimeStamp(),
    date:d.format("YYYYMMDD")
  }))
  if(params.length == 0)
    throw '已预订'
  let ids = await q.insert(params).returning('id')
  console.log(ids)
  return ids
}

o.auto_order = async (state)=>{
  let qe = DB.restorder.Query(state.enterprise_id)
  let q = DB.restorder.Query(state.enterprise_id)
  let nextday = moment().startOf('day').add(1, 'day')
  if(nextday.day() === 5){
    nextday = nextday.add(2, 'day')
  }
  let param = {
    user_id:state.id,
    date: nextday.format('YYYYMMDD')
  }
  let datestr = nextday.format('YYYY-MM-DD中午')
  let exist = await qe.first().where(param)
  if(exist){
  console.log('预定失败'+state.id,param.data)
    return
  }
  else
  {
    param.created_at = UTIL.getTimeStamp()
    await q.insert(param)
    let user = await MYSQL('account').first('phone').where('id',state.id)
    if(user.phone)
      await Message.sendSMS(1034277, user.phone, [datestr])
  }
}

o.remove = async (state,idlist=[],date)=>{
  
   let d = moment().subtract(1, 'day')
  if (date)
    d = moment(date, 'YYYYMMDD').subtract(1, 'day')
  let q = DB.restorder.Query(state.enterprise_id)

  if (idlist.length == 0) {
    idlist = [state.id]
  }
console.log(date)
  await q.whereIn('user_id',idlist).where({date}).del()
}

module.exports = o