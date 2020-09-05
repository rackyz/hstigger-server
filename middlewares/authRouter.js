module.exports = async (ctx,next)=>{
   if (ctx.params) {
     if (ctx.params.id && ctx.params.id == 'self') {
       ctx.params.id = ctx.state.id
     } else {
       
     }
   }

   // generater access-ky by router path
   // auth the previledge

   await next()
}