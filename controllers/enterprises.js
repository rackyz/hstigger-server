const {Enterprise,Account,Type} = require('../models')

let out = {}

out.Auth = async (method,{user_id,ent_id})=>{
  let user = await Account.getAuthInfo(user_id)
  if(user.type !== Type.AccountType.ADMIN)
    throw(403)
}

out.List = async (ctx)=>{
  return await Enterprise.getEnterpriseListFull()
}

out.Post = async (ctx)=>{
  let data = ctx.request.body
  let op = ctx.state.id
  return await Enterprise.createEnterprise(data,op)
}

out.PostAction = async (ctx)=>{
  let action = ctx.param.action
  let data = ctx.request.body

  let op = ctx.state.id

  if(action == 'delete'){
    return await Enterprise.createEnterprise(data,op)
  }else if(action == 'lock'){
    return await Enterprise.lock(data,op)
  }else if(action == 'unlock'){
    return await Enterprise.unlock(data,op)
  }

}

module.exports = out