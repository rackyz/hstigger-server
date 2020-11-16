const {
  mysql: mysqlConfig
} = require('./config')
const MYSQL = require('knex')(mysqlConfig)
MYSQL.initdb = async (table_name, initializer, forced) => {
  let Scheme = MYSQL.schema
  let isExist = await Scheme.hasTable(table_name)
  // console.log(table_name,isExist)
  if(forced && isExist){
    await Scheme.dropTableIfExists(table_name)
    // console.log("drop",table_name)
  }

  await Scheme.createTable(table_name,initializer)
  // console.log(` [model-db] -- created table (${table_name}))`)
}

MYSQL.seeds = async (table_name,items,forced)=>{
  if(forced){
    await MYSQL(table_name).del()
    await MYSQL(table_name).insert(items)
  }
}

module.exports = MYSQL