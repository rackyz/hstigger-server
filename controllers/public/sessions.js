
const {Session,Ding} = require('../../models')

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

  //钉钉小程序接口
  if(ctx.headers['d-token'])
  {
    let dtoken = ctx.headers['d-token']
    let ding_id = await Ding.loginWithDDRest(dtoken)
    
    let loginInfo = await Session.createSessionByDingId(ding_id, device, ip)
    return loginInfo
  }
 
  let loginInfo = await Session.createSessionByLogin(account,password,device,ip)
  return loginInfo
}
out.PostDesc = "用户登录"
out.LOGIN = {
  url:"POST /public/sessions",
  desc:"用户登录的别名,返回当前会话信息"
}


out.Get = async ctx=>{
  let id = ctx.params.id
  if(id == "current"){
    let info = await Session.getSessionInfo(ctx.state.session_id,ctx.state.enterprise_id,ctx.state.isEntAdmin,ctx.state.isAdmin)
    return info
  }
  
}
out.WHOAMI = {
  url: "GET /public/sessions/current",
  desc: "由token获取当前用户会话信息"
}

out.GetDesc = "获取当前的"
out.GetThrowOption = {
  'MSG':'登录状态token已过期'
}

out.Delete = async ctx=>{
  let id = ctx.params.id
  let session = Session.deleteSession(id)
  return session
}
out.LOGOUT = {
  url: "DELETE /public/sessions/self",
  desc: "登出用户，清除状态缓存"
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

out.SEND_FORGET_VERIFY = {
  url: "POST /files/forget-vcode",
  desc: "<b>忘记密码</b>时，向用户发送手机验证码用于验证身份"
}



module.exports = out