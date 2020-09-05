const path = require('path');
const log4js = require('koa-log4');
const debug = require('debug')('LOGGER')

log4js.configure({
  appenders: {
    req: {
      type: 'dateFile',
      pattern: '-yyyy-MM-dd.log',
      filename: path.join(__dirname, './logs/req.log')
    },
    user:{
      type:'dateFile',
      pattern: '-yyyy-MM-dd.log',
      filename: path.join(__dirname, './logs/user.log')
    },
    application: {
      type: 'dateFile',
      pattern: '-yyyy-MM-dd.log',
      filename: path.join(__dirname ,'./logs/application.log')
    },
    out: {
      type: 'console'
    }
  },
  categories: {
    
    req: {
      appenders: ['req'],
      level: 'trace'
    },
    app: {
      appenders: ['application'],
      level: 'info'
    },
    user:{
       appenders: ['user'],
       level: 'info'
    },
    default: {
      appenders: ['application'],
      level: 'info'
    }
  }
});



exports.accessLogger = log4js.koaLogger(log4js.getLogger('req'))
exports.logger = log4js.getLogger('app')
exports.UserLogger = log4js.getLogger('user')