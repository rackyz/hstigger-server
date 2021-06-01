const {
  TrainingClass
} = require('../../models')

let o = {}


o.List = async ctx => {
  let page = ctx.query.page ? parseInt(ctx.query.page):1
  let pagesize = ctx.query.pagesize ? parseInt(ctx.query.pagesize):20
  let items = await TrainingClass.query(ctx.state,{page,pagesize})
  return items
}

o.Get = async ctx=>{
  let id = ctx.params.id
  let item = await TrainingClass.get(ctx.state,id)
  return item
}

o.Post = async ctx => {
  let item = ctx.request.body
  let updateInfo = await TrainingClass.create(ctx.state,item)
  return updateInfo
}

o.Patch = async ctx => {
   let id = ctx.params.id
   let item = ctx.request.body
   let q = ctx.query.q
   let data = ctx.request.body
   if(q == 'join'){
     await TrainingClass.join(ctx.state,id)
 
   }else if(q == 'unjoin'){
     await TrainingClass.unjoin(ctx.state,id)
   }else if( q == 'joinlist'){
      await TrainingClass.joinlist(ctx.state,id,data)
   }else{
       await TrainingClass.update(ctx.state, id, item)
   }

  
}

o.Delete = async ctx=>{
  let id = ctx.params.id
  await TrainingClass.remove(ctx.state,id)
}

module.exports = o