const { mysql: mysqlConfig } = require('./config')
const Q = require('knex')(mysqlConfig)
const D = require('debug')('[CORE]')
const U = require('./util')
const C = require('./config')
const E = require('./exception')
const R = require('./redis')
const L = require('./logger')


module.exports = {
  Q,
  D,
  E,
  U,
  C,
  R,
  L
}