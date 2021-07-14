const {
  Employee
} = require('../../models')
let out = {}


out.List = async ctx=>{
  let items = await Employee.List(ctx.state)
  return items
}

out.Post = async ctx=>{
  let patch = ctx.query.patch
 
  if(patch){
     ctx.params.id = ctx.state.id
     return await out.Patch(ctx)
  }
    
}

out.Patch = async ctx=>{
  let state = ctx.state
  let data = ctx.request.body
  let id = ctx.params.id
  if(id == 'self')
    id = ctx.state.id
  console.log(id)
  let q = ctx.query.q
 
  if(id == 'self' || id == state.id)
  {
      await Employee.Update(state,id,data)
      return
  }
  await Employee.ChangePersonalState(state,data)
}

out.Get = async ctx=>{
  let id = ctx.params.id
  let ent_id = ctx.state.enterprise_id
  let employee = await Employee.Get(ctx.state,id)
  return employee
}

module.exports = out