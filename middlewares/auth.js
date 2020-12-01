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
  Session,Account
} = require('../models');

module.exports = async function (ctx, next) {
  var token = ctx.headers.authorization
  // token验证方式 用于web页面
 
  if (token) {
    token = token.slice(7)
    let sessionState = await Session.getSessionState(token)
    ctx.state = sessionState
    
    let enterpriseId = ctx.headers.enterprise
    console.log(ctx.url)
    if(enterpriseId){
      console.log('企业访问')
      let myEnterprises = await Account.getUserEnterprises(ctx.state.id)
      
      if (!myEnterprises.includes(enterpriseId))
        throw EXCEPTION.E_UNAUTHED_ENTERPRISE_ID
      ctx.state.enterprise_id = enterpriseId
    }else{
      console.log("个人访问")
    }
    
    return authAccountType(ctx,next)

  }else{
    if (ctx.headers.test){
      ctx.headers["api-version"] = "v0"
       await next()
       return
    }
    let METHOD = ctx.method
    let URL = ctx.url
    if((METHOD == 'GET' && (URL.indexOf('/files')==0 || URL.indexOf('/settings')==0)) || URL.indexOf('/session')==0){
      ctx.headers["api-version"] = "v0"
      await next()
      return
    }
    throw EXCEPTION.E_DO_NOT_PERMITTED
  }
}
