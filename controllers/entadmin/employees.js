let {Account,Enterprise} = require('../../models')
let out = {}


out.List = async ctx=>{
  let ent_id = ctx.state.enterprise_id
  return await Account.ListUsersByEnterprise(ent_id)
}


out.Post = async ctx=>{
  let ent_id =  ctx.state.enterprise_id
  let data = ctx.request.body
  let updateInfo = await Account.create(data)
  await Enterprise.addEnterprise(updateInfo.id,ent_id)
  return updateInfo
}

out.Patch = async ctx=>{
  let id = ctx.params.id
  let ent_id =  ctx.state.enterprise_id
  let data = ctx.request.body
  let updateInfo = await Account.update(id,data,ctx.state.id)
  return updateInfo
}

out.Delete = async ctx=>{
  let id = ctx.params.id
  let ent_id =  ctx.state.enterprise_id
  await Enterprise.removeEnterprise(id,ent_id)
}


out.PostAction = async ctx=>{
  let action = ctx.params.action
  let ent_id = ctx.state.enterprise_id
  let data = ctx.request.body
  if(action == 'delete'){
    await Enterprise.removeEnterprises(data,ent_id)
  }else if(action == 'post'){
    await Account.createAccounts(data,ctx.state.id)
  }
}
module.exports = out