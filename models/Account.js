const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Type = require('./Type')
const Message = require('./Message')
const Enterprise = require('./Enterprise')
const Module = require('./Module')
const Permission = require('./Permission')
const Flow = require('./Flow')
const File = require('./File')
const Dep = require('./Dep')
const Role = require('./Role')
const Task = require('./Task')
const FlowInstance = require('./FlowInstance')
const { UserLogger } = require('../base/logger')
const PMIS = require('./PMIS')
const o = {
  required:['Type','Enterprise','Message']
}


// Database Initalization
const TABLE_ACCOUNT = 'account'
const TABLE_ACCOUNT_ENTERPRISE = 'account_enterprise'
const TABLE_USER_SETTING = 'user_setting'
const TABLE_USER_MENU = 'user_menu'
const TABLE_USER_ACTION_MENU = 'user_action_menu'
const TABLE_ENTERPRISE = "enterprise"
const TABLE_USER_RSS = "user_rss"
const TABLE_USER_FLOW = "user_flow"
const ACCOUNT_TYPES = [{
  key: 'GUEST',
  name: "体验账号",
  color:"#aaa"
}, {
  key: 'MEMBER',
  name: "正式用户",
  color:"orange"
}
,{
  key:'ADMIN',
  name:"管理账号",
  color:"red"
}]

o.initdb = async (forced) => {
  
 

  await MYSQL.initdb(TABLE_ACCOUNT, t => {
    t.string('id',64).index()
    t.string('user', 32).unique()
    t.string('phone', 16)
    t.string('name',16)
    t.string('password',64).notNull()
    t.string('avatar',256)
    t.string('frame',16).defaultTo("1")
    t.integer('type').defaultTo(0)
    t.boolean('locked').defaultTo(0)
    t.boolean('changed').defaultTo(false)
    t.datetime('lastlogin_at')
    t.datetime('created_at')
    t.bigInteger('ding_id')
    t.string('zzl_id',32)
    t.string('wechat_id',64)
    t.string('email')
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

  await MYSQL.initdb(TABLE_USER_RSS, t => {
    t.increments("id").index()
    t.string("user_id", 64).notNull()
    t.string("rss_id", 32).notNull()
  }, forced)

   await MYSQL.initdb(TABLE_USER_FLOW, t => {
     t.increments("id").index()
     t.string("user_id", 64).notNull()
     t.string("flow_id", 32).notNull()
   }, forced)



  await MYSQL.schema.raw(`ALTER TABLE ${TABLE_ACCOUNT} AUTO_INCREMENT=1000`)

  if(forced){
   let AccountType = await Type.AddType('AccountType', ACCOUNT_TYPES)
    let ROOT = {
      id:"ROOT",
      user:'root',
      phone:'19888821112',
      avatar:'https://nbgz-pmis-1257839135.cos.ap-shanghai.myqcloud.com/avatars/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20191105133509.jpg',
      frame:'7',
      type:AccountType.ADMIN,
      password:UTIL.encodeMD5('root'),
      created_at:UTIL.getTimeStamp()
    }

    let JBKT = {
      id: "JBKT",
      user:'jbkt',
      phone:'1000',
      avatar:'https://file-1301671707.cos.ap-chengdu.myqcloud.com/jbkt.png',
      frame:'6',
      type: AccountType.MEMBER,
      password:UTIL.encodeMD5('123456'),
      created_at:UTIL.getTimeStamp()
    }

    let NBGZ = {
      id: "NBGZ",
      user:'nbgz',
      phone:'1001',
      avatar:'https://file-1301671707.cos.ap-chengdu.myqcloud.com/nbgz.png',
      frame:'6',
      type: AccountType.MEMBER,
      password:UTIL.encodeMD5('123456'),
      created_at:UTIL.getTimeStamp()
    }

     let TEST = {
       id:"TEST",
       user: 'test',
       phone: '1324',
       avatar: 'https://nbgz-pmis-1257839135.cos.ap-shanghai.myqcloud.com/system/hr.png',
       frame: '3',
       type: AccountType.GUEST,
       password: UTIL.encodeMD5('test'),
       created_at: UTIL.getTimeStamp()
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

    const DEFAULT_MENUS = [{
      user_id:ROOT.id,
      key:"ADMIN"
    },{
      user_id:ROOT.id,
      key:"EADMIN"
    }]

    await MYSQL(TABLE_ACCOUNT).where(true).del()
    await MYSQL(TABLE_ACCOUNT).insert([ROOT, JBKT, NBGZ, TEST])
    await MYSQL(TABLE_ACCOUNT_ENTERPRISE).del()
    await MYSQL(TABLE_ACCOUNT_ENTERPRISE).insert(Relations)
    await MYSQL(TABLE_USER_MENU).del()
    await MYSQL(TABLE_USER_ACTION_MENU).del()
    await MYSQL(TABLE_USER_MENU).insert(DEFAULT_MENUS)
   

  }
}


// Inner Method
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

o.getAuthInfo = async (id)=>{
  let user = await MYSQL(TABLE_ACCOUNT).first('id', 'phone', 'type').where({
    id
  })
  if(user.type == 3)
    user.admin = true
  return user
}

// PLATFORM ADMIN API - ADMINISTRACT
o.getList = async ()=>{
  let users = await MYSQL(TABLE_ACCOUNT).select('id', 'avatar', 'user','type','phone', 'frame','created_at','lastlogin_at','email','zzl_id','ding_id','wechat_id','name').orderBy('type','desc').orderBy('created_at','asc')
  return users
}

o.getUserList = async ()=>{
  let users = await MYSQL(TABLE_ACCOUNT).select('id','avatar','user','phone','frame','name')
  return users
}

o.ListUsersByEnterprise = async (ent_id)=>{
  let items = await MYSQL(TABLE_ACCOUNT_ENTERPRISE).select('user_id').where({
    enterprise_id:ent_id
  })
  let users = await MYSQL(TABLE_ACCOUNT).whereIn('id',items.map(v=>v.user_id)).where("type",1)
  let user_id_list = users.map(v=>v.id)
  if(user_id_list.length > 0){
    let depRelations = await Dep.listRelations(ent_id,{in:{user_id:user_id_list}})
    let roleRelatios = await Role.listRelations(ent_id,{in:{user_id:user_id_list}})
      users.forEach(v => {
        v.deps = depRelations.filter(r => r.user_id == v.id).map(r => r.dep_id)
        v.roles = roleRelatios.filter(r => r.user_id == v.id).map(r => r.role_id)
      })
  }

 

  return users
}

o.getUserEnterprises = async (user_id)=>{
  let items = await MYSQL(TABLE_ACCOUNT_ENTERPRISE).where({
    user_id
  })
  return items.map(v=>v.enterprise_id)
}



o.getUserInfo = async (user_id,ent_id,isEntAdmin,isAdmin)=>{
  if(!user_id)
    return EXCEPTION.E_INVALID_DATA
  let user = await MYSQL(TABLE_ACCOUNT).first('id','user','name','phone','avatar','frame','email','type','lastlogin_at','created_at').where('id',user_id)
  if(!user)
    throw EXCEPTION.E_USER_UNREGISTERATED
 
  user.my_enterprises = await o.getUserEnterprises(user_id)
  if(!ent_id && user.my_enterprises.length > 0)
    ent_id = user.my_enterprises[0]
  user.unread_msg_count = await Message.listMineUnreadCount({
    id:user_id,
    enterprise_id: ent_id
  })
  user.messages = await Message.listMine({
    id: user_id,
    enterprise_id: ent_id
  }, {
    q: "mine"
  })
  
  user.task_count = 3
  user.my_tasks = await Task.listMine({id:user_id,ent_id},ent_id)
  user.user_settings = await o.getUserSettings(user_id)
  user.user_menus = await o.getMenus(user_id)
  user.user_actions = await o.getActionMenus(user_id)
  user.modules = await Module.getAuthedModules(user_id,ent_id,isEntAdmin,isAdmin)
  user.permissions = await Role.getUserACL({},user_id,ent_id)
  user.flows = await Flow.GetUserFlows(user_id)
  user.user_flows = await o.getFlows(user_id,ent_id)
  user.user_rss = await o.getRss(user_id)
  user.coskey = File.AuthCOS()
  user.isEntAdmin = isEntAdmin
  user.isAdmin = isAdmin
  user.my_deps = await Dep.getUserDeps(user_id,ent_id) 
  user.my_roles = await Role.getUserRoles({},user_id, ent_id)
  
//  user.my_projects = await PMIS.GetUserProject(user.name)
  return user
}

o.getFlows = async (user_id,ent_id)=>{
  if(!ent_id)
    return []
  let res = await MYSQL("enterprise_flow").select('flow_id').where({
    ent_id
  })
  return res.map(v => v.flow_id)
}

o.getRss = async (user_id)=>{
   if (!user_id)
     return EXCEPTION.E_INVALID_DATA
  let res = await MYSQL(TABLE_USER_RSS).select('id').where({
    user_id
  })
  return res.map(v=>v.id)
}

o.setRss = async (user_id, rss_list)=>{
  if(!user_id || !Array.isArray(rss_list) || rss_list.length == 0)
    return EXCEPTION.E_INVALID_DATA
  await MYSQL(TABLE_USER_RSS).where({
    user_id
  }).del()
  await MYSQL(TABLE_USER_RSS).insert(rss_list.map(v => ({
    user_id,
    rss_id: v
  })))
}

o.getPhoneFromAccount = async (account)=>{
  if(!account)
    throw EXCEPTION.E_INVALID_DATA
  let user = await MYSQL(TABLE_ACCOUNT).first('phone').where('user',account).orWhere('phone',account)
  if(!user)
    throw EXCEPTION.E_USER_UNREGISTERATED
  return user.phone
}

o.changePwd = async (account,password,op)=>{
  if(!account || !password)
    throw(EXCEPTION.E_INVALID_DATA)
  let user = await MYSQL(TABLE_ACCOUNT).first('id').where('user',account).orWhere('phone',account)
  if(!user)
    throw EXCEPTION.E_USER_UNREGISTERATED
  await MYSQL(TABLE_ACCOUNT).update({password,changed:true}).where({id:user.id})
  UserLogger.info(`${op} 修改了用户${user.id}的密码}`)
}

// out methods
o.create = async (data)=>{
  if(!data) 
    throw EXCEPTION.E_INVALID_DATA
  let updateInfo = {
    id:UTIL.createUUID(),
    created_at:UTIL.getTimeStamp(),
    type:1,
    locked:false,
    changed:false,
    frame:1,
  }
  Object.assign(data,updateInfo)
  data.password = UTIL.encodeMD5("123456")
  await MYSQL(TABLE_ACCOUNT).insert(data)
  return updateInfo
}

o.createAccounts = async (data,op)=>{
  if (!data || !Array.isArray(data) || data.length == 0)
    throw EXCEPTION.E_INVALID_DATA
  
  let updateInfoArray = []
  let updateData = []
  data.forEach(v=>{
    let updateInfo = {
      id: UTIL.createUUID(),
      created_at: UTIL.getTimeStamp()
    }
    let o = Object.assign(v,updateInfo)
    if(!o.password)
      o.password = UTIL.encodeMD5("123456")

    updateInfoArray.push(updateInfo)
    updateData.push(o)
  })

  await MYSQL(TABLE_ACCOUNT).insert(updateData)
   UserLogger.info(`${op} 创建了用户 ${updateData.map(v=>v.user).join(',')}`)
  return updateInfoArray
}

o.update = async (id,{user,avatar,frame,email,phone,type},op)=>{
  if(!id)
    throw EXCEPTION.E_INVALID_DATA

  let account = await MYSQL(TABLE_ACCOUNT).first('user','phone').where({id})
  if (user && account.user != user) {
    let u = await MYSQL(TABLE_ACCOUNT).first('id').where({user})
    if(u)
      throw EXCEPTION.E_USER_USER_EXIST
  }

  if (phone && account.phone != phone) {
    let u = await MYSQL(TABLE_ACCOUNT).first('id').where({
      phone
    })
    if(u)
      throw EXCEPTION.E_USER_PHONE_EXIST
  }
  
  await MYSQL(TABLE_ACCOUNT).update({
    user,
    avatar,
    frame,
    email,
    phone,
    type
  }).where({
    id
  })

  UserLogger.info(`${op} 更新了用户${id}的信息}`)
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
    type:1,
    password:UTIL.encodeMD5(temp_password),
    created_at:UTIL.getTimeStamp()
  }

  await MYSQL(TABLE_ACCOUNT).insert(account)
  Message.sendSMS('REGISTER',phone,[UTIL.maskPhone(phone),temp_password])
}

Enterprise.addEnterprise = async (user_id,enterprise_id)=>{
  if(!user_id || !enterprise_id)
    throw EXCEPTION.E_INVALID_DATA
  await MYSQL(TABLE_ACCOUNT_ENTERPRISE).insert({user_id,enterprise_id})
}

Enterprise.removeEnterprise = async (user_id,enterprise_id)=>{
  if (!user_id || !enterprise_id)
    throw EXCEPTION.E_INVALID_DATA
  await MYSQL(TABLE_ACCOUNT_ENTERPRISE).where({
    user_id,
    enterprise_id
  }).del()
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
  if(!user_id)
    throw EXCEPTION.E_INVALID_DATA
  let items = await MYSQL(TABLE_USER_ACTION_MENU).select('key').where({user_id})
  return items.map(v=>v.key)
}

o.remove = async (user_id_list,op) => {
  if(!Array.isArray(user_id_list))
    throw EXCEPTION.E_INVALID_DATA
  await MYSQL(TABLE_ACCOUNT).whereIn('id', user_id_list).del()
  UserLogger.info(`${op} 删除了用户 ${user_id_list.join(',')}`)
}

o.reset_password = async (id,op)=>{
  if(!id)
    throw EXCEPTION.E_INVALID_DATA
  await MYSQL(TABLE_ACCOUNT).update('password',UTIL.encodeMD5('123456')).where({id})
  UserLogger.info(`${op} 重置了用户 ${id} 的密码`)
  
}

o.change_password = async (account,password,op)=>{
  if(!account || !password)
    throw EXCEPTION.E_INVALID_DATA
  if(!op)
    throw EXCEPTION.E_DO_NOT_PERMITTED
  
  await MYSQL(TABLE_ACCOUNT).update({
    password:UTIL.encodeMD5('123456')
  }).where({
    user:account
  })
  UserLogger.info(`${op} 修改了用户 ${id}的密码`)
}

o.lock = async (id_list,op)=>{
  if(!Array.isArray(id_list))
    throw EXCEPTION.E_INVALID_DATA
  
  await MYSQL(TABLE_ACCOUNT).update({locked:1}).whereIn('id',id_list)
  UserLogger.info(`${op} 锁定了用户${id_list.join(',')}`)
}

o.unlock = async (id_list,op)=>{
   if (!Array.isArray(id_list))
     throw EXCEPTION.E_INVALID_DATA

   await MYSQL(TABLE_ACCOUNT).update({
     locked: 0
   }).whereIn('id', id_list)
   UserLogger.info(`${op} 解除了用户${id_list.join(',')}的锁定`)
}

o.removeAll = async (option)=>{
  await MYSQL(TABLE_ACCOUNT).where(option).del()
}

// GET USER ACTIVE FLOWS
o.getAllFlows = async (op)=>{
  let ent_list = await o.getUserEnterprises()
  for(let i=0;i<ent_list.length;i++)
    await FlowInstance.GetUserThread()
}

// GET USER INVOKED FLOWS

o.getUserPhone = async (user_id) => {
  let user = await MYSQL(TABLE_ACCOUNT).first('phone').where({
    id: user_id
  })
  if (user)
    return user.phone
}

////////////////////////////
//DD
//userid -> ding_id
//openId -> dingOpenId
//mobile -> phone
//name -> name
//departments


///////////////////////
o.UpdateFromDing = async (data,deps,zzls)=>{
  // update or create
  let isExist = await MYSQL(TABLE_ACCOUNT).first('id','ding_id').where('id',data.id).orWhere('ding_id',data.ding_id)
  if(isExist)
  {
    if (isExist.ding_id){
      return -1
    }
    await MYSQL(TABLE_ACCOUNT).update(data).where({id:data.id})
  }
  else{
    data.type = 1
    data.created_at = UTIL.getTimeStamp()
    data.password = UTIL.encodeMD5('123456')
    await MYSQL(TABLE_ACCOUNT).insert(data)
  }

  isExist = await MYSQL(TABLE_ACCOUNT_ENTERPRISE).first('id').where({user_id:data.id,enterprise_id:"NBGZ"})
  if(isExist)
    await MYSQL(TABLE_ACCOUNT_ENTERPRISE).insert({user_id:data.id,enterprise_id:"NBGZ"})
  if(Array.isArray(deps) && deps.length){
    await MYSQL.E('NBGZ','dep_employee').where({user_id:data.id}).del()
    await MYSQL.E('NBGZ','dep_employee').insert(deps.map(v=>({dep_id:v,user_id:data.id})))
  }
  
  
}

// CORE API
  // USER Change Self password
  o.Self_Change_Password = async (ctx,old,pass)=>{
    let op = ctx.op
    let validateOldPassword = await MYSQL(TABLE_ACCOUNT).first('id').where({id:op,password:old})
    if(!validateOldPassword)
      throw EXCEPTION.E_USER_INCCORECT_PASSWORD
    await MYSQL(TABLE_ACCOUNT).update('password',pass).where({id:op})
  }

  o.Self_Change_Info = async(ctx,data)=>{
    let {user,phone,email,avatar,frame} = data
    let op = ctx.op
    if(!op || Object.keys(data).length == 0)
      throw EXCEPTION.E_INVALID_DATA
    
    if(user){
      let existUser = await MYSQL(TABLE_ACCOUNT).first('id').where({user}).whereNot({id:op})
      if(existUser)
        throw EXCEPTION.E_USER_USER_EXIST
    }

    if(phone){
      let existPhone = await MYSQL(TABLE_ACCOUNT).first('id').where({phone}).whereNot({id:op})
      if(existPhone)
        throw EXCEPTION.E_PHONE_EXIST
    }

    await MYSQL(TABLE_ACCOUNT).update({user,phone,email,avatar,frame}).where({id:op})
  }

module.exports = o