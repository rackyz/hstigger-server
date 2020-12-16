const {
  Flow
} = require('../models')

let out = {}

out.Get = async (ctx)=>{
  let id = ctx.params.id
  let uid = ctx.state.id
  let q =ctx.query.q
  if(q == 'node'){
    return await Flow.getNodes(id)
  }

  return await Flow.get(id,uid)
}


module.exports = out