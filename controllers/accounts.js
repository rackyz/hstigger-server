/** Account */
const { E_DO_NOT_PERMITTED } = require('../base/exception')
const {
  Account,
  Permission,
  Type
} = require('../models')

let out = {}

out.Auth = async (method,{user_id,ent_id})=>{
  let user = await Account.getAuthInfo(user_id)
  if(user.type !== Type.AccountType.ADMIN)
    throw(403)
}

out.List = async ctx=>{
  let query = ctx.query
  let accounts = await Account.getList()
  return accounts
}

out.Post = async ctx=>{
  let data = ctx.request.body
  let res = []
  if(Array.isArray(data)){
    res = await Account.createAccounts(data)
  }else{
    res = await Account.createAccounts([data])
  }
  return res
}


module.exports = out