const {
  TrainingClass
} = require('../../models')

let o = {}

o.List = async ctx => {
  let p = ctx.query.project
  let items = []
  if(ctx.query.project)
     items = await TrainingClass.listAppraisal(ctx.state, project_id)
  else
    items = await TrainingClass.listAppraisals()
  return items
}

o.Get = async ctx=>{
  let id = ctx.params.id
  let item = await TrainingClass.getAppraisal(ctx.state,id)
  return item
}

o.Delete = async ctx=>{
  let id = ctx.params.id
  await TrainingClass.removeAppraisal(ctx.state,id)
}

o.Patch = async ctx=>{
  let id = ctx.params.id
  let data = ctx.request.body
  let q = ctx.query.q
  if(q == 'eval')
    await TrainingClass.eval(ctx.state,id,data)
  else if(q == 'add')
    await TrainingClass.addAppraisalUsers(ctx,id,data)
  else if(q == 'remove')
    await TrainingClass.removeAppraisalUsers(ctx,id,data)
  return
}



module.exports = o