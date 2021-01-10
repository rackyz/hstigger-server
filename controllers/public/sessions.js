
const {Session} = require('../../models')
const {ContextParser} = require('../../base/util')
const E = require('../../base/exception')
let out = {}

out.Name = "会话/用户登录"
out.Desc = "高专企业信息平台是基于<b>jwt-token</b>令牌验证的用户登录机制,首次调用<b>POST /sessions</b>由进行登录后,通过<b>Bearea token</b>作为<b>headers.Authorization</b>字段直接获取登录状态及Session信息"

out.Post = async ctx=>{
  let data = ctx.request.body
  let {account,password} = data
  
  let device  = ContextParser.getDevice(ctx)
  let ip = ContextParser.getIP(ctx)
  let loginInfo = await Session.createSessionByLogin(account,password,device,ip)
  return loginInfo
}
out.PostDesc = "用户登录"
out.LOGIN = {
  url:"POST /sessions",
  desc:"用户登录的别名,返回当前会话信息"
}

out.WHOAMI = {
  url:"GET /session",
  desc:"由token获取当前用户会话信息"
}
out.Get = async ctx=>{
  let id = ctx.params.id
  if(id == "current"){
    let info = await Session.getSessionInfo(ctx.state.session_id,ctx.state.enterprise_id,ctx.state.isEntAdmin,ctx.state.isAdmin)
    return info
  }
  
}

out.Delete = async ctx=>{
  let id = ctx.param.id
  let session = Session.Delete(id)
  return session
}


out.SEND_FORGET_VERIFY = {
  url:"POST /files/forget-vcode",
  desc:"<b>忘记密码</b>时，向用户发送手机验证码用于验证身份"
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
  }else if(action == 'foregt2'){
    let {phone} = data
    await Session.SimpleForget(phone)
  }else if(action == 'changepwd'){
    let {account,password} = data
    await Session.changeForgetPwd(account,password)
  }else if(action == 'register'){
    let {phone} = data
    await Session.register(phone)   
  }else if(action =='debug'){
    let uid = data.id
     let loginInfo = await Session.createSessionById(uid)
     let info = await Session.getSessionInfo(loginInfo.id)
     return info
  }else{
    throw E.E_UNEXPECTED_ACTION
  }
}



module.exports = out