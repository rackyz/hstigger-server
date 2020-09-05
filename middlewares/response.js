const debug = require('debug')('NBGZ-RESPONSE')
const {
    logger,
    accessLogger
} = require('../logger')
/**
 * Response Formating and Exception handling
 */
module.exports = async function (ctx, next) {
    try {
        // invoked next middleware
        await next()

        // 
        ctx.body = ctx.body ? ctx.body : {
            code: ctx.state.code || 0,
            data: ctx.state.data || {},
            message:ctx.state.message || 'success'
        }
    } catch (e) {
        logger.error(e)

        debug('异常: %o',e)
        // object Exception treated as Application Level Error
        if(typeof e == 'object' ){
            if (ctx.status == 200){
                debug('未处理异常: %o', e)
                 ctx.body = ctx.body ? ctx.body : {
                     code: ctx.state.code !== undefined && ctx.state.code !== 3 ? ctx.state.code : -1,
                     data: e,
                     message: ctx.state.message != undefined ? ctx.state.message : JSON.stringify(e)
                 }
                return
            }else{
                debug('用户请求错误: %o', e)
                ctx.status = e.status?e.status:200
                ctx.body = ctx.body ?ctx.body :{
                    code: ctx.state.code !== undefined && ctx.state.code !== 3 ? ctx.state.code : -1,
                    data:e,
                    message: ctx.state.message != undefined ? ctx.state.message : (e.sql ? '数据库操作错误' : JSON.stringify(e))
                }
                console.log(e)
                return
            }
        // Numeric Exception treated as Server Response Code
        }else if(typeof e == 'number'){
            ctx.status = e
        }
        // String Exception treated as User-Level Error
        else if(e){
           debug('用户提示: %o', e)
           ctx.status = e.status || 200
           ctx.body = ctx.body ? ctx.body : {
               code: ctx.state.code !== undefined && ctx.state.code !== 3 ? ctx.state.code : -1,
               message: e ? e: (ctx.state.message !== undefined ? ctx.state.message : JSON.stringify(e))
           }
        }else{
            ctx.body = {
                code:-1,
                message:"未知错误"
            }
        }
    }
}
