const {Topic} = require('../../models')

let o = {}


o.List = async ctx=>{
  let query = ctx.query
  let condition = null
  if(query.project_id)
    condition = {where:{project_id:query.project_id}}  
  let items = await Topic.query(ctx.state,condition)
  return items
}

o.Post = async ctx=>{
  let data = ctx.request.body
  let updateInfo  =await Topic.create(ctx.state,data)
  return updateInfo
}

o.Get = async ctx=>{
  let id = ctx.params.id
  return await Topic.get(ctx.state,id)
}

o.Delete= async ctx=>{
  let id = ctx.params.id
  await Topic.remove(ctx.state,id)
}

o.Patch = async ctx=>{
  let id = ctx.params.id
  let data =ctx.request.body
  await Topic.update(ctx.state,id,data)
}

o.AddRelated = async ctx=>{
  let id =ctx.params.id
  let data =  ctx.request.body
  let related = ctx.params.related

  let updateInfo = await Topic.reply(ctx.state,id,data)
  return updateInfo
}

o.DelRelated = async ctx=>{
   let id = ctx.params.id
    let related = ctx.params.related
let relatedId = ctx.params.relatedId

    await Topic.removeReply(ctx.state,relatedId)
}

module.exports =  o