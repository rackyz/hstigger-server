const Koa = require('koa')
const app = new Koa()
const response = require('./middlewares/response')
const restfulRouter = require('./middlewares/router')
const bodyParser = require('koa-bodyparser')
const auth = require('./middlewares/auth')
const cors = require('koa2-cors')
const Logger = require('./base/logger')
const Config = require('./base/config')
const InitDB = require('./base/initdb')

InitDB(true)
app.use(Logger.accessLogger)
app.use(cors())
app.use(response)
app.use(bodyParser({jsonLimit: 100 * 1024 * 1024}))
app.use(auth)
app.use(restfulRouter.routes())
console.log('[HSTIGGER-Server] started on port: ' + Config.port)
app.listen(Config.port)

