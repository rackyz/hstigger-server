const {
  Bidorder
} = require('../../models')


let o = {}

o.List = async ctx => {
  let queryParams = ctx.query
  let state = ctx.state
  let res = await Bidorder.query(state, queryParams, state.enterprise_id)
  return res
}

o.Get = async ctx => {
  let id = ctx.params.id
  let state = ctx.state
  let res = await Bidorder.get(state, id, state.enterprise_id)
  return res
}

o.Post = async ctx => {
  let data = ctx.request.body
  let state = ctx.state
  let res = await Bidorder.add(state, data, state.enterprise_id)
  return res
}

o.Patch = async ctx => {
  let data = ctx.request.body
  let state = ctx.state
  let id = ctx.params.id
  let res = await Bidorder.patch(state, id, data, state.enterprise_id)
  return res
}

o.Delete = async ctx => {
  let id = ctx.params.id
  let state = ctx.state
  await Bidorder.del(state, [id], state.enterprise_id)
}


module.exports = o