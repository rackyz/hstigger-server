const {RestOrder} = require('../../models')
const moment = require('moment')
let out = {}


out.List = async ctx=>{
  let date = ctx.query.date || moment().format("YYYYMMDD")
  let items = await RestOrder.query(ctx.state,{where:{date}})
  console.log('query:',items)
  return items
}

out.Post = async ctx=>{
  let updateInfo = await RestOrder.order(ctx.state)
  return updateInfo
}

out.Delete =async ctx=>{
  let id = ctx.params.id
  await RestOrder.remove(ctx.state,id)
}

module.exports = out