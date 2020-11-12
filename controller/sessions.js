const {
  E,
  Session
} = require('../core')

let out = {}


out.Post = async ctx=>{
  let data = ctx.request.body
  let {account,password} = data
  let info = Session.Create({account,password})
  return info
}

out.Get = async ctx=>{
  let id = ctx.param.id
  let session = Session.Get(id)
  return session
}

out.Delete = async ctx=>{
  let id = ctx.param.id
  let session = Session.Delete(id)
  return session
}


out.PostAction = async ctx=>{
  let action = ctx.param.action
  let data = ctx.request.data
  if(action == 'forget'){

  }else if(action == 'change_pwd'){

  }else if(action == 'register'){
    
  }else{
    throw E.E_UNEXPECTED_ACTION
  }
}



module.exports = out