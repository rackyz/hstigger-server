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
const {
  Session
} = require('../models')

module.exports = async function (ctx, next) {
  var token = ctx.headers.authorization
  // token验证方式 用于web页面
  if (token) {
    token = token.slice(7)
    let sessionState = await Session.getSessionState(token)
    ctx.state = sessionState
  }else{
    let METHOD = ctx.method
    let URL = ctx.url
    if((METHOD == 'GET' && (URL.indexOf('/files')==0 || URL.indexOf('/settings')==0)) || URL.indexOf('/session')==0){
      ctx.header["api-version"] = "v0"
      await next()
      return
    }
    throw EXCEPTION.E_DO_NOT_PERMITTED
  }

  await next();
}
