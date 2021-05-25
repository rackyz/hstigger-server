const {
  Message
} = require('../../models')
let out = {}


out.List = async ctx => {
  let query = ctx.query
  let q = query.q
  if(q == 'count'){
    let counts = await Message.listMineUnreadCount(ctx.state,true)
    return counts
  }

  condition = {
    page:parseInt(query.page),
  }
  if (query.msg_type)
    condition.where = {
      msg_type:parseInt(query.msg_type)
    }

  if(q == 'mine'){
    let items = await Message.listMine(ctx.state, condition)
    return items
  }else{

    return []
  }
  
}

out.Post = async ctx=>{
  let data = ctx.request.body
  await Message.create(ctx.state,data,ctx.state.enterprise_id)
}

out.PostAction = async ctx=>{
  let data = ctx.request.body
  let action = ctx.params.action
  if(action == 'read'){
    await Message.mark_readed(ctx.state,data,ctx.state.enterprise_id)
  }else if(action == 'delete'){
    console.log(data)
    await Message.removeList(ctx.state,data,ctx.state.enterprise_id)
  }
}

out.Get = async ctx => {
  let id = ctx.params.id
  let ent_id = ctx.state.enterprise_id
  let employee = await Message.get(ctx.state, id, ent_id)
  return employee
}

out.Delete = async ctx=>{
  let id = ctx.params.id
  let ent_id = ctx.state.enterprise_id
  await Message.removeList(ctx.state, [id], ent_id)
}

module.exports = out