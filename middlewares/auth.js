//////////////////////////////////////////////////////////////////////////////////
// auth.js                                                                      //
// desc: Middlewares for authentication                                         //
//     1 - check user state and get user info                                   //
//     2 - module level access controll                                         //
// auth: rackyz                                                                 //
// date: 2018/11/19                                                             //
// update: 2020/1/13                                                            //
// models: Session, User                                                        //
// Instead.                                                                     //
//////////////////////////////////////////////////////////////////////////////////
"use strict";
const jwt = require('jsonwebtoken')
const Config = require('../base/Config')
const EXCEPTION = require('../base/exception')
const UTIL = require('../base/util')
const {
  Session,
  User
} = require('../models')

module.exports = async function (ctx, next) {
  var token = ctx.headers.authorization
  
  // token验证方式 用于web页面
  if (token) {
    token = token.slice(7)
    // Pass Login Request
    if (token === 'login' && (ctx.url.indexOf('/sessions') === 0 || ctx.url.indexOf('/settings') === 0)) {
      await next()
      return
    }

    let session = await Session.forge({id:token}).fetch({require:false})
    if(!session)
      throw (EXCEPTION.E_USER_UNLOGIN)
      
    // Decoding
    let uid = await new Promise((resolve, reject) => {
      jwt.verify(token, Config.appSecret, async (err, decoded) => {
        if (err) {
          resolve(false)
        } else {
          resolve(decoded.id)
        }
      })
    })

    if(!uid){
      throw (EXCEPTION.E_OUT_OF_DATE)
    }
    
    ctx.state.id = uid
    
    ctx.state.token = token

    // Authencatition
    let user = await User.forge({
      id: uid
    }).fetch({
      columns: ['name']
    })

    ctx.state.name = user.get('name')

    R.hset('ONLINE_USERS', uid, UTIL.getTimeStamp())

  }else{
    if(ctx.url.indexOf('/files')==0){
      ctx.header["api-version"] = "v0"
      await next()
      return
    }
   // logger.error('Request without token')
    throw("没有访问权限")
    
  }

  // 调用下一个 middleware
  await next();
}
