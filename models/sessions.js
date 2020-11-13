// const {UTIL,MYSQL} = require('../base')
const REDIS = require('../base/redis')
const MYSQL = require('../base/mysql')
const EXCEPTION = require('../base/exception')
const o = {}
const ACCOUNT = require('./account')
const TABLE_SESSION = "session"

o.initdb = async (forced) =>{
  MYSQL.initdb(TABLE_SESSION, t=>{
    t.string("id",64).index()
    t.string("user_id",32).notNull()
    t.string("device",64)
    t.string("ip",32)
    t.datetime("login_at")
  })
}


o.createSessionByLogin = async (user,password)=>{
 
  
}

o.createSessionById = (user_id)=>{

}

o.deleteSession = (session_id)=>{

}

o.getSession = (session_id)=>{

}

o.getOnlineUser = ()=>{

}





module.exports = o