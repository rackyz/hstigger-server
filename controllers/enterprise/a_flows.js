const {
  Flow,
  FlowInstance
} = require('../../models')
const o = require('../../models/Type')

let out = {}

out.List = async ctx => {
  let user_id = ctx.state.id
  let ent_id = ctx.state.enterprise_id
  let q = ctx.query.q
  let items = await FlowInstance.GetInstanceData(ent_id,q,user_id)
  return items
}

out.Get = async ctx=>{
   let user_id = ctx.state.id
   let ent_id = ctx.state.enterprise_id
   let inst_id = ctx.params.id
   let report = await FlowInstance.GetData(ent_id, inst_id,'report',user_id)
   return report
  
}

out.Delete = async ctx => {
  let user_id = ctx.state.id
  let ent_id = ctx.state.enterprise_id
  let inst_id = ctx.params.id
  await FlowInstance.Delete(ent_id, inst_id, user_id)
}

module.exports = out