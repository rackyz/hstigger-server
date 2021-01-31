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
  }else if(action == 'reset-pwd'){
    await Account.reset_password(data, ctx.state.id)
  }else if(action == 'lock'){
    await Account.lock(data, ctx.state.id)
  }else if(action == 'unlock'){
    await Account.unlock(data, ctx.state.id)
  }
}

out.RESET_PASSWORD = {
  url:"POST /entadmin/employees/reset-pwd",
  desc:"重置密码为123456"
}

out.LOCK_ACCOUNTS = {
  url:"POST /entadmin/employees/lock",
  desc:"锁定账户"
}

out.UNLOCK_ACCOUNTS = {
  url:"POST /entadmin/employees/unlock",
  desc:"解锁账户"
}

out.DELETE_ACCOUNTS_ARRAY = {
  url: "POST /entadmin/employees/delete",
  desc:"批量删除"
}

module.exports = out