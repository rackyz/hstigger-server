const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const o = {}

const TABLE_TYPE = 'type'

const init_types = [{

}]

o.initdb = async (forced) => {
  MYSQL.initdb(TABLE_TYPE, t => {
    t.integer("id").index()
    t.string("key",16).notNull().unique()
    t.string("name", 16).notNull()
    t.string("icon", 16).defaultTo("star")
    t.string("color", 16).defaultTo("#333333")
    t.integer("parent_id")
  })

  if(forced){
    MYSQL(TABLE_TYPE).del()
    MYSQL(TABLE_TYPE).insert(init_types)

  }
}

o.getAll = async ()=>{
  let types = await MYSQL(TABLE_TYPE)
  return types
}

o.getChilrenValues = async (key)=>{
  let types = await MYSQL(TABLE_TYPE).select('id').where('parent_id',key)
  return types
}

o.addType = async (type)=>{
  await MYSQL(TABLE_TYPE).insert(type)
}

o.removeType = async (type_id)=>{
  await MYSQL(TABLE_TYPE).where('id',type_id).orWhere('parent_id',type_id).del()
}

o.updateType = async (type)=>{
  await MYSQL(TABLE_TYPE).update(type).where('type_id',type.id)
}


o._AddType = async (key,values)=>{

}


module.exports = o