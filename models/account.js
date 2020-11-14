const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const o = {}

// Database Initalization
const TABLE_ACCOUNT = 'account'

o.initdb = async (forced) => {
  await MYSQL.initdb(TABLE_ACCOUNT, t => {
    t.string('id',64).index()
    t.string('user', 16).notNull()
    t.string('phone', 16).notNull()
    t.string('password',64).notNull()
    t.string('avatar',128)
    t.string('frame',16)
    t.boolean('locked').defaultTo(0)
    t.datetime('lastlogin_at')
    t.datetime('created_at')
  }, forced)

  await MYSQL.schema.raw(`ALTER TABLE ${TABLE_ACCOUNT} AUTO_INCREMENT=1000`)

  let ROOT = {
    id:UTIL.createUUID(),
    user:'root',
    phone:'15991913205',
    avatar:'',
    frame:'07',
    password:UTIL.MD5('root'),
    created_at:UTIL.getTimeStamp()
  }

  if(forced){
    await MYSQL(TABLE_ACCOUNT).where(true).del()
    await MYSQL(TABLE_ACCOUNT).insert(ROOT)
  }
 
}


o.login = async (account,password)=>{
  if(!account || !password)
    throw EXCEPTION.E_INVALID_DATA

  let user = await MYSQL('account').first('id','password','locked').where('user',account).orWhere('phone',account)
  if(!user)
    throw EXCEPTION.E_USER_UNREGISTERATED

  if(user.password != password)
    throw EXCEPTION.E_USER_INCCORECT_PASSWORD

  if(user.locked)
    throw EXCEPTION.E_USER_LOCKED

  let userinfo = await o.getUserInfo()

  return userinfo
}


o.getUserInfo = async (user_id)=>{
  let user = await MYSQL('account').first('id','user','phone','avatar','frame','lastlogin_at','created_at').where('id',user_id)
  if(!user)
    throw EXCEPTION.E_USER_UNREGISTERATED
  
  return user
}





module.exports = o