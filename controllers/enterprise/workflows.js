const {Flow,FlowInstance} = require('../../models')

let out = {}

out.List = async ctx=>{
  let user_id = ctx.state.id
  let ent_id = ctx.state.enterprise_id
  let res = await FlowInstance.GetUserThread(ent_id,user_id)
  return res
}

out.Post = async ctx=>{
  let user_id = ctx.state.id
  let ent_id = ctx.state.enterprise_id
  let data = ctx.request.body
  let createInfo = await FlowInstance.Create(ent_id,data,user_id)
  let patchInfo = await FlowInstance.Patch(ent_id,createInfo.id,data.action,data.data)
  return {
    createInfo,
    patchInfo
  }
}

out.Patch = async ctx=>{
  let user_id = ctx.state.id
  let ent_id = ctx.state.enterprise_id
  let flow_id = ctx.params.id
  let {action,data} = ctx.request.body
  let patchInfo = await FlowInstance.Patch(ent_id,flow_id,action,data,user_id)
  return patchInfo
}

out.Delete = async ctx=>{
  let user_id = ctx.state.id
  let ent_id = ctx.state.enterprise_id
  let flow_id = ctx.params.id
  await FlowInstance.Delete(ent_id,flow_id,user_id)
}

module.exports = out