const EXCEPTION = require('../base/exception')
const {Account,Enterprise} = require('../models')
module.exports = async (ctx, next) => {
  let enterpriseId = ctx.headers.enterprise
  
  if (enterpriseId) {
    let myEnterprises = await Account.getUserEnterprises(ctx.state.id)
    if (!myEnterprises.includes(enterpriseId))
      throw EXCEPTION.E_UNAUTHED_ENTERPRISE_ID
    
    ctx.state.enterprise_id = enterpriseId
    ctx.state.isEntAdmin = await Enterprise.isOwner(ctx.state.id,enterpriseId)
    ctx.state.isEntAdmin = ctx.state.account_type == 3
  }

  if(ctx.url.indexOf('/enterprise') == 0){
    // Enterprise User Interface
    if(!ctx.state.enterprise_id){
      throw(403)
    }
  }else if(ctx.url.indexOf('/entadmin') == 0){
    // Enterprise Admin Interface
    if (!ctx.state.enterprise_id || !ctx.state.isEntAdmin) {
      throw (403)
    }
  }else if (ctx.url.indexOf('/admin') == 0) {
    // Admin Interface
    if(!ctx.state.isAdmin)
      throw(403)
  }

  // generater access-ky by router path
  // auth the previledge

  await next()
}