const {Archive} = require('../../models')


let o = {}

o.List = async ctx=>{
  let project_id = ctx.query.project_id
  let dep_id = ctx.query.dep_id
  let state = ctx.state
  let condition = {}
  if(project_id)
    condition = {where:{project_id}}
  if(dep_id)
  {
    if(condition.where){
      condition.where.dep_id = dep_id
    }else{
      condition.where = {dep_id}
    }
  }
  let res = await Archive.query(state, condition, state.enterprise_id)
  return res
}

o.Get = async ctx=>{
  let id = ctx.params.id
  let state = ctx.state
  let res = await Archive.get(state,id,state.enterprise_id)
  return res
}

o.Post = async ctx=>{
  let data = ctx.request.body
   let state = ctx.state
  let res = await Archive.add(state, data, state.enterprise_id)
  return res
}

o.Patch = async ctx=>{
  let data = ctx.request.body
    let state = ctx.state
  let id = ctx.params.id
  let res = await Archive.patch(state,id,data,state.enterprise_id)
  return res
}

o.Delete = async ctx=>{
  let id = ctx.params.id
  let state = ctx.state
  await Archive.del(state,[id],state.enterprise_id)
}


module.exports = o