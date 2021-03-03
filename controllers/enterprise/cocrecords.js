const {
  CocRecord
} = require('../../models')


let o = {}

o.List = async ctx => {
  let queryParams = ctx.query
  let state = ctx.state
  let res = await CocRecord.query(state, queryParams, state.enterprise_id)
  return res
}

o.Get = async ctx => {
  let id = ctx.params.id
  let state = ctx.state
  let res = await CocRecord.get(state, id, state.enterprise_id)
  return res
}

o.Post = async ctx => {
  let data = ctx.request.body
  let state = ctx.state
  let res = await CocRecord.add(state, data, state.enterprise_id)
  return res
}

o.Patch = async ctx => {
  let data = ctx.request.body
  let state = ctx.state
  let id = ctx.params.id
  let res = await CocRecord.patch(state, id, data, state.enterprise_id)
  return res
}

o.Delete = async ctx => {
  let id = ctx.params.id
  let state = ctx.state
  await CocRecord.del(state, [id], state.enterprise_id)
}


module.exports = o