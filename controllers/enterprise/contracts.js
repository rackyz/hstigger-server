const {
  Contract
} = require('../../models')


let o = {}

o.List = async ctx => {
  let queryParams = ctx.query
  let state = ctx.state
  let res = await Contract.query(state, queryParams, state.enterprise_id)
  return res
}

o.Get = async ctx => {
  let id = ctx.params.id
  let state = ctx.state
  let res = await Contract.get(state, id, state.enterprise_id)
  return res
}

o.Post = async ctx => {
  let data = ctx.request.body
  let state = ctx.state
  let res = await Contract.add(state, data, state.enterprise_id)
  return res
}

o.Patch = async ctx => {
  let data = ctx.request.body
  let state = ctx.state
  let id = ctx.params.id
  let res = await Contract.patch(state, id, data, state.enterprise_id)
  return res
}

o.Delete = async ctx => {
  let id = ctx.params.id
  let state = ctx.state
  await Contract.del(state, [id], state.enterprise_id)
}


module.exports = o