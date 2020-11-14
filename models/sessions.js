// const {UTIL,MYSQL} = require('../base')
const REDIS = require('../base/redis')
const MYSQL = require('../base/mysql')
const EXCEPTION = require('../base/exception')
const o = {}
const ACCOUNT = require('./account')
const TABLE_SESSION = "session"

// o.initdb = async (forced) =>{
//   MYSQL.initdb(TABLE_SESSION, t=>{
//     t.string("id",64).index()
//     t.string("user_id",32).notNull()
//     t.string("device",64)
//     t.string("ip",32)
//     t.datetime("login_at")
//   })
// }

// Create Session By Logining with account,password
o.createSessionByLogin = async (account,password,device,ip)=>{
  let userinfo = await ACCOUNT.login(account, password)
  let session_id = UTIL.encodeJWT(user_id)
  let session = {
    id:session_id,
    user_id: userinfo.id,
    password,
    device,
    ip,
    login_at:UTIL.getTimeStamp()
  }

  // await MYSQL(TABLE_SESSION).insert(session)
  REDIS.SET('SESSION_'+session_id,session)
  REDIS.EXPIRE('SESSION_'+session_id,3600)
  REDIS.SADD('ONLINE_USERS',userinfo.id)
  let userSessions = await REDIS.GET('USER_'+userinfo.id)
  if(Array.isArray(userSessions))
    REDIS.SET('USER_' + userinfo.id, userSessions.push(user_id))
  else
    REDIS.SET('USER_' + userinfo.id, [user_id])

  let settings = await Setting.getSystemSetting()

  return {
    sessionInfo:session,
    userInfo,
    systemInfo,
    settings
  }
}

// Create Session By OAuth Login with user_id
o.createSessionById = (user_id,device,ip)=>{
  let session = {
    id: session_id,
    user_id,
    password,
    device,
    ip,
    login_at: UTIL.getTimeStamp()
  }

  REDIS.SET('SESSION_' + session_id, session)
  REDIS.EXPIRE('SESSION_' + session_id, 3600)
  REDIS.SADD('ONLINE_USERS', user_id)
  let userSessions = await REDIS.GET('USER_' + user_id)
  if (Array.isArray(userSessions))
    REDIS.SET('USER_' + user_id, userSessions.push(user_id))
  else
    REDIS.SET('USER_' + user_id, [user_id])

}

// Delete Session by logout
o.deleteSession = (session_id)=>{
  REDIS.DEL('SESSION_'+session_id)
}

// Get Session Info by session_id
o.getSession = async (session_id)=>{
  let session = await REDIS.GET('SESSION_'+session_id)
  if(!session)
    throw(EXCEPTION.E_SESSION_LOGIN_LATER)
  
  return session
}

// Get Online User Count
o.getOnlineUserCount = async ()=>{
  let userIds = await REDIS.SMEMBERS('ONLINE_USERS')
  let userIdsOnline = []
  for(let i=0;i<userIds.length;i++){
    let sessions = await REDIS.GET('USER_'+userIds[i])
    let expired = true
    for(let i=0;i<sessions.length;i++){
      session = await REDIS.GET('SESSION_'+sessions[i])
      if(session){
        expired = false
        break
      }
    }

    if(!expired)
      userIdsOnline.push(userIds[i])
    else
      REDIS.DEL('USER_'+userIds[i])
  }

  return userIdsOnline.length
}





module.exports = o