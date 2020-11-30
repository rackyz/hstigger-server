const {
  Module,
  Account,
  Type
} = require('../models')

let out = {}

out.Auth = async (method, {
  user_id,
  ent_id
}) => {
  let user = await Account.getAuthInfo(user_id)
  if (!user || user.type !== Type.AccountType.ADMIN)
    throw (403)
}

out.List = async (ctx) => {
  return await Module.getModules()
}

out.Post = async (ctx) => {
  let data = ctx.request.body
  let op = ctx.state.id
  return await Module.createModule(data, op)
}

out.PostAction = async (ctx) => {
  let action = ctx.params.action
  let data = ctx.request.body

  let op = ctx.state.id

  if (action == 'delete') {
    return await Module.deleteModule(data, op)
  }

}

out.Patch = async (ctx) => {
  let data = ctx.request.body
  let op = ctx.state.id
  let id = ctx.params.id
  return await Module.patchModule(id, data, op)
}

module.exports = out