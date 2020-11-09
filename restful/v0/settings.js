const moment = require('moment')
const {
  Q,
  E,
  U,
  R,
  D
} = require('../../models')

let out = {}

const GetOnlineUsersId = async (expireTime=30)=>{
  return new Promise((resolve,reject)=>{
    R.hgetall('ONLINE_USERS',(err,hash)=>{
      if(err)
        resolve(err)
      let users = []
      if(hash)
        users = Object.keys(hash).filter(key => moment(hash[key]).add(expireTime, 'minute').isAfter(moment()))
      
      resolve(users)
    })
  })
}

out.Get = async ctx=>{
  let id = ctx.params.id
  if(id == 'login'){

    return {
      ENABLE_REGISTER:true,
      ENABLE_OAUTH_LOGIN:true
    }
  }else if(id == 'status'){
    return {
      ONLINE_USERS: await GetOnlineUsersId()
    }
  }
}

// cannt send over 5 messages to same phone during 1 hour
const CheckPhoneMessageSafety = async (phone) => {
  return new Promise((resolve, reject) => {
    let PHONE_MSG_COUNT_KEY = 'PMCK_' + phone
    R.get(PHONE_MSG_COUNT_KEY, (err, data) => {
      if (data > 5) {
        resolve(true)
      }
      R.incr(PHONE_MSG_COUNT_KEY)
      resolve(false)
    })
    R.expire(PHONE_MSG_COUNT_KEY, 3600)
  })
}

const CheckVerifyCode = async (phone,vcode) =>{
  return new Promise((resolve,reject)=>{
    let PHONE_VCODE_KEY = 'VCODE_'+phone
    R.get(PHONE_VCODE_KEY,(err,data)=>{
      if(data === vcode){
        resolve(true)
      }else
        resolve(false)
    })
  })
}

const GetPhoneFromAccount = async (account)=>{
   if (!account)
     throw (E_INVALID_DATA)
   // 1 - find user phone
   let user = await Q('user').first('id', 'phone').where(q => {
     q.where('phone', account).orWhere('user', account)
   })
   if (!user)
     throw (E.E_USER_UNREGISTERATED)

   let phone = user.phone
   if (!U.test('phone', phone)) {
     throw (E.E_TEST_INVALID_PHONE_NUMBER)
   }

   return phone
}

const CheckChangePwdSafety = async (phone)=>{
  return new Promise((resolve,reject)=>{
    let CHANGE_PWD_SAFE_KEY = 'CHANGE_PWD_'+phone
    R.get(CHANGE_PWD_SAFE_KEY,(err,data)=>{
      if(data)
        resolve(true)
      else
        resolve(false)
      })
  })
}

out.PostAction = async ctx => {
  let action = ctx.params.action
  let data = ctx.request.body
  if (action == 'vcode') {
    let vcode = U.generateVerifyCode()
    let account = data.account
    let phone = await GetPhoneFromAccount(account)
    let isOutOfPhoneMessageLimit = await CheckPhoneMessageSafety()
    if (isOutOfPhoneMessageLimit)
      throw (E.E_SMS_OUT_OF_LIMIT)
    D('MSG', isOutOfPhoneMessageLimit)
    let VCODE_KEY = 'VCODE_' + phone
    try{
      R.set(VCODE_KEY, vcode)
      R.expire(VCODE_KEY, 300)
      D('send:'+VCODE_KEY)
      await U.sendSMS('VCODE', phone, [vcode])
    }catch(e){
      D(e)
    }
  }else if(action =='forget'){
      let account = data.account
      let vcode = data.vcode
      let phone = await GetPhoneFromAccount(account)
     
      let isVerifyedCodePassed = await CheckVerifyCode(phone,vcode)
      if(!isVerifyedCodePassed)
        throw(E.E_INCORRECT_VCODE)
      R.set('CHANGE_PWD_'+phone,true)
      R.expire('CHANGE_PWD_' + phone,300)
      return 
  }else if(action=='changepwd'){
    let account = data.account
    let password = data.password
     let phone = await GetPhoneFromAccount(account)
     let isCanChangePassword = await CheckChangePwdSafety(phone)
     if(!isCanChangePassword)
      throw E.E_DO_NOT_PERMITTED
    await Q('user').update('password',password).where('phone',phone)
     return
  }else if(action==='register'){
    let phone = data.phone
    let user = await Q('user').first('id').where('phone',phone)
    if(user)
      throw (E.E_PHONE_EXIST)
    
    // create user
    let password = U.generateVerifyCode()
    let param = {
      id:U.createUUID(),
      phone,
      user:phone,
      name:phone,
      password:U.MD5(password),
      // 注册途径
    }

    await Q('user').insert(param)

    // generate password
    await U.sendSMS("REGISTER", phone, [U.maskPhone(phone), password])
  }else{
    throw (E.E_DO_NOT_PERMITTED)
  }

  
}

module.exports = out