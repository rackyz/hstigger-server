const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')

/**
 * Model - Data Transfer Model
 * Function : 1 - User-defined Data Transfer Model Class
 *            used for automatic task processing
 *            2 - Integrated with several system defined models
 *  
 */

let o = {}

let DB = {}

DB.model = MYSQL.Create('model',t=>{
  t.uuid().primary()
  t.string('name',32)
  t.string('desc',256)
  t.uuid('created_by')
  t.datetime('created_at')
})

DB.model_field = MYSQL.Create('model_field',t=>{
  t.increments().primary()
  t.string('name',32)
  t.string('comment',128)
  t.integer('type')
  t.boolean('required')
  t.stirng('option',512)
  t.uuid('model_id')
})


o.initdb_e = async (ent_id,forced)=>{
  MYSQL.Migrate(DB,ent_id,forced)
}

o.query = async (state,condition,ent_id)=>{
  let QueryModel = DB.model.Query(ent_id)
  let models = await QueryModel
  return models.concat(o.tdms || [])
}

o.create = async (state,item,ent_id)=>{
  let QueryModel = DB.model.Query(ent_id)
  let updateInfo = {
    id:UTIL.createUUID(),
    created_by:state.id,
    created_at:UTIL.getTimeStamp()
  }
  Object.assign(item,updateInfo)
  await QueryModel.insert(item)
  return updateInfo
}

o.get = async (state,id,ent_id)=>{
  let QueryModel = DB.model.Query(ent_id)
  let QueryFields = DB.model_field.Query(ent_id)
  let model = await QueryModel.first().where({id})
  if(!model)
    throw "UNEXIST ID"
  
  model.fields = await QueryFields.where({model_id:id})
  if(model.fields.length == 0)
    throw "FORM HAS NO FIELDS"
  try{
    model.fields.forEach(v=>{
      v.option = JSON.parse(v.option)
    })
  }catch(e){
    throw "PARSE ERROR:"+e
  }

  return model
}

o.update = async (state, id, item,ent_id) => {
  let QueryModel = DB.model.Query(ent_id)
  let RemoveFields = DB.model_field.Query(ent_id)
  let InsertFields = DB.model_field.Query(ent_id)
  if (item.fileds) {
    let fields = item.fields
    fields.forEach(v => {
      v.model_id = id
    })
    delete item.fields
    await RemoveFields.where({
      model_id: id
    }).del()
    await InsertFields.insert(fields)
  }
  await QueryModel.update(item).where({id})
}

o.remove = async (state,id,ent_id)=>{
  let QueryModel = DB.model.Query(ent_id)
  let QueryFields = DB.model_field.Query(ent_id)
  await QueryModel.where({id}).del()
  await QueryFields.where({filed_id:id}).del()
}



module.exports = o