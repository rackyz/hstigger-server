const {Setting} = require("../../models")

let out = {}


out.Get = async ctx =>{
  let id = ctx.params.id
  if(id == 'login'){
    let setting = await Setting.getSettings('LOGIN')
    return setting
  }else if(id=='api'){
    let api_object = await Setting.getAPIObject(ctx.apiObject)
    return api_object
  }else{
    let user_id = ctx.state.id
    let value = await Setting.get(user_id,key)
    return value
  }
}

out.Patch = async ctx=>{
  let key = ctx.params.id
  let {value,user_id} = ctx.request.body
  if(!user_id) 
    user_id = ctx.state.id
  await Setting.set(user_id,key,value)
}


module.exports = out