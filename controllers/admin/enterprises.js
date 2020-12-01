const {Enterprise,Account,Type} = require('../../models')

let out = {}

out.Auth = async (method,{user_id,ent_id})=>{
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
  let action = ctx.params.action
  let data = ctx.request.body

  let op = ctx.state.id

  if(action == 'delete'){
    return await Enterprise.deleteEnterprises(data, op)
  }else if(action == 'lock'){
    return await Enterprise.lock(data,op)
  }else if(action == 'unlock'){
    return await Enterprise.unlock(data,op)
  }

}

out.Patch = async (ctx)=>{
  let data = ctx.request.body
  let op = ctx.state.id
  let id = ctx.params.id
  return await Enterprise.patchEnterPrise(id,data,op)
}

module.exports = out