const {
  Module,
  Account,
  Type
} = require('../../models')

let out = {}
out.Auth = async (method, {
  user_id,
  ent_id
}) => {
  
}

out.List = async (ctx) => {
  return await Module.getModules()
}

out.Post = async (ctx) => {
  let data = ctx.request.body
  let op = ctx.state.id
  return await Module.create(data, op)
}

out.PostAction = async (ctx) => {
  let action = ctx.params.action
  let data = ctx.request.body

  let op = ctx.state.id

  if (action == 'delete') {
    return await Module.deleteObjects(data, op)
  }

}

out.Patch = async (ctx) => {
  let data = ctx.request.body
  let op = ctx.state.id
  let id = ctx.params.id
  return await Module.update(id, data, op)
}

module.exports = out