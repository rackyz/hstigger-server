const {Q,D,E} = require('../../models')

let out = {}

out.List = async ctx=>{
  let id = ctx.state.id
   if (!id)
     return E.E_USER_UNLOGIN

    let accs = await Q('accelerate').where('user_id',id)
    return accs
}


out.Post = async ctx=>{
  let id = ctx.state.id
  let data = ctx.request.body
  if(!id)
    return E.E_USER_UNLOGIN
  
  if (!Array.isArray(data))
    throw E.E_INVALID_DATA
  let param = data.map(v=>({user_id:id,key:v}))
  
  await Q('accelerate').where('user_id',id).del()
  await Q('accelerate').insert(param)
}


module.exports = out