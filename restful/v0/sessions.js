const {
  Q,
  E,
  U,
  User,
  Session
} = require('../../models')
const util = require('../../models/util')
const debug = require('debug')('[SESSION]')
const out = {}
const jwt = require('jsonwebtoken')
const QSMS = require('../../tools/qsms')
const config = require('../../config')
const moment = require('moment')
const COS = require('cos-nodejs-sdk-v5')
const crypto = require('crypto')
const { getDateStamp } = require('../../models/util')

async function CreateSession(ctx,user_id){
     let ip = util.getIP(ctx)
     let client_device = util.getDevice(ctx)

     if(client_device){
       client_device = client_device.slice(0,64)
     }
     let login_at = util.getTimeStamp()
     let expire_time = 60 * 24 * 60

     let token = jwt.sign({
       id: user_id
     }, config.appSecret, {
       expiresIn: expire_time
     })

    await Session.forge().where({
      user_id,
      client_device

    }).destroy({
      require: false
    })

    // 4 - create a new session

    await Session
      .forge({
        user_id,
        ip,
        client_device,
        login_at,
        expire_time
      })
      .save({
        id: token
      }, {
        require: false
      })

    await User.forge({
      id: user_id
    }).save({
      lastlogin_at: login_at
    })

    return {
      token:'Bearer ' + token,
      ip,
      client_device,
      login_at
    }
}

async function LoginWithPassword({user,phone,password}){
      if ((!user && !phone) || !password) {
        throw E.E_INVALID_DATA
      }

      let queryCondition = {}
      if (user) {
        queryCondition.where = {
          user
        }
      } else if (phone) {
        queryCondition.where = {
          phone
        }
      }

      // 1 - Query User with user or phone as account
      let model = await User
        .query(queryCondition)
        .fetch({
          columns: ['id', 'password', 'state'],
          require: false
        })
      // 2 - compare password
      if (!model)
        throw E.E_USER_UNREGISTERATED

        console.log(password, crypto.createHash("md5").update(model.get('password')).digest('hex'))
      if (crypto.createHash("md5").update(model.get('password')).digest('hex') !== password)
        throw (E.E_USER_INCCORECT_PASSWORD)
      
      if (model.get('state') == 1)
        throw E.E_USER_LOCKED

     

      return model.get('id')
}

// LOGIN
out.Post = async ctx => {
  let data = ctx.request.body
  let q = ctx.query.q
  let user_id,session

  if(q == 'debug'){
    user_id = data.id
    session = await CreateSession(ctx,user_id)
  }else{
    user_id = await LoginWithPassword(data)
    session = await CreateSession(ctx,user_id)
  }

  let user = await GetUserInfo(user_id)
  let coskey = COS.getAuthorization({
    SecretId: config.cos.SecretId,
    SecretKey: config.cos.SecretKey,
    Method: 'post',
    Expires: 60 * 24,
    Query: {},
    Headers: {}
  })
  ctx.userlog.info(` ${user.name} 登录成功`)
  await U.sendMessage('system',user.id,'欢迎登录系统')
  return Object.assign({}, user, session, {
    coskey
  })
}



out.Delete = async ctx => {
  let id = ctx.params.id
  if (id == 'self') {
    await Session.forge({
      id: ctx.state.token
    }).destroy({
      required: false
    })
  }
}

out.List = async ctx => {
  let {
    user_id,
    expired,
    client
  } = ctx.query
  let collection = await Session.forge({
    user_id
  }).fetchAll({
    columns: ['user_id', 'login_at', 'expire_time', 'client_device', 'ip']
  })
  let items = collection.toJSON()
  if (expired != undefined) {
    let now = moment()
    let deadtime = moment(v.login_at).add('seconds', v.expire_time)
    if (expired)
      items = items.filter(v => now.isAfter(deadtime))
    else
      items = items.filter(v => now.isBefore(deadtime))
  }

  if (client != undefined) {
    items = items.filter(v => v.client_device.includes('client'))
  }

  return items
}


const GetUserInfo = async user_id=>{
  let user = await User.forge({
    id: user_id
  }).fetch({
    columns: ['avatar', 'phone', 'name', 'user'],
    withRelated: ['deps', 'roles'],
    require: false
  })

  let deps = await Q('dep_user').select('dep_id').where('user_id', user_id)
  let roles = await Q('role_user').select('role_id').where('user_id', user_id)

  if (!user)
    throw (E.E_INVALID_TOKEN)

  return Object.assign({}, user.toJSON(), {
    deps: deps.map(v => v.dep_id),
    roles: roles.map(v => v.role_id)
  })
}

const GetSessionInfo = async session_id=>{
  let session = await Session.forge({
    id: session_id
  }).fetch({
    columns: ['login_at', 'client_device', 'ip'],
    require: false
  })

  if(!session)
    throw(E.E_INVALID_DATA)
  session.token = 'Bearer ' + session.id
  return session.toJSON()
}

const GetAccList = async user_id=>{
  if(!user_id)
    throw E.E_USER_UNLOGIN
  
  let items = await Q('accelerate').where('user_id',user_id)
  return items.map(v=>v.key)
}

GetUsers = async ()=>{
  let users = await Q('user').select('id','name','avatar','phone')
  return users
}

GetDeps = async ()=>{
  let deps = await Q('dep')
  return deps
}

GetRoles = async ()=>{
  let roles = await Q('role')
  return roles
}
GetTypes = async ()=>{
  let types = await Q('type')
  return types
}

GetMsgCount =async (id_range)=>{
  let res = await Q('message').count('message.id as c').leftOuterJoin('message_user_readed', 'msg_id', 'message.id').whereIn('to', id_range).where('message_user_readed.id', null)

  return res[0].c
}

out.Get = async ctx => {
  let session_id = ctx.params.id
  if (session_id == "current") {
    let user_id = ctx.state.id
    let session_id = ctx.state.token
    let user = await GetUserInfo(user_id)
    let session = await GetSessionInfo(session_id)
    let acclist = await GetAccList(user_id)
    let all_users = await GetUsers()
    let all_deps = await GetDeps()
    let all_roles = await GetRoles()
    let unread_msg_count = await GetMsgCount([user_id])
    let types = await GetTypes()
    let coskey = COS.getAuthorization({
      SecretId: config.cos.SecretId,
      SecretKey: config.cos.SecretKey,
      Method: 'post',
      Expires: 60 * 24,
      Query: {},
      Headers: {}
    })

    session.token = 'Bearer ' + session.id
    
    return Object.assign({}, session, user, {
      coskey,
      acclist,
      unread_msg_count
    }, {
      system: {
        users: all_users,
        deps: all_deps,
        roles: all_roles,
        types
      }
    })
  }

}

out.PostAction = async ctx=>{
  let action = ctx.params.action
  let data = ctx.request.body
  if(action == 'changepwd'){
    let {oldpass,newpass} = data
    if(!oldpass || !newpass)
      throw E.E_INVALID_DATA

    let id = ctx.state.id
    let user = await User.query({where:{id}}).fetch({require:false})
    if(!user)
      throw E.E_USER_UNLOGIN
    if(user.get('password') != oldpass)
      throw E.E_USER_INCCORECT_PASSWORD

    await user.save({password:newpass})
  }
}

module.exports = out