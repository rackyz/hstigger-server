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


MYSQL.Create = (table_name, initializer) => {
  return {
    TableName:table_name,
    Query:(ent_id)=>{
      if(!ent_id){
        return MYSQL(table_name)
      }else{
        return MYSQL.E(ent_id,table_name)
      }
    },
    Init: (forced, ent_id, special_initializer) => {
      if(ent_id)
        MYSQL.initdb_e(table_name, special_initializer ? special_initializer : initializer, forced, ent_id)
      else
        MYSQL.initdb(table_name, special_initializer ? special_initializer : initializer, forced)
    }

  }
}