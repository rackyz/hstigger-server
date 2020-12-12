const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const REDIS = require('../base/redis')

const TABLE_TYPE = 'type'
let o = {}
const init_types = [{

}]

o.initdb = async (forced) => {
 
  MYSQL.initdb(TABLE_TYPE, t => {
    t.increments("id").index()
    t.string("key",16)
    t.integer("value")
    t.string("name", 16).notNull()
    t.string("icon", 16).defaultTo("star")
    t.string("color", 32).defaultTo("#333333")
    t.integer("parent_id").defaultTo(0)
  },forced)

  if(forced){
    MYSQL(TABLE_TYPE).del()
   // MYSQL(TABLE_TYPE).insert(init_types)

  }
}

o.getTypes = async ()=>{
  let types = await MYSQL(TABLE_TYPE)
  return types
}

o.getChilrenValues = async (key)=>{
  let types = await MYSQL(TABLE_TYPE).select('id').where('parent_id',key)
  return types
}

o.addType = async (type)=>{
  let id = await MYSQL(TABLE_TYPE).returning("id").insert(type)
  return id
}

o.removeType = async (type_id)=>{
  await MYSQL(TABLE_TYPE).where('id',type_id).orWhere('parent_id',type_id).del()
}

o.updateType = async (type)=>{
  await MYSQL(TABLE_TYPE).update(type).where('type_id',type.id)
}


o.AddType = async (key,values)=>{
  await o.removeType(key)
  let id = await o.addType({
    key,
    name:key
  })
  let types = values
  if(Array.isArray(values) && values.length > 0){
    if(typeof values[0] === "string"){
      types = values.map((v, i) => ({
        key: v,
        name: v,
        value: i,
        parent_id: id
      }))
    }else{
      types.forEach((v,i)=>{
        v.parent_id = id
        if(v.value == undefined)
          v.value = i
      })
    }
  }

  o[key] = UTIL.ArrayToObject(types, "key", t => t.value)
  console.log("[TYPE]",key,o[key])
  await MYSQL(TABLE_TYPE).insert(types)
  return o[key]
}



module.exports = o