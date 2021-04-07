let {Account,Enterprise,Employee} = require('../../models')
let out = {}


out.List = async ctx=>{
  let ent_id = ctx.state.enterprise_id
  let queryCondition = ctx.query
  return await Employee.List(ctx.state,queryCondition)
}

out.Post = async ctx=>{
  let ent_id =  ctx.state.enterprise_id
  let data = ctx.request.body
  let updateInfo = await Employee.Create(ctx.state,data,ent_id)
  await Enterprise.addEnterprise(updateInfo.id,ent_id)
  return updateInfo
}

out.Patch = async ctx=>{
  let id = ctx.params.id
  let ent_id =  ctx.state.enterprise_id
  let data = ctx.request.body
  let state = ctx.state
  let q = ctx.query.q
  if(q=='dep'){
    await Employee.ChangeDeps(state,id,data)
    return
  }else if(q=='role'){
    await Employee.ChangeRoles(state,id,data)
    return
  }

  let updateInfo = await Employee.Update(state,id,data,ent_id)
  return updateInfo
}

out.PATCH_USER_DEPS = {
  url:"PATCH /entadmin/employees/:id?q=dep",
  desc:"修改用户的部门信息"
}
out.PATCH_USER_ROLES = {
  url:"PATCH /entadmin/employees/:id?q=role",
  desc:"修改用户的职务信息"
}

out.Delete = async ctx=>{
  let id = ctx.params.id
  let state = ctx.state
  await Employee.Delete(state,id)
}

out.Get = async ctx=>{
  let id = ctx.params.id
  let ent_id = ctx.state.enterprise_id
  let employee = await Employee.Get(ctx.state,id)
  return employee
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