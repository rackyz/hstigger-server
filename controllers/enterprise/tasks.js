let {
  Account,
  Enterprise,
  Task
} = require('../../models')
let out = {}


out.List = async ctx => {
  let ent_id = ctx.state.enterprise_id
   let state = ctx.state
  let items = await Task.query(state, {
    parent_id: null
  }, ent_id)
  return items
}


out.Post = async ctx => {
  let state = ctx.state
  let ent_id = state.enterprise_id

  let data = ctx.request.body
  let updateInfo = await Task.create(state, data, ent_id)
  return updateInfo
}
out.PROCESS_TASK = {
  url:"PATCH /enterprise/tasks/:id?q=process",
  desc:"处理消息，提交数据"
}


out.Patch = async ctx => {
  let id = ctx.params.id
  let state = ctx.state
  let ent_id = state.enterprise_id
  let data = ctx.request.body
  let q = ctx.query.q
  if(q == 'process'){
    let updateInfo = await Task.process(state, id, data, ent_id)
    return updateInfo
  }

  let updateInfo = await Task.patch(state, id, data, ent_id)
  return updateInfo
}

out.Delete = async ctx => {
  let id = ctx.params.id
  let state = ctx.state
  let ent_id = state.enterprise_id
  await Task.remove(state, id, ent_id)
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