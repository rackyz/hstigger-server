let {Account,Enterprise,Dep} = require('../../models')
let out = {}


out.List = async ctx=>{
  let ent_id = ctx.state.enterprise_id
  let deps = await Dep.list(ent_id)
  return deps
}


out.Post = async ctx=>{
  let state = ctx.state
  let ent_id =  state.enterprise_id
  
  let data = ctx.request.body
  let id = await Dep.create(state,data,ent_id)
  return {id}
}

out.Patch = async ctx=>{
  let id = ctx.params.id
  let state = ctx.state
  let ent_id =  state.enterprise_id
  let data = ctx.request.body
  let updateInfo = await Dep.patch(state,id,data,ent_id)
  return updateInfo
}

out.Delete = async ctx=>{
  let id = ctx.params.id
  let state = ctx.state
  let ent_id =  state.enterprise_id
  await Dep.remove(state,id,ent_id)
}


// out.PostAction = async ctx=>{
//   let action = ctx.params.action
//   let ent_id = ctx.state.enterprise_id
//   let data = ctx.request.body
//   if(action == 'delete'){
//     await Enterprise.removeEnterprises(data,ent_id)
//   }else if(action == 'post'){
//     await Account.createAccounts(data,ctx.state.id)
//   }else if(action == 'reset-pwd'){
//     await Account.reset_password(data, ctx.state.id)
//   }else if(action == 'lock'){
//     await Account.lock(data, ctx.state.id)
//   }else if(action == 'unlock'){
//     await Account.unlock(data, ctx.state.id)
//   }
// }


module.exports = out