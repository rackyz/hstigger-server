const {
  mysql: mysqlConfig
} = require('./config')
const UTIL = require('./util')
const MYSQL = require('knex')(mysqlConfig)
MYSQL.initdb = async (table_name, initializer, forced,schema) => {
  return UTIL.initdb(MYSQL,table_name,initializer,forced,schema)
}

MYSQL.initdb_e = async (table_name, initializer, forced, schema) => {
  return UTIL.initdb(MYSQL, table_name, initializer, forced, schema)
}

MYSQL.seeds = async (table_name,items,forced,schema)=>{
  return UTIL.seeds(MYSQL, table_name, items, forced, schema)
}

MYSQL.getEnterpriseScheme = ent_id => {
  return 'ENT_' + ent_id.replace(/(\-)/g, '_')
}

MYSQL.E = (ent_id, t) => MYSQL(t).withSchema(MYSQL.getEnterpriseScheme(ent_id))
module.exports = MYSQL