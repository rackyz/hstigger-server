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
const EXCEPTION = require('../base/exception')
const authAccountType = require('./authAccountType')
const {
  Session,
} = require('../models');

module.exports = async function (ctx, next) {
  var token = ctx.headers.authorization
  // token验证方式 用于web页面
 
  if (token) {
    token = token.slice(7)
    let sessionState = await Session.getSessionState(token)
    ctx.state = sessionState
    ctx.state.isAdmin = sessionState.account_type == 3
    console.log('访问:',ctx.state.user,ctx.state.name)
    return authAccountType(ctx,next)

  }else{
    if (ctx.headers.test){
      ctx.headers["api-version"] = "v0"
       await next()
       return
    }
    let URL = ctx.url
    if(URL.indexOf('/public')==0){
      ctx.headers["api-version"] = "v0"
      await next()
      return
    }
    throw EXCEPTION.E_DO_NOT_PERMITTED
  }
}
