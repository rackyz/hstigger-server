/** Account */
const {
  Account,
  Type
} = require('../../models')

let out = {}

out.Auth = async (method,{user_id,ent_id})=>{
}

out.Name = "账户"
out.Desc = "平台后台管理所支持的用户账户操作"

out.ListDesc="列出所有平台账户列表"
out.List = async ctx=>{
  let query = ctx.query
  let accounts = await Account.getList()
  return accounts
}




out.Patch =async ctx=>{
  let id = ctx.params.id
  let data = ctx.request.body
  
  await Account.update(id,data,ctx.state.user)
 // 
  return
}

out.Post = async ctx=>{
  let data = ctx.request.body
  let res = []
  if(Array.isArray(data)){
    res = await Account.createAccounts(data, ctx.state.user)
  }else{
    res = await Account.createAccounts([data], ctx.state.user)
  }

 
  return res
}

out.Delete = async ctx=>{
  let id = ctx.params.id
  await Account.remove([id], ctx.state.user)

}

out.PostAction = async ctx=>{
  let data = ctx.request.body
  let action = ctx.params.action
  let op = ctx.state.user
  if(action == 'delete'){
    await Account.remove(data, op)
  }else if(action == 'change-pwd'){
    let {
      id,
      password
    } = data
    await Account.change_password(id, password, op)
  }else if(action == 'reset-pwd'){
    await Account.reset_password(data, op)
  }else if(action == 'lock'){
    await Account.lock(data, op)
  }else if(action == 'unlock'){
    await Account.unlock(data, op)
  }
}


module.exports = out