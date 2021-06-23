const {Dep} = require('../../models')

let o = {}

o.Get = async ctx=>{
  let id = ctx.params.id
  let item = await Dep.get(ctx.state,id)
  return item
}


module.exports = o