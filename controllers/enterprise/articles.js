// 专栏
const {Article} = require('../../models')
let out = {}

out.List = async ctx=>{
  let q = ctx.query.q
  if(q){
    return Article.query(ctx.state, {
      where:{article_type: q}
    }, ctx.state.enterprise_id)
  }
}

out.Post = async ctx => {
  let ent_id = ctx.state.enterprise_id
  let item = ctx.request.body
  
  let updateInfo = await Article.create(ctx.state,item,ent_id)
  return updateInfo
}

out.Patch = async ctx => {
  let id = ctx.params.id
  let ent_id = ctx.state.enterprise_id
  let item = ctx.request.body
  let updateInfo = await Article.patch(ctx.state,id,item,ent_id)
  return updateInfo
}

out.Delete = async ctx=>{
  let id = ctx.params.id
  let ent_id = ctx.state.enterprise_id
  await Article.remove(ctx.state,id,ent_id)
}

out.Get = async ctx=>{
  let id = ctx.params.id
  let ent_id = ctx.state.enterprise_id
  return await Article.get(ctx.state, id, ent_id)
}

module.exports = out