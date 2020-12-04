const {
  mysql: mysqlConfig
} = require('./config')
const UTIL = require('./util')
const MYSQL = require('knex')(mysqlConfig)
MYSQL.initdb = async (table_name, initializer, forced,schema) => {
  return UTIL.initdb(MYSQL,table_name,initializer,forced,schema)
}

MYSQL.seeds = async (table_name,items,forced,schema)=>{
  return UTIL.seeds(MYSQL, table_name, items, forced, schema)
}

module.exports = MYSQL