const {RestOrder} = require('../../models')
const moment = require('moment')
let out = {}


out.List = async ctx=>{
  let date = ctx.query.date || moment().format("YYYYMMDD")
  let q = ctx.query.q
  if(q == 'week'){
    let items = await RestOrder.queryWeek(ctx.state)
    return items
  }
  let items = await RestOrder.query(ctx.state,{where:{date}})
  
  return items
}

out.Post = async ctx=>{
  let {date} = ctx.request.body
  console.log(date)
  let updateInfo = await RestOrder.order(ctx.state, [], date)
  return updateInfo
}

out.Delete =async ctx=>{
  let id = ctx.params.id
  let date = ctx.query.date
  await RestOrder.remove(ctx.state, [], date)
}

module.exports = out