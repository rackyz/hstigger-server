const {
  Project
} = require('../../models')


let o = {}

o.List = async ctx => {
  let queryParams = ctx.query
  let state = ctx.state
  let res = await Project.query(state, queryParams, state.enterprise_id)
  return res
}

o.Get = async ctx => {
  let id = ctx.params.id
  let state = ctx.state
  let res = await Project.get(state, id, state.enterprise_id)
  return res
}

o.Post = async ctx => {
  let data = ctx.request.body
  let state = ctx.state
  let res = await Project.add(state, data, state.enterprise_id)
  return res
}

o.Patch = async ctx => {
  let data = ctx.request.body
  let state = ctx.state
  let id = ctx.params.id
  let res = await Project.patch(state, id, data, state.enterprise_id)
  return res
}

o.Delete = async ctx => {
  let id = ctx.params.id
  let state = ctx.state
  await Project.del(state, [id], state.enterprise_id)
}


module.exports = o