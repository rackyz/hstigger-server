const EXCEPTION = require('../base/exception')
module.exports = async (ctx, next) => {
  if(ctx.url.indexOf('/enterprise') == 0){
    if(!ctx.state.enterprise_id){
      throw(403)
    }
  }else if (ctx.url.indexOf('/admin') == 0) {
    if(!ctx.state.admin)
      throw(403)
  }

  // generater access-ky by router path
  // auth the previledge

  await next()
}