let out = {}
const {Rss} = require('../../models')

out.Auth = async (method, {
  user_id,
  ent_id
}) => {
}

out.Get = async ctx=>{
  let id = ctx.params.id
  let data = await Rss.get(id)

  return data
}


out.List = async ctx=>{
  return await Rss.list()
}

out.Post = async ctx=>{
  let data = ctx.request.body
  let op = ctx.state.id
  return await Rss.create(data,op)
}

out.Patch = async ctx=>{
  let id = ctx.params.id
  let data = ctx.request.body
  let op = ctx.state.id

  return await Rss.patch(id,item.op)
}

out.PostAction = async ctx=>{
  let action = ctx.params.action
  let id_list = ctx.request.body
  let op = ctx.state.id
  if(action == 'delete')
    await Rss.deleteObjects(id_list,op)
}

module.exports = out