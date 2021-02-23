const UTIL = require('../base/util')
const REDIS = require('../base/redis')
//const MYSQL = require('../base/mysql')
const EXCEPTION = require('../base/exception')

const ACCOUNT = require('./Account')
const SETTING = require('./Setting')
const TYPE = require('./Type')
const MESSAGE = require('./Message')
const ENTERPRISE = require('./Enterprise')
const MYSQL = require('../base/mysql')
const RSS = require('./Rss')
const Dep = require('./Dep')
const Project = require('./Project')
const Employee = require('./Employee')
const Contract = require('./Contract')
const Role = require('./Role')
const { E_INVALID_DATA } = require('../base/exception')
const o = {
  required:['Type']
}
//const TABLE_SESSION = "session"
const RKEY_SESSION = "SESSION_"
const RKEY_USER = "USER_"
const RKEY_FVCODE = "FVCODE_"
const RKEY_ONLINE = "ONLINE_USERS"
const RKEY_FORGET_CHANGE = "FORGET_"


o.initdb = async (forced) =>{
  if(forced)
    REDIS.DEL(RKEY_ONLINE)
}


const CreateSessionInRedis = async (session)=>{
  REDIS.SET_JSON(RKEY_SESSION + session.id,session)
  REDIS.EXPIRE(RKEY_SESSION + session.id,3600)
}

const CreateUserInRedis = async (user_id)=>{
  REDIS.SADD(RKEY_ONLINE,user_id)
  let userSessions = await REDIS.ASC_GET_JSON(RKEY_USER + user_id)
  if(Array.isArray(userSessions))
    REDIS.SET_JSON(RKEY_USER + user_id, userSessions.push(user_id))
  else
    REDIS.SET_JSON(RKEY_USER + user_id, [user_id])
}

const GetSystemInfo = async (ent_id)=>{
  let settings = await SETTING.getSettings('NEIP')
  let types = await TYPE.getTypes()
  let ent_types = ent_id ? await TYPE.getTypes(ent_id) :[]
  let users = await ACCOUNT.getUserList()
  let enterprises = await ENTERPRISE.getEnterpriseList()
  let rss = await RSS.list()
  let deps = ent_id ? await Dep.list(ent_id) : []
  let roles = ent_id ? await Role.list(ent_id) : []
  let projects = ent_id ? await Project.GetList(ent_id) : Project.GetList()
  let employees = await Employee.List({
    enterprise_id:ent_id
  })
  let contracts = ent_id?await Contract.list(ent_id) :[]
  //let deps = await
  return {
    settings,
    enterprises,
    types,
    users,
    rss,
    deps,
    ent_types,
    roles,
    projects,
    contracts,
    employees
  } 
}

// const GetEnterpriseInfo = async ()=>{

// }



// Create Session By Logining with account,password
o.createSessionByLogin = async (account,password,device,ip)=>{
  let userInfo = await ACCOUNT.login(account, password)
  let user_id = userInfo.id
  let session_id = UTIL.encodeJWT({id:user_id})
  let session = {
    id:session_id,
    user_id,
    account_type:userInfo.type,
    user:userInfo.user,
    device,
    ip,
    login_at:UTIL.getTimeStamp()
  }
 
  await CreateSessionInRedis(session)
  await CreateUserInRedis(user_id)

  let systemInfo = await GetSystemInfo()
  session.token = "Bearer " + session.id
  return {
    ...session,
    ...userInfo,
    ...systemInfo
  }
}

// Create Session By OAuth Login with user_id
o.createSessionById = async (user_id,device,ip)=>{
  let session_id = UTIL.encodeJWT({id:user_id})
  let session = {
    id: session_id,
    user_id,
    device,
    ip,
    login_at: UTIL.getTimeStamp()
  }

  await CreateSessionInRedis(session)
  await CreateUserInRedis(user_id)

  let userInfo = ACCOUNT.getUserInfo(user_id)
  let systemInfo = await GetSystemInfo()
  session.token = "Bearer " + session.id
  return {
    ...session,
    ...userInfo,
    ...systemInfo
  }
}

// Delete Session by logout
o.deleteSession = async (session_id)=>{
  REDIS.DEL(RKEY_SESSION+session_id)
}

// Get Session Info by session_id
o.getSessionInfo = async (session_id, ent_id,isEntAdmin,isAdmin) => {
  let session = await REDIS.ASC_GET_JSON(RKEY_SESSION+session_id)
  if(!session)
    throw 401 //( EXCEPTION.E_OUT_OF_DATE)
  let userInfo = await ACCOUNT.getUserInfo(session.user_id,ent_id,isEntAdmin,isAdmin)
  let employeeInfo = await Employee.Get({enterprise_id:ent_id},session.user_id)
  Object.assign(userInfo,employeeInfo)
  let systemInfo = await GetSystemInfo(ent_id)
  session.token = "Bearer " + session.id
  return {
    ...session,
    ...userInfo,
    ...systemInfo
  }
}

// Get Online User Count
o.getOnlineUserCount = async ()=>{
  let userIds = await REDIS.ASC_SMEMBERS(RKEY_ONLINE)
  let userIdsOnline = []
  for(let i=0;i<userIds.length;i++){
    let sessions = await REDIS.ASC_GET_JSON(RKEY_USER+userIds[i])
    let expired = true
    for(let i=0;i<sessions.length;i++){
      session = await REDIS.ASC_GET_JSON(RKEY_SESSION+sessions[i])
      if(session){
        expired = false
        break
      }
    }

    if(!expired)
      userIdsOnline.push(userIds[i])
    else
      REDIS.DEL(RKEY_USER+userIds[i])
  }

  return userIdsOnline.length
}


o.getSessionState = async token=>{
    let {id:user_id} = await UTIL.decodeJWT(token)
    if(!user_id)
      throw EXCEPTION.E_OUT_OF_DATE
    let session_id = token
    let sessionInfo = await REDIS.ASC_GET_JSON(RKEY_SESSION+session_id)
    if(!sessionInfo)
      throw 401 //EXCEPTION.E_OUT_OF_DATE
    REDIS.EXPIRE(RKEY_SESSION + session_id,3600)
    
    return {
      session_id,
      id:user_id,
      user:sessionInfo.user,
      account_type: sessionInfo.account_type,
      admin: sessionInfo.account_type == 2
    }
  
}


o.sendForgetVcode = async account=>{
  let phone = await ACCOUNT.getPhoneFromAccount(account)
  let vcode = UTIL.generateVerifyCode()
  REDIS.SET(RKEY_FVCODE+phone,vcode)
  REDIS.EXPIRE(RKEY_FVCODE+phone,1200)
  await MESSAGE.sendSMS("VCODE",phone,[vcode])
}

o.SimpleForget = async phone=>{
  if(!phone)
    throw E_INVALID_DATA
  let new_password = UTIL.encodeMD5(UTIL.generateVerifyCode())
  await MYSQL('account').update({password:new_password}).where({phone})

  await Message.sendSMS('REGISTER', phone, [UTIL.maskPhone(phone), new_password])
}

o.verifyForgetVcode = async (account,vcode)=>{
  let phone = await ACCOUNT.getPhoneFromAccount(account)
  let saved_vcode = await REDIS.ASC_GET(RKEY_FVCODE+phone)
  if(!saved_vcode || saved_vcode != vcode)
    throw(EXCEPTION.E_INCORRECT_VCODE)
  REDIS.DEL(RKEY_FVCODE)
  REDIS.SET(RKEY_FORGET_CHANGE+phone,true)
  REDIS.EXPIRE(RKEY_FORGET_CHANGE+phone,1200)
}

o.changeForgetPwd = async (account,password)=>{
  let phone = await ACCOUNT.getPhoneFromAccount(account)
  let permission = await REDIS.ASC_GET(RKEY_FORGET_CHANGE+phone)
  if(permission){
    await ACCOUNT.changePwd(phone,password)
    REDIS.DEL(RKEY_FORGET_CHANGE+phone)
  }
}

o.register = async phone=>{
  await ACCOUNT.register(phone)
}


module.exports = o