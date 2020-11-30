
const {Session} = require('../models')
const {ContextParser} = require('../base/util')
let out = {}


out.Post = async ctx=>{
  let data = ctx.request.body
  let {account,password} = data
  
  let device  = ContextParser.getDevice(ctx)
  let ip = ContextParser.getIP(ctx)
  let loginInfo = await Session.createSessionByLogin(account,password,device,ip)
  return loginInfo
}

out.Get = async ctx=>{
  let id = ctx.params.id
  if(id == "current"){
    let info = Session.getSessionInfo(ctx.state.session_id,ctx.state.enterprise_id)
    return info
  }
  
}

out.Delete = async ctx=>{
  let id = ctx.param.id
  let session = Session.Delete(id)
  return session
}


out.PostAction = async ctx=>{
  let action = ctx.params.action
  let data = ctx.request.body
  if(action =='forget-vcode'){
    let {account} = data
    await Session.sendForgetVcode(account)
  }else if(action == 'forget'){
    let {account,vcode} = data
    await Session.verifyForgetVcode(account,vcode)
  }else if(action == 'changepwd'){
    let {account,password} = data
    await Session.changeForgetPwd(account,password)
  }else if(action == 'register'){
    let {phone} = data
    await Session.register(phone)   
  }else{
    throw E.E_UNEXPECTED_ACTION
  }
}



module.exports = out