/** Account */
const {
  Account,
  Type
} = require('../models')

let out = {}

out.Auth = async (method,{user_id,ent_id})=>{
  let user = await Account.getAuthInfo(user_id)
  if(user.type !== Type.AccountType.ADMIN)
    throw(403)
}

out.List = async ctx=>{
  let query = ctx.query
  let accounts = await Account.getList()
  return accounts
}


out.Patch =async ctx=>{
  let id = ctx.params.id
  let data = ctx.request.body
  
  await Account.update(id,data)
 // UserLogger.info(`${ctx.state.user} 修改了用户信息 ${id}`)
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

  UserLogger.info(`${ctx.state.user} 创建了用户 ${data.map(v=>v.user).join(',')}`)
  return res
}

out.Delete = async ctx=>{
  let id = ctx.params.id
  await Account.remove([id], ctx.state.user)
  UserLogger.info(`${ctx.state.user} 删除了用户 ${id}`)

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
    console.log(ctx.state)
    await Account.change_password_by_id(id, password, op)
  }else if(action == 'reset-pwd'){
    await Account.reset_password(data, op)
  }else if(action == 'lock'){
    await Account.lock(data, op)
  }else if(action == 'unlock'){
    await Account.unlock(data, op)
  }
}


module.exports = out