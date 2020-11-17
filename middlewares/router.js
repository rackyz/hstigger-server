const routerAuthencation = require('./authRouter')
let RestfulAPIMethods = {}
let Methods = ['List', 'Get', 'Post', 'PostAction', 'Replace', 'Patch', 'Delete', 'GetRelated', 'Option',
  'Related', 'AddRelated', 'DelRelated'
]

let E = {
  API_LOAD_FAILED: "API装载异常",
  API_METHOD_UNDEFINED: "访问对象不存在该操作",
  API_OBJECT_UNDEFINED: "API接口不存在",
  API_VERSION_MISSED: "API版本号未设置",
  API_VERSION_UNDEFINED: "API版本号错误"
}


for (let i = 0; i < Methods.length; i++) {
  let v = Methods[i]
  RestfulAPIMethods[v] = async function (ctx, next) {

    let apiObject = ctx.apiObject || ctx.apiRoot
    if (!apiObject) {
      throw E.API_LOAD_FAILED
    }
    let object = ctx.params.object
    if (apiObject[object] && apiObject[object].isCollection) {
      if (typeof apiObject[object].Auth == 'function') {
        await apiObject[object].Auth(v,{user_id:ctx.state.id,ent_id:ctx.state.enterprise_id})
      }

      if (typeof apiObject[object][v] == 'function') {
        ctx.state.data = await apiObject[object][v](ctx)
        return
      } else {
        throw E.API_METHOD_UNDEFINED
      }
    }
    await next()
  }
}


const Nest = async (ctx, next) => {
  let object = ctx.params.object
  let apiObject = ctx.apiObject || ctx.apiRoot
  if (!apiObject) {
    ctx.error(E.API_LOAD_FAILED)
    return
  }

  if (apiObject[object]) {
    ctx.apiObject = apiObject[object]
  } else {
    throw (E.API_OBJECT_UNDEFINED)
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
      let apiVersion = ctx.headers['api-version']
      if (!apiVersion) {
        throw (E.API_VERSION_MISSED)
      }
      let APIRoot = null
      try {
        APIRoot = require(`../controllers`)
      } catch (e) {
        throw (E.API_VERSION_UNDEFINED)
      }

      ctx.apiRoot = APIRoot
      await next()
    })
  }
  route
    .get('/', ctx => {
      ctx.error('路径匹配失败')
    })
    .get('/:object', RestfulAPIMethods.List)
    .get('/:object/:id', routerAuthencation, RestfulAPIMethods.Get)
    .post('/:object', RestfulAPIMethods.Post)
    .post('/:object/:action', RestfulAPIMethods.PostAction)
    .put('/:object/:id', routerAuthencation, RestfulAPIMethods.Patch)
    .patch('/:object/:id', routerAuthencation, RestfulAPIMethods.Patch)
    .delete('/:object/:id', routerAuthencation, RestfulAPIMethods.Delete)
    .get('/:object/:id/:related', routerAuthencation, RestfulAPIMethods.Related)
    .get('/:object/:id/:related/:relatedId', routerAuthencation, RestfulAPIMethods.GetRelated)
    .post('/:object/:id/:related', routerAuthencation, RestfulAPIMethods.AddRelated)
    .delete('/:object/:id/:related/:relatedId', routerAuthencation, RestfulAPIMethods.DelRelated)
  if (i != 0)
    route.all('*', async (ctx, next) => {
      await next()
    })
  else
    route.all('*', async (ctx) => {
      ctx.throw(404, '我竭尽全力也没找到你要的API')
    })


  if (i != 0) {
    route.use('/:object', Nest, routers[i - 1].routes())
  }
  routers.push(route)
}
let router = routers[routers.length - 1]









module.exports = router