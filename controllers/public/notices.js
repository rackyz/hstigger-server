const {
  Message
} = require('../../models')
let out = {}

out.Get = async ctx=>{
  let id = ctx.params.id
  let items = await Message.getNotice({enterprise_id:"NBGZ"},id)
  return items
}

module.exports = out