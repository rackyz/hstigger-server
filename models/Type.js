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
   // MYSQL(TABLE_TYPE).del()
   // MYSQL(TABLE_TYPE).insert(init_types)
   await o.AddType('TEXT_CONT_TYPE',['text','md5','html'])

  }

  
}

o.initdb_e = async (ent_id,forced)=>{
    MYSQL.initdb_e(TABLE_TYPE, t => {
      t.increments("id").index()
      t.string("key", 16)
      t.integer("value")
      t.string("name", 16).notNull()
      t.string("icon", 16).defaultTo("star")
      t.string("color", 32).defaultTo("#333333")
      t.integer("parent_id").defaultTo(0)
      t.string('extra',64)
      
    }, forced, ent_id)
}

o.getTypes = async (ent_id)=>{
  const Q = ent_id ? MYSQL.E(ent_id, TABLE_TYPE) : MYSQL(TABLE_TYPE)
  let types = await Q
  return types
}

o.getChilrenValues = async (key, ent_id) => {
  const Q = ent_id ? MYSQL.E(ent_id, TABLE_TYPE) : MYSQL(TABLE_TYPE)
  let types = await Q.select('id').where('parent_id',key)
  return types
}

o.addType = async (type, ent_id) => {
  const Q = ent_id ? MYSQL.E(ent_id, TABLE_TYPE) : MYSQL(TABLE_TYPE)
  let id = await Q.insert(type).returning("id")
  return id
}

o.removeType = async (type_id, ent_id) => {
  const Q = ent_id?MYSQL.E(ent_id,TABLE_TYPE):MYSQL(TABLE_TYPE)
  const D = ent_id ? MYSQL.E(ent_id, TABLE_TYPE) : MYSQL(TABLE_TYPE)
  let idlist = await Q.select('id').where('parent_id',type_id)
  for(let i=0;i<idlist.length;i++)
    await o.removeType(idlist[i].id,ent_id)
  await D.where('id',type_id).del()
}

o.removeTypeByKey = async (key, ent_id)=>{
  const Q = ent_id ? MYSQL.E(ent_id, TABLE_TYPE) : MYSQL(TABLE_TYPE)
  let idlist = await Q.select('id').where({key})
  for(let i=0;i<idlist.length;i++){
    await o.removeType(idlist[i].id, ent_id)
  }
}

o.updateType = async (type,ent_id) => {
  const Q = ent_id ? MYSQL.E(ent_id, TABLE_TYPE) : MYSQL(TABLE_TYPE)
  await Q.update(type).where('type_id',type.id)
}


o.AddType = async (key,values)=>{
  await o.removeTypeByKey(key)
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
  await MYSQL(TABLE_TYPE).insert(types)
  return o[key]
}

o.AddType_e = async (ent_id, key, values) => {
  let sqlInsertType = ent_id ? MYSQL.E(ent_id, TABLE_TYPE) : MYSQL(TABLE_TYPE)
   await o.removeTypeByKey(key, ent_id)
   let id = await o.addType({
     key,
     name: key
   }, ent_id)
   let types = values
   if (Array.isArray(values) && values.length > 0) {
     if (typeof values[0] === "string") {
       types = values.map((v, i) => ({
         key: v,
         name: v,
         value: i,
         parent_id: id
       }))
     } else {
       types.forEach((v, i) => {
         v.parent_id = id
         if (v.value == undefined)
           v.value = i
       })
       
     }
   }

   o[key] = UTIL.ArrayToObject(types, "key", t => t.value)
   await sqlInsertType.insert(types)
   return o[key]
}


module.exports = o