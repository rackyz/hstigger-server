let {Account,Enterprise} = require('../../models')
let out = {}


out.List = async ctx=>{
  let ent_id = ctx.state.enterprise_id
  return await Account.ListUsersByEnterprise(ent_id)
}

module.exports = out