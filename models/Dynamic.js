const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')


let DB = {}

DB.dynamic = MYSQL.Create('dynamic',t=>{
  t.increments('id').primary()
  t.uuid('user_id')
  t.text('content')
  t.datetime('created_at')
  t.uuid('module_id')
  t.uuid('project_id')
  t.uuid('dep_id')
})

let o = {
  initdb_e:async (ent_id,forced)=>{
    await MYSQL.Migrate(DB,forced,ent_id)
  },

  query:async (state,condition)=>{
    let query = DB.dynamic.Query(state.enterprise_id)
    MYSQL.ParseCondition(query, condition)
    let items = await query
    return items
  },

  write:async (state,data)=>{
    let query = DB.dynamic.Query(state.enterprise_id)
    data.user_id= state.id
    data.created_at = UTIL.getTimeStamp()
    await query.insert(data)
  }

  ,
  removeByProjectId:async(state,project_id)=>{
    let query = DB.dynamic.Query(state.enterprise_id)
    await query.where({project_id}).del()
  },
  removeByModuleId:async(state,module_id)=>{
    console.log('remove:',module_id)
      let query = DB.dynamic.Query(state.enterprise_id)
      await query.where({
        module_id
      }).del()
  }
}


module.exports = o