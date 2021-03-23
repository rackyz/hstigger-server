const {Setting} = require('../../models')

let o = {}


o.List = async ctx=>{
  let ent_id = ctx.state.enterprise_id
  let settings = await Setting.getEnterpriseSettings({},[],ent_id)
  return settings
}

o.Post = async ctx=>{
  let ent_id = ctx.state.enterprise_id
  let state = ctx.state
  let data = ctx.request.body
 
  await Settings.postSettings(state, data, ent_id)
}

o.Patch = async ctx=>{
  let ent_id = ctx.state.enterprise_id
  let state = ctx.state
  let key = ctx.param.id
  let value = ctx.request.body
  await Setting.setValue(state, key, value, ent_id)
}

module.exports = o