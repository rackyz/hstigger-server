const {
  Payment
} = require('../../models')


let o = {}

o.List = async ctx => {
  let queryParams = ctx.query
  let state = ctx.state
  let res = await Payment.query(state, queryParams, state.enterprise_id)
  return res
}

o.Get = async ctx => {
  let id = ctx.params.id
  let state = ctx.state
  let res = await Payment.get(state, id, state.enterprise_id)
  return res
}

o.Post = async ctx => {
  let data = ctx.request.body
  let state = ctx.state
  let res = await Payment.create(state, data, state.enterprise_id)
  return res
}

o.Patch = async ctx => {
  let data = ctx.request.body
  let state = ctx.state
  let id = ctx.params.id
  let res = await Payment.patch(state, id, data, state.enterprise_id)
  return res
}

o.Delete = async ctx => {
  let id = ctx.params.id
  let state = ctx.state
  await Payment.del(state, [id], state.enterprise_id)
}


module.exports = o