const {
  Module,
  Setting,
  Account,
  Type
} = require('../../models')

let out = {}
out.Auth = async (method, {
  user_id,
  ent_id
}) => {
  // if user is entadmin of ent_id
}

out.List = async (ctx) => {
  let state = ctx.state
  let ent_id = state.enterprise_id
  let modules = await Module.getAuthedModules(state.id,state.enterprise_id,false,false)
  let disbaled_list = await Setting.getValue(state, 'MODULE_ENABLED', ent_id)
  if (disbaled_list && typeof disbaled_list == 'string')
  { 
    disbaled_list = disbaled_list.split(',')
    modules.forEach(v=>{
      if(enabled_list.includes(v.key))
        v.disabled = true
    })
  }
  console.log('modules:',modules.length)
  return modules
}

out.Patch = async (ctx) => {
  let disbaled_list = ctx.request.body
  let state = ctx.state
  let ent_id = state.enterprise_id
  let id = ctx.params.id
  return await Module.EnableModule(state, id, disbaled_list, ent_id)
}

module.exports = out