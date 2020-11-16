const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Type = require('./Type')
const Message = require('./Message')
const Enterprise = require('./Enterprise')
const Module = require('./Module')
const Setting = require('./Setting')
const o = {
  required:['Type','Enterprise','Message']
}

// Database Initalization
const TABLE_ACCOUNT = 'account'
const TABLE_ACCOUNT_ENTERPRISE = 'account_enterprise'
const TABLE_USER_SETTING = 'user_setting'
const TABLE_USER_MENU = 'user_menu'
const TABLE_USER_ACTION_MENU = 'user_action_menu'

const ACCOUNT_TYPES = ['GUEST','MEMBER','ENTERPRISE','ADMIN']

o.initdb = async (forced) => {
  let AccountType = await Type.AddType('AccountType',ACCOUNT_TYPES)

  await MYSQL.initdb(TABLE_ACCOUNT, t => {
    t.string('id',64).index()
    t.string('user', 16).notNull()
    t.string('phone', 16).notNull()
    t.string('password',64).notNull()
    t.string('avatar',128)
    t.string('frame',16).defaultTo("1")
    t.integer('type').defaultTo(0)
    t.boolean('locked').defaultTo(0)
    t.boolean('changed').defaultTo(false)
    t.datetime('lastlogin_at')
    t.datetime('created_at')
  }, forced)

  await MYSQL.initdb(TABLE_ACCOUNT_ENTERPRISE,t=>{
    t.increments('id').index()
    t.string('user_id',64)
    t.string('enterprise_id',64)
  },forced)

  await MYSQL.initdb(TABLE_USER_SETTING,t=>{
    t.increments("id").index()
    t.string("user_id",64).notNull()
    t.string("key",32)
    t.string("value",128)
  },forced)

  await MYSQL.initdb(TABLE_USER_MENU,t=>{
    t.increments("id").index()
    t.string("user_id",64).notNull()
    t.string("key",32).notNull()
  },forced)

  await MYSQL.initdb(TABLE_USER_ACTION_MENU,t=>{
    t.increments("id").index()
    t.string("user_id",64).notNull()
    t.string("key",32).notNull()
  },forced)

  await MYSQL.schema.raw(`ALTER TABLE ${TABLE_ACCOUNT} AUTO_INCREMENT=1000`)

  let ROOT = {
    id:UTIL.createUUID(),
    user:'root',
    phone:'19888821112',
    avatar:'https://file-1301671707.cos.ap-chengdu.myqcloud.com/nbgz.png',
    frame:'7',
    type:AccountType.ADMIN,
    password:UTIL.encodeMD5('root'),
    created_at:UTIL.getTimeStamp()
  }

  let JBKT = {
    id: UTIL.createUUID(),
    user:'jbkt',
    phone:'1000',
    avatar:'https://file-1301671707.cos.ap-chengdu.myqcloud.com/jbkt.png',
    frame:'6',
    type:AccountType.Enterprise,
    password:UTIL.encodeMD5('123456'),
    created_at:UTIL.getTimeStamp()
  }

  let NBGZ = {
    id: UTIL.createUUID(),
    user:'nbgz',
    phone:'1001',
    avatar:'https://file-1301671707.cos.ap-chengdu.myqcloud.com/nbgz.png',
    frame:'6',
    type:AccountType.Enterprise,
    password:UTIL.encodeMD5('123456'),
    created_at:UTIL.getTimeStamp()
  }

  let Relations = [{
    user_id:JBKT.id,
    enterprise_id:Enterprise.initdata.JBKT.id
  },{
    user_id:NBGZ.id,
    enterprise_id:Enterprise.initdata.NBGZ.id
  },
{
  user_id: ROOT.id,
  enterprise_id: Enterprise.initdata.JBKT.id
}, {
  user_id: ROOT.id,
  enterprise_id: Enterprise.initdata.NBGZ.id
}]

  if(forced){
    await MYSQL(TABLE_ACCOUNT).where(true).del()
    await MYSQL(TABLE_ACCOUNT).insert([ROOT,JBKT,NBGZ])
    await MYSQL(TABLE_ACCOUNT_ENTERPRISE).insert(Relations)
    await MYSQL(TABLE_USER_MENU).del()
    await MYSQL(TABLE_USER_ACTION_MENU).del()

    await Message.Create(ROOT.id,JBKT.id,"企业账号注册成功,欢迎使用")
    await Message.Create(ROOT.id,NBGZ.id,"企业账号注册成功,欢迎使用")
  }
}


o.login = async (account,password)=>{
  if(!account || !password)
    throw EXCEPTION.E_INVALID_DATA

  let user = await MYSQL(TABLE_ACCOUNT).first('id','password','locked').where('user',account).orWhere('phone',account)
  if(!user)
    throw EXCEPTION.E_USER_UNREGISTERATED

  if(user.password != password)
    throw EXCEPTION.E_USER_INCCORECT_PASSWORD

  if(user.locked)
    throw EXCEPTION.E_USER_LOCKED
  await MYSQL(TABLE_ACCOUNT).update('lastlogin_at',UTIL.getTimeStamp()).where('id',user.id)
  let userinfo = await o.getUserInfo(user.id)

  return userinfo
}

o.getUserList = async ()=>{
  let users = await MYSQL(TABLE_ACCOUNT).select('id','avatar','user','phone','frame')
  return users
}

o.getUserEnterprises = async (user_id)=>{


  let items = await MYSQL(TABLE_ACCOUNT_ENTERPRISE).where({
    user_id
  })
  return items.map(v=>v.enterprise_id)
}

o.getUserInfo = async (user_id)=>{
  let user = await MYSQL(TABLE_ACCOUNT).first('id','user','phone','avatar','frame','type','lastlogin_at','created_at').where('id',user_id)
  if(!user)
    throw EXCEPTION.E_USER_UNREGISTERATED
  
  user.my_enterprises = await o.getUserEnterprises(user_id)
  user.unread_msg_count = await Message.getUnreadMessageCount(user_id)
  user.task_count = 3
  user.user_settings = await o.getUserSettings(user_id)
  user.user_menus = await o.getMenus(user_id)
  user.user_actions = await o.getActionMenus(user_id)
  user.modules = await Module.GetUserModules(user_id)

  return user
}

o.getPhoneFromAccount = async (account)=>{
  let user = await MYSQL(TABLE_ACCOUNT).first('phone').where('user',account).orWhere('phone',account)
  if(!user)
    throw EXCEPTION.E_USER_UNREGISTERATED
  return user.phone
}

o.changePwd = async (account,password)=>{
  let user = await MYSQL(TABLE_ACCOUNT).first('id').where('user',account).orWhere('phone',account)
  if(!user)
    throw EXCEPTION.E_USER_UNREGISTERATED
  await MYSQL(TABLE_ACCOUNT).update({password,changed:true}).where({id:user.id})
}

o.register = async (phone)=>{
  let user = await MYSQL(TABLE_ACCOUNT).first('id').where('phone',phone)
  if(user){
    throw EXCEPTION.E_PHONE_EXIST
  }
  
  let temp_password = UTIL.generateVerifyCode()
  let account = {
    id:UTIL.createUUID(),
    user:phone,
    phone,
    type:0,
    password:UTIL.encodeMD5(temp_password),
    created_at:UTIL.getTimeStamp()
  }

  await MYSQL(TABLE_ACCOUNT).insert(account)
  Message.sendSMS('REGISTER',phone,[UTIL.maskPhone(phone),temp_password])
}


o.getUserSettings = async (user_id)=>{
  if(!user_id)
    throw EXCEPTION.E_INVALID_DATA

  let settings = await MYSQL(TABLE_USER_SETTING).where({user_id})
  let res = {}
  settings.forEach(v=>{
    if(v.value != null)
      res[v.key] = v.value 
    else
      res[v.key] = v.id
  })

  return res
}

o.getSetting = async (user_id,key)=>{
  let setting = await MYSQL(TABLE_USER_SETTING).first('value').where({user_id,key})
  if(setting)
    return setting.value
}

o.setSetting = async (user_id,key,value = "")=>{
  if(!user_id || !key)
    throw EXCEPTION.E_INVALID_DATA

  let exist = await MYSQL(TABLE_USER_SETTING).first('id').where({user_id,key})
  if(exist)
    await MYSQL(TABLE_USER_SETTING).where({user_id,key}).del()
  await MYSQL(TABLE_USER_SETTING).insert({user_id,key,value})
}


o.setMenus = async (user_id,menus)=>{
  await MYSQL(TABLE_USER_MENU).where({user_id}).del()
  await MYSQL(TABLE_USER_MENU).insert(menus.map(v=>({user_id,key:v})))
}

o.getMenus = async (user_id)=>{
  let items = await MYSQL(TABLE_USER_MENU).select('key').where({user_id})
  return items.map(v=>v.key)
}

o.setActionMenus = async (user_id,menus)=>{
  await MYSQL(TABLE_USER_ACTION_MENU).where({user_id}).del()
  await MYSQL(TABLE_USER_ACTION_MENU).insert(menus.map(v=>({user_id,key:v})))
}

o.getActionMenus = async (user_id)=>{
  let items = await MYSQL(TABLE_USER_ACTION_MENU).select('key').where({user_id})
  return items.map(v=>v.key)
}

module.exports = o