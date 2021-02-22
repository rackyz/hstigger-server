const {
  Employee
} = require('../../models')
let out = {}


out.Patch = async ctx=>{
  let state = ctx.state
  let id = ctx.params.id
  let data = ctx.request.data
  await Employee.ChangePersonalState(state,id,data)
}

module.exports = out