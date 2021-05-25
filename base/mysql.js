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
  try{
  let ent_schema_name = 'ENT_' + ent_id.replace(/(\-)/g, '_')
  return ent_schema_name
  }catch(e){
    console.log(e,ent_id)
  }
}

MYSQL.E = (ent_id, t) => MYSQL(t).withSchema(MYSQL.getEnterpriseScheme(ent_id))
module.exports = MYSQL

MYSQL.Migrate = async (DB, forced,ent_id)=>{
  for(let t in DB){
    await DB[t].Init(forced,ent_id)
  }
}

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

MYSQL.ParseCondition = (query,condition)=>{
  if(condition.where){
    query = query.where(condition.where)
  }

  if(condition.whereIn){
    for(let x in condition.whereIn)
      query = query.whereIn(x,condition.whereIn[x])
  }

  if(condition.or){
     if (condition.or.where) {
      for (let x in condition.or.where)
        query = query.orWhere(x,condition.or.where[x])
     }

     if (condition.or.whereIn) {
       for (let x in condition.or.whereIn)
         query = query.orWhereIn(x, condition.or.whereIn[x])
     }
  }

  if(condition.page && condition.page_size){
    let page = parseInt(condition.page) || 0
    let size = parseInt(condition.page_size) || 20
    if(page)
      query = query.offset(page * size)
    query = query.limit(size)
  }

  if(condition.orders){
    condition.orders.forEach(v=>{
      query = query.orderBy(v.key,v.order)
    })
  }

  return query
}

module.exports = MYSQL