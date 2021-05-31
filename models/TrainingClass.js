const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Type = require('./Type')
const Task = require('./Task')
const api = require('../base/api')
const o = {
  required:['Type','Task']
}


let DB = {}

DB.TrainingProject = MYSQL.Create('training_project', t => {
  t.uuid('id').primary()
  t.string('name',64)
  t.integer('type_id')
  t.uuid('charger')
  t.text('desc')
  t.string('address',128)
  t.string('avatar',256)
  t.datetime('started_at')
  t.integer('finished_at') // day
  t.datetime('created_at')
  t.uuid('created_by')
  t.integer('state').defaultTo(0)
  t.boolean('enable_join').defaultTo(1)
  t.integer('count').defaultTo(0)
  t.integer('passed').defaultTo(0)
})


DB.TrainingProjectMember = MYSQL.Create('training_project_user',t=>{
  t.increments('id').primary()
  t.uuid('user_id')
  t.uuid('project_id')
  t.integer('score')
  t.text('comment')
})

DB.TrainingClass = MYSQL.Create('training_class',t=>{
  t.uuid('id').primary()
  t.uuid('project_id')
  t.string('name',32)
  t.text('desc')
  t.datetime('started_at')
  t.integer('duration') // minutes
  t.datetime('created_at')
  t.uuid('created_by')
})


DB.TrainingAppraisal = MYSQL.Create('training_appraisal',t=>{
  t.uuid('id').primary()
  t.uuid('project_id')
  t.string('name',32)
  t.text('desc')
  t.datetime('started_at')
  t.datetime('deadline')
  t.datetime('finished_at')
  t.integer('state').defaultTo(0)
  t.integer('system_type')
  t.integer('member_count')
  t.integer('submited_count')
  t.integer('passed_count')
  t.uuid('charger')
})


DB.TrainingAppraisalUser = MYSQL.Create('training_appraisal_user',t=>{
  t.uuid('id').primary()
  t.uuid('user_id')
  t.uuid('project_id')
  t.uuid('appraisal_id')
  t.integer('state').defaultTo(0)
  t.text('file')
  t.datetime('submited_at')
  t.integer('score').defaultTo(60)
  t.text('comment')
  
})


o.initdb_e = async(ent_id,forced)=>{
  // forced = true
   await MYSQL.Migrate(DB, forced, ent_id)
}


o.query = async (state,condition = {})=>{
  let page = condition.page || 1
  let pagesize = condition.pagesize || 12
  let sqlQuery = DB.TrainingProject.Query(state.enterprise_id).select('id','name','charger','created_at','created_by','avatar')
  let items = await sqlQuery.orderBy('created_at','desc').offset((page-1)*pagesize).limit(pagesize)
  console.log(page,pagesize,items.length)
  return items
}

o.get = async (state,id)=>{
  let sqlQuery = DB.TrainingProject.Query(state.enterprise_id).first()
  let sqlQueryUserRelation = DB.TrainingProjectMember.Query(state.enterprise_id)
  let sqlQueryClass = DB.TrainingClass.Query(state.enterprise_id)
  let sqlQueryTask = DB.TrainingAppraisal.Query(state.enterprise_id)
  let sqlQueryTaskUserRelation = DB.TrainingAppraisalUser.Query(state.enterprise_id)
  let item = await sqlQuery.where({id})
  item.users = await sqlQueryUserRelation.where({project_id:id})
  item.plans = await sqlQueryClass.where({project_id:id})
  item.appraisals = await sqlQueryTask.where({project_id:id})
  let training_user = await sqlQueryTaskUserRelation.where({project_id:id})
  item.appraisals.forEach(v=>{
    v.users = training_user.filter(u=>u.appraisal_id == v.id)
  })

  return item
}

o.create = async (state,item)=>{
  let sqlCreate = DB.TrainingProject.Query(state.enterprise_id)
  let updatedInfo = {
    id:UTIL.createUUID(),
    created_at:UTIL.getTimeStamp(),
    state:0,
    created_by:state.id
  }
  Object.assign(item,updatedInfo)
  await sqlCreate.insert(item)
  return updatedInfo
}

o.update = async (state,id,item)=>{
  let sqlUpdate = DB.TrainingProject.Query(state.enterprise_id)
  await sqlUpdate.update(item).where({id})
}

o.remove = async (state,id)=>{
  let sqlDelete = DB.TrainingProject.Query(state.enterprise_id)
  let sqlDeleteUserRelation = DB.TrainingProjectMember.Query(state.enterprise_id)
  let sqlDeleteClass = DB.TrainingClass.Query(state.enterprise_id)
  let sqlDeleteTask = DB.TrainingAppraisal.Query(state.enterprise_id)
  let sqlDeleteTaskUserRelation = DB.TrainingAppraisalUser.Query(state.enterprise_id)
  await sqlDelete.where({id}).del()
  await sqlDeleteUserRelation.where({project_id:id}).del()
  await sqlDeleteClass.where({project_id:id}).del()
  await sqlDeleteTask.where({project_id:id}).del()
  await sqlDeleteTaskUserRelation.where({project_id:id}).del()
}




module.exports = o