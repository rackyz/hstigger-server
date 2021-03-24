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
  let modules = await Module.getAuthedModules(state.id, ent_id, false, false, true)
  let disbaled_list = await Setting.getValue(state, 'MODULE_DISABLED', ent_id)
  if (disbaled_list && typeof disbaled_list == 'string')
  { 
    disbaled_list = disbaled_list.split(',')
    modules.forEach(v=>{
      if (disbaled_list.includes(v.id))
        v.disabled = true
    })
  }
  return modules
}

out.Patch = async (ctx) => {
  let state = ctx.state
  let ent_id = state.enterprise_id
  let id = ctx.params.id
  return await Module.ToggleModuleEnabled(state, id, ent_id)
}

module.exports = out