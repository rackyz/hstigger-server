let out = {}
const {
  Rss
} = require('../../models')

out.Auth = async (method, {
  user_id,
  ent_id
}) => {}

out.List = async ctx => {
  let ent_id = ctx.state.enterprise_id

  return await Rss.list({},ent_id)
}

out.Patch = async ctx=>{
   let state = ctx.state
   let ent_id = state.enterprise_id
   let id = ctx.params.id
   return await Rss.ToggleEnabled(state, id, ent_id)
}


module.exports = out