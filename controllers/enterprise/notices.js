const {
  Message
} = require('../../models')
let out = {}


out.List = async ctx => {
  let items = await Message.listNotices(ctx.state)
  return items
}

module.exports = out