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
const authAccountType = require('./authAccountType')
const {
  Session,
} = require('../models')
const api = require('../base/api')

module.exports = async function (ctx, next) {
  var token = ctx.headers.authorization
  // token验证方式 用于web页面
  if (token) {
    token = token.slice(7)
    let sessionState = await Session.getSessionState(token)
    ctx.state = sessionState
    ctx.state.isAdmin = sessionState.account_type == 3
    return authAccountType(ctx,next)
  }else{

    let URL = ctx.url
    if (URL.indexOf('/public') == 0) {
      ctx.headers["api-version"] = "v0"
      console.log("PUBLIC")
      await next()
      return
    }

    // return api document & json list
    let version = ctx.headers["api-version"]
    if (ctx.method == 'GET'){
      if(!version){
        api.SendAPIDoc(ctx)
        return 
      }else{
        let apiJSON = api.GetAPIObject(ctx.apiObject)
        ctx.state = {data:apiJSON}
        return 
      }
    }
    
    throw 404
  }
}
