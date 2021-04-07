const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Account = require('./Account.js')
const Dep = require('./Dep')
const Enterprise = require('./Enterprise')
const Role = require('./Role')


const Type = require('./Type')
const Ding = require('./Ding')
const Module = require('./Module')
const Permission = require('./Permission')
const Flow = require('./Flow')
const File = require('./File')
const Task = require('./Task')
const FlowInstance = require('./FlowInstance')


let o = {
  required: ['Type','Enterprise','Account']
}



const DB = {}
DB.employee = MYSQL.Create('employee',t=>{
  t.uuid('id').index()
  // -- basic --
  t.integer('gender').defaultTo(0)
  t.datetime('birthday')
  t.string('native_place',128)
  t.string('photo',256)
  t.integer('political_status').defaultTo(1)
  t.string('address',128)
  t.integer('marital_status').defaultTo(0)
  // -- family
  t.string('emergency_phone',16)
  t.string('emergency_contact',16)
  // -- work
  t.datetime('employee_date')
  t.integer('employee_state')
  t.integer('personal_state')
  t.string('personal_focus',256)
  t.integer('professor_rank').defaultTo(0)
  // -- education
  t.integer('education')
  t.integer('degree')
  t.string('graduate_institution',32)
  t.string('major',32)
  t.datetime('graduate_time')
})

DB.employee_education_history = MYSQL.Create('employee_education_history',t=>{
  t.increments('id').primary()
  t.uuid('user_id')
  t.datetime('from')
  t.datetime('to')
  t.string('education_level',16)
  t.string('school_name',128)
})

DB.employee_work_history = MYSQL.Create('employee_work_history',t=>{
  t.increments('id').primary()
  t.uuid('user_id')
  t.datetime('from')
  t.datetime('to')
  t.string('position',16)
  t.string('workplace',128)
})

DB.employee_certification = MYSQL.Create('employee_certification',t=>{
  t.increments('id').primary()
  t.uuid('user_id')
  t.datetime('pass_date')
  t.integer('cert_type').defaultTo(0)
  t.boolean('locked').defaultTo(false)
})

DB.employee_family_contact = MYSQL.Create('employee_family_contact',t=>{
  t.increments('id').primary()
  t.uuid('user_id')
  t.string('name',16)
  t.string('relation',16)
  t.string('phone',16)
  t.string('workplace',128)
})


o.initdb_e = async (ent_id, forced) => {
  await MYSQL.Migrate(DB,forced,ent_id)
  if(forced){
    Type.AddType('Gender',['男','女'])
    Type.AddType('PoliticalStatus',['党员','群众'])
    Type.AddType('MaritalStatus',['未婚','已婚'])
    Type.AddType('ProfessorRank',['无','初级职称','中级职称','高级职称'])
    Type.AddType('EmploeeState',['实习期','正式员工','离职','退休'])
    Type.AddType('Education',['研究生','本科全日制','本科非全日制','专科','高中及以下'])
    Type.AddType('Degree',['硕士','学士','无'])
    Type.AddType('PersonalState',['空闲','较忙','很忙','忙到勿扰','请假中','出差中'])
    Type.AddType('CertType', ['注册监理师', '二级建造师', '一级建造师', '监理员'])
  }
}


o.List = async (state, queryCondition)=>{
  let ent_id = state.enterprise_id
  if(!ent_id)
    return []
  let user_ids = await MYSQL('account_enterprise').select('user_id').where({enterprise_id:ent_id})
  let ENT_DB = UTIL.getEnterpriseSchemeName(ent_id)
  let Query = MYSQL('account').leftOuterJoin(`${ENT_DB}.employee`, `${ENT_DB}.employee.id`, 'account.id').select('account.id as id', 'user', 'avatar', 'gender', 'name', 'frame', 'type', 'changed', 'lastlogin_at', 'created_at', 'phone', 'birthday', 'photo', 'employee_date', 'changed', 'ding_id', 'zzl_id', 'wechat_id', 'ding_open_id', 'email', 'employee_date').whereIn('account.id', user_ids.map(v => v.user_id)).where({
    ['account.type']: 1
  })

  // condition filter & paged
  if(queryCondition){
    for(let x in queryCondition){
      if(queryCondition[x]){
        if(x == 'in'){
          for(let param in queryCondition[x]){
            Query = Query.whereIn(param,queryCondition[x])
          }
        }else if(x == 'filter'){
          Query = Query.where(queryCondition[x])
        }else if(x == 'page'){
          let page = queryCondition.page || 0
          let pageSize = queryCondition.pageSize || UTIL.DEFAULT_PAGE_SIZE
          Query = Query.offset(page*pageSize).limit(page)
        }
      }
    }
  }

  let users = await Query
  let depRelations = await Dep.listRelations(ent_id)
  let roleRelations = await Role.listRelations(ent_id)
  // let educationHistory = await DB.employee_education_history.Query(ent_id)
  // let workHistory = await DB.employee_work_history.Query(ent_id)
  // let certifications = await DB.employee_certification.Query(ent_id)
  // let family_contact = await DB.employee_family_contact.Query(ent_id)
  
  users.forEach(u=>{
    u.deps = depRelations.filter(v=>v.user_id == u.id).map(v=>v.dep_id) || []
    u.roles = roleRelations.filter(v=>v.user_id == u.id).map(v=>v.role_id) || []
    // u.education_history = educationHistory.filter(v => v.user_id == u.id) || []
    // u.work_history = workHistory.filter(v=>v.user_id == u.id) || []
    // u.certifications = certifications.filter(v => v.user_id == u.id) || []
    // u.family_contact = family_contact.filter(v => v.user_id == u.id) || []
  })

  return users

}

o.Get = async (state,id)=>{
   let ent_id = state.enterprise_id
   if (!ent_id)
     return []
   let ENT_DB = UTIL.getEnterpriseSchemeName(ent_id)
   let u = await MYSQL('account').leftOuterJoin(`${ENT_DB}.employee`, `${ENT_DB}.employee.id`, 'account.id').first('account.id as id', 'user', 'avatar', 'gender', 'name', 'frame', 'type', 'changed', 'lastlogin_at', 'created_at', 'phone', 'birthday', 'photo', 'employee_date', 'changed', 'ding_id', 'zzl_id', 'wechat_id', 'ding_open_id', 'email', 'personal_state', 'personal_focus','address','emergency_contact','emergency_phone',`${ENT_DB}.employee.*`).where('account.id', id)
   let depRelations = await Dep.listRelations(ent_id,{user_id:id})
   let roleRelations = await Role.listRelations(ent_id,{user_id:id})
   let educationHistory = await DB.employee_education_history.Query(ent_id).where({user_id:id})
   let workHistory = await DB.employee_work_history.Query(ent_id).where({user_id:id})
   let certifications = await DB.employee_certification.Query(ent_id).where({
     user_id: id
   })
   let family_contact = await DB.employee_family_contact.Query(ent_id).where({
     user_id: id
   })

    u.deps = depRelations.filter(v => v.user_id == u.id).map(v => v.dep_id) || []
    u.roles = roleRelations.filter(v => v.user_id == u.id).map(v => v.role_id) || []
    u.education_history = educationHistory
    u.work_history = workHistory
    u.certifications = certifications
    u.family_contact = family_contact
   

   return u
}


o.Create = async (state,data,ent_id)=>{
  let {
    user,name,phone,email,
    deps,roles,
    gender,birthday,native_place,photo,political_status,address,marital_status,emergency_phone,emergency_contact,employee_date,employee_state,
    personal_state,personal_focus,professor_rank,education,degree,graduate_institution,major,graduate_time,
    education_history,
    work_history,
    family_contact,
    certifications
  } = data
  let timeStamp = UTIL.getTimeStamp()
  let op = state.id
  let account = {user,name,phone,email}
  console.log("ACCOUNT:",Account)
  account = await Account.create(account)
  let employee = {id:account.id,gender,birthday,native_place,photo,political_status,address,marital_status,emergency_phone,emergency_contact,employee_date,employee_state,
    personal_state,personal_focus,professor_rank,education,degree,graduate_institution,major,graduate_time}

  await Enterprise.addEnterprise(account.id,state.enterprise_id)
  let Query = DB.employee.Query(state.enterprise_id)
  await Query.insert(employee)
  if(Array.isArray(roles))
    await o.ChangeRoles(state,account.id,roles)
  if(Array.isArray(deps))
    await o.ChangeDeps(state, account.id, deps)
 
  if (Array.isArray(education_history))
    await o.ChangeEducationHistory(state,account.id,education_history)
  
  if (Array.isArray(work_history))
    await o.ChangeWorkHistory(state, account.id, work_history)
  if (Array.isArray(certifications))
    await o.ChangeCertification(state, id, certifications)
  if (Array.isArray(family_contact))
    await o.ChangeFamilyContact(state, id, family_contact)
  return {
    id:account.id,
    created_at:account.created_at,
    created_by:account.created_by,
    type: 1
  }
}

o.Update = async (state,id,data)=>{
  if(!id)
    throw EXCEPTION.E_INVALID_DATA
  let {
    user,name,phone,email,
    deps,roles,
    gender,birthday,native_place,photo,political_status,address,marital_status,emergency_phone,emergency_contact,employee_date,employee_state,
    personal_state,personal_focus,professor_rank,education,degree,graduate_institution,major,graduate_time,
    education_history,
    work_history,
    family_contact,
    certifications
  } = data
  let account = {user,name,phone,email}
  let employee = {id:account.id,gender,birthday,native_place,photo,political_status,address,marital_status,emergency_phone,emergency_contact,employee_date,employee_state,
    personal_state,personal_focus,professor_rank,education,degree,graduate_institution,major,graduate_time}
  console.log(account)
  if(Object.values(account).filter(v=>v!==undefined).length > 0)
    await MYSQL("account").update(account).where({id})
  if(Array.isArray(roles))
    await o.ChangeRoles(state,id,roles)
  if(Array.isArray(deps))
    await o.ChangeDeps(state,id,deps)
  if (Array.isArray(education_history))
    await o.ChangeEducationHistory(state, id, education_history)
  if (Array.isArray(work_history))
     await o.ChangeWorkHistory(state, id, work_history)
  if (Array.isArray(certifications))
    await o.ChangeCertification(state, id, certifications)
  if (Array.isArray(family_contact))
    await o.ChangeFamilyContact(state, id, family_contact)
  let isExistEmployee = await MYSQL.E(state.enterprise_id, "employee").first("id").where({
    id
  })
  if(isExistEmployee){
    await MYSQL.E(state.enterprise_id,"employee").update(employee).where({id})
  }else{
    employee.id = id
    await MYSQL.E(state.enterprise_id,"employee").insert(employee)
  }

  
}

o.ChangePersonalState = async (state,id,data,ent_id)=>{
  let {personal_state,personal_focus} = data
  let employee = {personal_state,personal_focus}
  let UpdateQuery = DB.employee.Query(ent_id)
  await UpdateQuery.update(employee).where({id})
}

o.ChangeDeps = async (state,id,data)=>{
  if(!id || !Array.isArray(data))
    throw EXCEPTION.E_INVALID_DATA
  let params = data.map(dep=>({
    user_id:id,
    dep_id:dep
  }))
  await MYSQL.E(state.enterprise_id,"dep_employee").where({user_id:id}).del()
  if(params.length != 0)
    await MYSQL.E(state.enterprise_id,"dep_employee").insert(params)
}

o.ChangeRoles = async (state,id,data)=>{
  if(!id || !Array.isArray(data))
    throw EXCEPTION.E_INVALID_DATA
  let params = data.map(v=>({
    user_id:id,
    role_id:v
   }))
  await MYSQL.E(state.enterprise_id,"role_user").where({user_id:id}).del()
  if(params.length != 0)
    await MYSQL.E(state.enterprise_id,"role_user").insert(params)
}

o.ChangeEducationHistory = async (state,id,data)=>{
   if (!id || !Array.isArray(data))
     throw EXCEPTION.E_INVALID_DATA

   let params = data.map(v=>({
     user_id:id,
     education_level:v.education_level,
     school_name:v.school_name,
     from:v.from,
     to:v.to
    
   }))
   let ent_id = state.enterprise_id
   let DeleteQuery = DB.employee_education_history.Query(ent_id)
   let InsertQuery = DB.employee_education_history.Query(ent_id)
   await DeleteQuery.where({user_id: id}).del()
   if (params.length != 0)
     await InsertQuery.insert(params)
}

o.ChangeWorkHistory = async (state,id,data)=>{
   if (!id || !Array.isArray(data))
     throw EXCEPTION.E_INVALID_DATA

   let params = data.map(v => ({
     user_id: id,
     position: v.position,
     workplace: v.workplace,
     from: v.from,
     to: v.to

   }))
   let ent_id = state.enterprise_id
   let DeleteQuery = DB.employee_work_history.Query(ent_id)
   let InsertQuery = DB.employee_work_history.Query(ent_id)
   await DeleteQuery.where({
     user_id: id
   }).del()
   if (params.length != 0)
     await InsertQuery.insert(params)
}

o.ChangeFamilyContact = async (state,id,data)=>{
  if (!id || !Array.isArray(data))
    throw EXCEPTION.E_INVALID_DATA

  let params = data.map(v => ({
    user_id: id,
    relation: v.relation,
    workplace: v.workplace,
    name: v.name,
    phone: v.phone

  }))
  let ent_id = state.enterprise_id
  let DeleteQuery = DB.employee_family_contact.Query(ent_id)
  let InsertQuery = DB.employee_family_contact.Query(ent_id)
  await DeleteQuery.where({
    user_id: id
  }).del()
  if (params.length != 0)
    await InsertQuery.insert(params)
}

o.ChangeCertification = async (state,id,data)=>{
  if (!id || !Array.isArray(data))
    throw EXCEPTION.E_INVALID_DATA

  let params = data.map(v => ({
    user_id: id,
    cert_type: v.cert_type,
    locked: v.locked

  }))
  let ent_id = state.enterprise_id
  let DeleteQuery = DB.employee_certification.Query(ent_id)
  let InsertQuery = DB.employee_certification.Query(ent_id)
  await DeleteQuery.where({
    user_id: id
  }).del()
  if (params.length != 0)
    await InsertQuery.insert(params)
}

o.Delete = async (state,id)=>{
  await Enterprise.removeEnterprise(id,state.enterprise_id)
  await MYSQL.E(state.enterprise_id,"employee").where({id}).del()

  await DB.employee_education_history.Query(ent_id).where({
    user_id:id
  }).del()
  await DB.employee_certification.Query(ent_id).where({
    user_id: id
  }).del()
  await DB.employee_family_contact.Query(ent_id).where({
    user_id: id
  }).del()
  await DB.employee_work_history.Query(ent_id).where({
    user_id: id
  }).del()
}

module.exports = o