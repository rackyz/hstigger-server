/** Account */
const { E_DO_NOT_PERMITTED } = require('../base/exception')
const MYSQL = require('../base/mysql')
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


out.Patch =async ctx=>{
  let id = ctx.params.id
  let data = ctx.request.body
  await Account.update(id,data)
  return
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

out.Delete = async ctx=>{
  let id = ctx.params.id
  await Account.remove([id])

}

out.PostAction = async ctx=>{
  let data = ctx.request.body
  if(Array.isArray(data)){
    await Account.remove(data)
  }
}


module.exports = out