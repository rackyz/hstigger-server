const {
  Message
} = require('../../models')
let out = {}


out.List = async ctx => {
  let items = await Message.listNotices(ctx.state)
  return items
}

out.Get = async ctx=>{
  let id = ctx.params.id
  let items = await Message.getNotice(ctx.state,id)
  return items
}

module.exports = out