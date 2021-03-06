const Koa = require('koa')
const app = new Koa()
const response = require('./middlewares/response')
const API = require('./base/api')
const restfulRouter = require('./middlewares/router')
const bodyParser = require('koa-bodyparser')
const cors = require('koa2-cors')
const Logger = require('./base/logger')
const Config = require('./base/config')
const Migration = require('./base/migration')
const {Task} = require('./models')
Migration.install(false)
API.install(true)

Task.installTimer()

app.use(Logger.accessLogger)
app.use(cors())
app.use(response)
app.use(bodyParser({
  jsonLimit: 100 * 1024 * 1024,
  onerror: function (err, ctx) {
    console.log('body parse error', 422);
  }
}))
app.use(restfulRouter.routes())
app.listen(Config.port)

