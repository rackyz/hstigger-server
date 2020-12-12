const {
  Flow
} = require('../models')

let out = {}

out.Get = async (ctx)=>{
  let id = ctx.params.id
  return await Flow.get(id)
}


module.exports = out