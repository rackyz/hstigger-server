const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Type = require('./Type')
const Task = require('./Task')
const api = require('../base/api')
const _ = require('lodash')
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
  t.datetime('joined_at')
  t.integer('joined_type').defaultTo(0)
  t.datetime('evaluated_at')
  t.datetime('evaluated_by')
})

DB.TrainingClass = MYSQL.Create('training_class',t=>{
  t.increments('id').primary()
  t.uuid('project_id')
  t.string('name',32)
  t.text('desc')
  t.string('address',256)
  t.integer('state').defaultTo(0)
  t.datetime('started_at')
  t.integer('duration') // minutes
  t.datetime('created_at')
  t.uuid('created_by')
})


DB.TrainingAppraisal = MYSQL.Create('training_appraisal',t=>{
  t.increments('id').primary()
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
  t.increments('id').primary()
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
  
   await MYSQL.Migrate(DB, forced, ent_id)

   if(forced)
    await Type.AddType('TRAIN_JOIN_TYPE',['管理添加','自主报名'])
}


o.query = async (state,condition = {})=>{
  let page = condition.page || 1
  let pagesize = condition.pagesize || 12
  let sqlQuery = DB.TrainingProject.Query(state.enterprise_id).select('id','name','charger','created_at','created_by','avatar','count','passed','enable_join')
  if(condition.where)
    sqlQuery =sqlQuery.where(condition.where)
  let items = await sqlQuery.orderBy('created_at','desc').offset((page-1)*pagesize).limit(pagesize)
  return items
}

o.queryUserItems = async (state,user_id)=>{
  user_id = user_id || state.id
  let sqlQuery = DB.TrainingProject.Query(state.enterprise_id).select('training_project.id', 'name', 'charger', 'created_at', 'created_by', 'avatar', 'count', 'passed', 'enable_join').leftJoin('training_project_user','project_id','training_project.id').where({user_id})
  return await sqlQuery
}


o.get = async (state,id)=>{
  let sqlQuery = DB.TrainingProject.Query(state.enterprise_id).first()
  let sqlQueryUserRelation = DB.TrainingProjectMember.Query(state.enterprise_id)
  let sqlQueryClass = DB.TrainingClass.Query(state.enterprise_id)
  let sqlQueryTask = DB.TrainingAppraisal.Query(state.enterprise_id)
  let sqlQueryTaskUserRelation = DB.TrainingAppraisalUser.Query(state.enterprise_id)
  let item = await sqlQuery.where({id})
  if(!item)
    throw "培训项目不存在"
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

// ---

o.join = async (state, project_id, user_id) => {
  user_id = user_id || state.id
  let sqlTrainingUser = DB.TrainingProjectMember.Query(state.enterprise_id)
  let sqlExist = DB.TrainingProjectMember.Query(state.enterprise_id)
  let item = {
    user_id,
    project_id,
    joined_at:UTIL.getTimeStamp(),
    joined_type:1,
    score:0
  }
  let isExist = await sqlExist.first('id').where(item)
  if(isExist)
    throw '您已报名'
  await sqlTrainingUser.insert(item)
  await o.calcCount(state,project_id)

  // add appraisal
  // await o.addAppraisalUsers()
}

o.unjoin = async (state, project_id, user_id) => {
  user_id = user_id || state.id
  let sqlTrainingUser = DB.TrainingProjectMember.Query(state.enterprise_id)
  let item = {
    user_id,
    project_id
  }
  
  await sqlTrainingUser.where(item).del()
  await o.calcCount(state, project_id)

  // remove appraisal-users
  // await 
}




o.calcCount = async (state,project_id)=>{
  let sqlQueryUserRelation = DB.TrainingProjectMember.Query(state.enterprise_id)
  let users = await sqlQueryUserRelation.select('score').where({
     project_id
   })
  let count = users.length
  let passed = users.filter(v=>v.score > 60).length
  await o.update(state,project_id,{count,passed})

}


o.listClass = async (state,project_id)=>{
  let sqlQuery = DB.TrainingClass.Query(state.enterprise_id)
  let items = await sqlQuery.where({project_id})
  return items
}

o.addClass = async (state, project_id, item) => {
  let sqlQueryPlan = DB.TrainingClass.Query(state.enterprise_id)
  let updateInfo = {
    project_id,
    created_by:state.id,
    created_at:UTIL.getTimeStamp(),
  }
  Object.assign(item, updateInfo)
  let id = await sqlQueryPlan.insert(item).returning('id')
  updateInfo.id = id
  return updateInfo
}

o.removeClass = async (state,class_id)=>{
  let sqlQueryPlan = DB.TrainingClass.Query(state.enterprise_id)
  console.log("remove:",class_id)
  await sqlQueryPlan.where({id:class_id}).del()
}

o.updateClass = async (state,class_id,item)=>{
  let sqlQueryPlan = DB.TrainingClass.Query(state.enterprise_id)
  await sqlQueryPlan.where({id:class_id}).update(item)
}

// ---------- Appraisal

o.listAppraisal = async (state, project_id) => {
  let sqlQuery = DB.TrainingAppraisal.Query(state.enterprise_id)
  let items = await sqlQuery.where({
    project_id
  })
  return items
}


o.addAppraisal = async (state,project_id,item)=>{
  let sqlQueryPlan = DB.TrainingAppraisal.Query(state.enterprise_id)
  let updateInfo = {
    project_id,
  }
  let id = await sqlQueryPlan.insert(item).returning('id')
  updateInfo.id = id
  await o.addAppraisalTrainingUsers(ctx,project_id,id)
  return updateInfo
}

o.removeAppraisal = async (state, appraisal_id) => {
  let sqlQueryPlan = DB.TrainingAppraisal.Query(state.enterprise_id)
  let sqlQueryUsers = DB.TrainingAppraisalUser.Query(state.enterprise_id)
  await sqlQueryPlan.where({
    id: appraisal_id
  }).del()
  await sqlQueryUsers.where({appraisal_id}).del()
}

o.updateAppraisal = async (state,class_id,item)=>{
  let sqlQueryPlan = DB.TrainingAppraisal.Query(state.enterprise_id)
  await sqlQueryPlan.where({id:class_id}).update(item)
}

// add all users of trainings to 
o.addAppraisalTrainingUsers = async (state, project_id, appraisal_id) => {
  let users = o.listUser(state,project_id)
  let user_id_list = users.map(v=>v.user_id)
  await o.addAppraisalUsers(state,appraisal_id,user_id_list)
}

// --------------- Users

o.listUser = async (state, project_id) => {
  let sqlQuery = DB.TrainingProjectMember.Query(state.enterprise_id)
  let items = await sqlQuery.where({
    project_id
  })
  return items
}


o.addUsers = async (state,project_id,user_id_list = [])=>{
  let sqlQueryPlan = DB.TrainingProjectMember.Query(state.enterprise_id)
  let paramData = user_id_list.map(v=>({
    user_id:v,
    project_id,
    score:0,
    joined_at:UTIL.getTimeStamp(),
    joined_type:v.joined_type != undefined?v.joined_type:0
  }))
  await sqlQueryPlan.insert(paramData)
}

o.removeUser = async (state,record_id)=>{
  let sqlQueryPlan = DB.TrainingProjectMember.Query(state.enterprise_id)
  console.log(record_id)
  await sqlQueryPlan.where({id:record_id}).del()
}

o.removeUsersByIds  = async (state,project_id,user_list = [])=>{
  let sqlQueryPlan = DB.TrainingProjectMember.Query(state.enterprise_id)
  await sqlQueryPlan.where({project_id}).whereIn('user_id',user_list).del()
}

o.updateUser  = async (state,user_record_id,item)=>{
  let sqlQueryPlan = DB.TrainingProjectMember.Query(state.enterprise_id)
  await sqlQueryPlan.where({id:user_record_id}).update(item)
}

o.evaludate = async (state,user_record_id,item)=>{
  item.evaludated_at = UTIL.getTimeStamp()
  item.evaludated_by = state.id
  o.updateUser(state,user_record_id,item)
}

o.clearEval = async (state,user_record_id)=>{
  o.updateUser(state,user_record_id,{
    evaludated_at:null,
    evaludated_by:null,
    comment:null,
    score:null
  })
}

o.autoEval = async (state,project_id,user_record_id)=>{
  let sqlQuery = DB.TrainingProjectMember.Query(state.enterprise_id)
  let record = await sqlQuery.first('user_id').where({id:user_record_id})
  await o.autoEvalByUserIdList(state,project_id,[record.id])
}

o.autoEvalAll = async (state,project_id)=>{
 await autoEvalByUserIdList(state,project_id,[],true,true)
}

o.autoEvalByUserIdList = async (state,project_id,user_id_list = [],forced=false,all=false)=>{
   let sqlQuery = DB.TrainingAppraisalUser.Query(state.enterprise_id)
   sqlQuery = sqlQuery.select('user_id', 'appraisal_id', 'state', 'score').where({
     project_id
   })
   let items = []
   if(all){
     items = await sqlQuery
   }else{
      items = await sqlQuery.whereIn('user_id', user_id_list)
   }

   if (!forced){
     let sqlQueryEvaluated = DB.TrainingProjectMember.Query(state.enterprise_id).select('user_id', 'evaluated_at').where({
       project_id
     })
     if(!all)
      sqlQueryEvaluated = sqlQueryEvaluated.whereIn('user_list', user_id_list)
     let ignore_items = await sqlQueryEvaluated
     _.remove(items,v=>ignore_items.includes(v.user_id))
   }
   if(items.length == 0)
    return
   let scores = {}
   items.forEach(v=>{
     if(scores[v.user_id]){
       scores[v.user_id] += v.score || 0
     }else{
       scores[v.user_id] = v.score || 0
     }
   })

   let count = _.uniqueBy(items.map(v => v.appraisal_id),v=>v).length 
   if(count == 0)
    return

   for(let user_id in scores){
    await o.updateUser({
      evaludated_at: UTIL.getTimeStamp(),
      evaludated_by: state.id,
      score:parseInt(scores[user_id] / count),
      comment:"系统自动依据本次培训考核结果评价（取得分均值）"
    }).where({
      user_id,
      project_id
    })
   }
   
}

o.listAppraisals = async (state,condition = {})=>{
  let query = DB.TrainingAppraisal.Query(state.enterprise_id)
  MYSQL.parseCondition(query,condition)
  let items = await query
  return items
}


o.listAppraisalUsers = async (state,appraisal_id)=>{
  let query = DB.TrainingAppraisalUser.Query(state.enterprise_id)
  let items = await query.where({appraisal_id})
  return items
}

o.getAppraisal = async (state,appraisal_id)=>{
  let query = DB.TrainingAppraisal.Query(state.enterprise_id)
  let item = await query
  item.users = await o.listAppraisalUsers(state,appraisal_id)
  return item
}


o.addAppraisalUsers = async (state,appraisal_id,user_id_list)=>{
  let queryAppraisal = DB.TrainingAppraisal.Query(state,enterprise_id)
  let app = await queryAppraisal.first('project_id')
  let project_id = ""
  if(!app)
    project_id = app.project_id
  let query = DB.TrainingAppraisalUser.Query(state.enterprise_id)
  let items = user_id_list.map(v=>({
    user_id,
    appraisal_id,
    project_id
  }))
  query = query.insert(items)
  await query
}

o.removeAppraisalUsers = async (state,appraisal_id,user_id_list = [])=>{
  let query = DB.TrainingAppraisalUser.Query(state.enterprise_id)
  await query.whereIn('user_id',user_id_list).del()
}

o.eval = async (state,appraisal_id,data)=>{
  let query = DB.TrainingAppraisalUser.Query(state.enterprise_id)
  data.evaluated_at = UTIL.getTimeStamp()
  data.evaludated_by = state.id
  await query.insert(data)
}


module.exports = o