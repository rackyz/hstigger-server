let {Account,Enterprise,Employee} = require('../../models')
let out = {}


out.List = async ctx=>{
  let ent_id = ctx.state.enterprise_id
  return await Account.ListUsersByEnterprise(ent_id)
}

out.Post = async ctx=>{
  let state = ctx.state
  let data = ctx.request.body
  Employee.Create(state,data)
}

out.Patch = async ctx=>{
  let state = ctx.state
  let id =  ctx.params.id
  let data = ctx.request.body
  Employee.Update(state,id,data)
}

out.Delete = async ctx=>{
  let id = ctx.params.id
  Employee.Delete(state,id)
}

module.exports = out