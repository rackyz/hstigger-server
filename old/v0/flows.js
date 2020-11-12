const {
  Q,
  E,
  U,
  D
} = require('../../models')

let out = {}


out.List = async ctx => {
  let items = await Q('workflow')
  return items
}

out.Patch = async ctx=>{
  let data = ctx.request.body
  let id = ctx.params.id
  let item = {
    flow_type:data.flow_type,
    name:data.name,
    desc:data.desc
  }
  await Q('workflow').update(item).where({id})
  return {}
}

out.Post = async ctx=>{
  let data = ctx.request.body
  let item = data
  item.id = U.createUUID()
  item.created_by = ctx.state.id
  item.created_at = U.getTimeStamp()
  await Q('workflow').insert(item)

  return {
    id:item.id,
    created_by:item.created_by,
    created_at:item.created_at
  }
}

out.Delete = async ctx=>{
  let id = ctx.params.id
  await Q('workflow').where({id}).del()
}

module.exports = out