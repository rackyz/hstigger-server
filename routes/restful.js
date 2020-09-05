const debug = require('debug')('[RESTFUL ROUTER]')
//const {logger} = require('../logger')
const routerAuthencation = require('../middlewares/authRouter')
let RestfulAPIMethods = {}
let Methods = ['List', 'Get', 'Post', 'PostAction','Replace', 'Patch', 'Delete', 'GetRelated','Option',
    'Related', 'AddRelated', 'DelRelated'
]

let E = {
    API_LOAD_FAILED:        "API装载异常",
    API_METHOD_UNDEFINED:   "访问对象不存在该操作",
    API_OBJECT_UNDEFINED:   "API接口不存在",
    API_VERSION_MISSED:     "API版本号未设置",
    API_VERSION_UNDEFINED:  "API版本号错误"
}

for (let i = 0; i < Methods.length; i++) {
    let v = Methods[i]
    RestfulAPIMethods[v] = async function (ctx, next)  {
        
        let apiObject = ctx.apiObject || ctx.apiRoot
        if (!apiObject) {
            ctx.error(E.API_LOAD_FAILED)
            debug('API_LOAD_FAILED:apiObject = null')
  //          logger.info('API_LOAD_FAILED:apiObject = null')
            return
        }
        let object = ctx.params.object
        if (apiObject[object] && apiObject[object].isCollection) {
           
            if (typeof apiObject[object][v] == 'function') {
                ctx.state.data = await apiObject[object][v](ctx)
                return
            } else {
                debug(`API_METHOD_UNDEFINED:object=${object},method=${v}`)
            //    logger.info(`API_METHOD_UNDEFINED:object=${object},method=${v}`)
                ctx.error (E.API_METHOD_UNDEFINED)
                return
            }
        }
        await next()
    }
}



const Nest = async (ctx, next) => {
    let object = ctx.params.object
    let apiObject = ctx.apiObject || ctx.apiRoot
    if(!apiObject){
        debug('API_LOAD_FAILED:apiObject = null')
   //     logger.info('API_LOAD_FAILED:apiObject = null')
        ctx.error(E.API_LOAD_FAILED)
        return
    }

    if (apiObject[object]) {
        ctx.apiObject = apiObject[object]
    } else {
     //   logger.info(`API_OBJECT_UNDEFINED:object=${object}`)
        debug(`API_OBJECT_UNDEFINED:object=${object}`)
        ctx.error(E.API_OBJECT_UNDEFINED)
        return
    }


    await next()
}

const DefinedRouterDepth = 2
let routers = []

for (let i = 0; i < DefinedRouterDepth; i++) {
    let route = require('koa-router')()
    if (i == DefinedRouterDepth - 1) {
        // 嵌套路由中间件
        route.use(async (ctx, next) => {
            // 根据版本号选择库
            let apiVersion = ctx.headers['api-version']
            debug('API VERSION:', apiVersion)
            if (!apiVersion) {
              //  logger.info(`API_VERSION_MISSED`)
                debug(E.API_VERSION_MISSED)
                return
            }
            let APIRoot = null
            try {
                APIRoot = require(`../restful/${apiVersion}`)
            } catch (e) {
                ctx.error(E.API_VERSION_UNDEFINED)
                debug('API加载错误:' + typeof e == 'object' ? JSON.stringify(e) : e)
              //  logger.info(`API_VERSION_UNDEFINED:api-version=${apiVersion},exception=${e}`)
                return
            }

            ctx.apiRoot = APIRoot
            await next()
        })
    }
    route
        .options('/sessions',ctx=>{ctx.state.data="worked"})
        .get('/', ctx=>{ctx.error('路径匹配失败')})
        .get('/:object', RestfulAPIMethods.List)
        .get('/:object/:id', routerAuthencation, RestfulAPIMethods.Get)
        .post('/:object', RestfulAPIMethods.Post)
        .post('/:object/:action', RestfulAPIMethods.PostAction)
        .put('/:object/:id', routerAuthencation, RestfulAPIMethods.Patch)
        .patch('/:object/:id', routerAuthencation, RestfulAPIMethods.Patch)
        .delete('/:object/:id', routerAuthencation,RestfulAPIMethods.Delete)
        .get('/:object/:id/:related', routerAuthencation, RestfulAPIMethods.Related)
        .get('/:object/:id/:related/:relatedId', routerAuthencation, RestfulAPIMethods.GetRelated)
        .post('/:object/:id/:related', routerAuthencation, RestfulAPIMethods.AddRelated)
        .delete('/:object/:id/:related/:relatedId', routerAuthencation, RestfulAPIMethods.DelRelated)
        .options('/:object',RestfulAPIMethods.Option)
    if(i != 0)
        route.all('*',async (ctx,next)=>{ await next()})
    else
        route.all('*', async (ctx) => {
            ctx.throw(404,'我竭尽全力也没找到你要的API')
        })


    if (i != 0) {
        route.use('/:object', Nest, routers[i - 1].routes())
    }
    routers.push(route)
}
let router = routers[routers.length - 1]









module.exports = router