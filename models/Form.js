const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')

/**
 * form - Data Transfer form
 * Function : 1 - User-defined Data Transfer form Class
 *            used for automatic task processing
 *            2 - Integrated with several system defined forms
 *  
 */

let o = {}

let DB = {}

DB.form = MYSQL.Create('form', t => {
  t.uuid('id').primary()
  t.string('name', 32)
  t.string('desc', 256)
  t.text('layout')
  t.uuid('form_id')
  t.integer('business_type_id')
  t.uuid('created_by')
  t.datetime('created_at')
})



o.initdb_e = async (ent_id, forced) => {
  MYSQL.Migrate(DB, forced, ent_id)
}

o.query = async (state, condition, ent_id) => {
  let Queryform = DB.form.Query(ent_id)
  let forms = await Queryform
  return forms
}

o.create = async (state, item, ent_id) => {
  let Queryform = DB.form.Query(ent_id)
  let updateInfo = {
    id: UTIL.createUUID(),
    created_by: state.id,
    created_at: UTIL.getTimeStamp()
  }
  Object.assign(item, updateInfo)
  await Queryform.insert(item)
  return updateInfo
}

o.get = async (state, id, ent_id) => {
  let Queryform = DB.form.Query(ent_id)
  let form = await Queryform.first().where({
    id
  })
  if (!form)
    throw "UNEXIST ID"


  return form
}

o.update = async (state, id, item, ent_id) => {
  let QueryForm = DB.form.Query(ent_id)
  

  await QueryForm.update(item).where({
    id
  })
  
  

  
}

o.remove = async (state, id, ent_id) => {
  let Queryform = DB.form.Query(ent_id)
  await Queryform.where({
    id
  }).del()
}



module.exports = o