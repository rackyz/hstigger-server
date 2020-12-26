const {Flow,FlowInstance} = require('../../models')
const o = require('../../models/Type')

let out = {}

out.List = async ctx=>{
  let user_id = ctx.state.id
  let ent_id = ctx.state.enterprise_id
  let q = ctx.query.q
  try{
  let nodes = await FlowInstance.GetUserNodes(ent_id,user_id)
  if(q == 'in')
  {
    let res = await FlowInstance.GetPassedThreads(ent_id,nodes)
    return res
  }
  let res = await FlowInstance.GetActiveThreads(ent_id,nodes)
  return res
}catch(e){
  return []
}
}

out.Post = async ctx=>{
  let op = ctx.state.id
  let ent_id = ctx.state.enterprise_id
  let data = ctx.request.body
  let createInfo = await FlowInstance.Create(ent_id,data,op)
  if(!createInfo)
    throw "CREATE_FAILED"
  data.node = createInfo.history_id
  let patchInfo = await FlowInstance.Patch(ent_id,createInfo.id,data,op)
  console.log(patchInfo)
  return {
    instance:createInfo,
    history:patchInfo
  }
}

// --> History
out.Get = async ctx=>{
  let op = ctx.state.id
  let ent_id = ctx.state.enterprise_id
  let inst_id =ctx.params.id

  // instance
  // history
  // ddata
  let data = await FlowInstance.History(ent_id,inst_id)
  return data
}


out.Patch = async ctx=>{
  let user_id = ctx.state.id
  let ent_id = ctx.state.enterprise_id
  let flow_id = ctx.params.id
  let q = ctx.query.q
  let data = ctx.request.body

  if(q == 'recall'){
    await FlowInstance.Recall(ent_id,flow_id,data.node,user_id)
    return
  }else if(q=='savescore'){
    await FlowInstance.saveScore(ent_id,flow_id,data,user_id)
    return
  }
  let patchInfo = await FlowInstance.Patch(ent_id,flow_id,data,user_id)
  return patchInfo
}

out.Delete = async ctx=>{
  let user_id = ctx.state.id
  let ent_id = ctx.state.enterprise_id
  let flow_id = ctx.params.id

  await FlowInstance.Delete(ent_id,flow_id,user_id)
}

module.exports = out