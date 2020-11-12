let out = {}
let {Q,E,U,D} = require('../../models/index')

out.List = async ctx=>{
  let list = await Q('article').select('title','type_id','inputor','inputTime','type_id','visibility_type','importance_type')
  
  return list
}

out.Get = async ctx=>{
  let id = ctx.params.id
  let item = await Q('article').first().where({id})
  item.tags = await Q('tag').where({type:'article',tar_id:id})
  return item
}


out.Post = async ctx=>{
  let data = ctx.request.body
   data.updator = data.inputor = ctx.state.id
  data.inputTime = U.getTimeStamp()
 data.updateTime = U.getTimeStamp()
  let id = await Q('article').returning('id').insert(data)
  return {
    id,
    updator:data.updator,
    updateTime:data.updateTime,
    inputor:data.inputor,
    inputTime:data.inputTime
  }
}


out.Patch = async ctx=>{
  let id = ctx.params.id
  data.updator = ctx.state.id
  data.updateTime = U.getTimeStamp()
  await Q('article').update(data).where({id})
  return {
      updator: data.updator,
      updateTime: data.updateTime,
  }
}


out.Delete = async ctx=>{
  let id = ctx.params.id
  await Q('article').where({id}).del()
  await Q('tag').where({type:'article',tar_id:id})
}


module.exports = out
