const Koa = require('koa')
const app = new Koa()
const response = require('./middlewares/response')
const bodyParser = require('koa-bodyparser')
const config = require('./config')
const auth = require('./middlewares/auth')
const cors = require('koa2-cors')
const {
    logger,
    accessLogger,
    UserLogger,
    RedisLogger
} = require('./logger')
//const redisClient = require('./db').redis
app.use(accessLogger)
app.use(cors())
app.context.redislog = RedisLogger
app.context.applog = logger
app.context.userlog = UserLogger
// app.context.$store = redisClient || {}
// redisClient.on('error', function (error) {
//     debug(error)
//     app.context.$store.error = 1
//     app.context.$store.message = error
// });

app.context.error = function (error) {
    this.body = {
        code: -1,
        error
    }
}
app.use(response)
// 解析请求体
app.use(bodyParser({
    jsonLimit: 100 * 1024 * 1024
}))
app.use(auth);
//引入路由分发
const restfulRouter = require('./routes/restful')
app.use(restfulRouter.routes())

// 启动程序，监听端口
app.listen(config.port)
