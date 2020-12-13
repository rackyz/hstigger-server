const {
  Flow
} = require('../models')

let out = {}

out.Get = async (ctx)=>{
  let id = ctx.params.id
  let uid = ctx.state.id
  return await Flow.get(id,uid)
}


module.exports = out