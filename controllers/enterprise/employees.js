const {
  Employee
} = require('../../models')
let out = {}


out.List = async ctx=>{
  let items = await Employee.List(ctx.state)
  return items
}

out.Patch = async ctx=>{
  let state = ctx.state
  let data = ctx.request.body

  await Employee.ChangePersonalState(state,data)
}

out.Get = async ctx=>{
  let id = ctx.params.id
  let ent_id = ctx.state.enterprise_id
  let employee = await Employee.Get(ctx.state,id)
  return employee
}

module.exports = out