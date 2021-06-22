const MYSQL = require('../base/mysql')
const GZSQL = require('../base/nbgz_db')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Enterprise = require('./Enterprise')
const Type = require("./Type")
const OA = require("./Oa")
const Permission = require('./Permission')
const Rss = require('./Rss')
const moment = require('moment')
const _ = require('lodash')
const {
  UserLogger
} = require('../base/logger')

let o = {
  required: ['Type']
}


// -- PLATFORM
const _T = 'project'
const _TR = 'project_employee'
const _TC = 'project_category'

let DB = {}

DB.project = MYSQL.Create('project',t=>{
   t.uuid('id').index().primary() // uuid
   t.string('code', 16)
   t.string('name', 64)
   t.string('shortname', 16)
   t.string('avatar', 256)
   t.integer('state').defaultTo(0)
   t.uuid('created_by')
   t.uuid('charger')
   t.datetime('created_at')
   t.string('desc', 256)
   t.integer('project_type')

})

// Building Info
DB.project_building = MYSQL.Create('project_building',t=>{
  t.uuid('id').primary()
  t.integer('level_count').defaultTo(0)
  t.integer('basement_level_count').defaultTo(0)
  t.double('field_area').defaultTo(0)
  t.double('building_area').defaultTo(0)
  t.double('gps_location_x')
  t.double('gps_location_y')
  t.string('address',256)
  t.integer('building_type')
  
})


// Gz_Audit Info
DB.project_gz_audit = MYSQL.Create('project_gz_audit',t=>{
  t.uuid('id').primary()
  t.datetime('service_started_at')
  t.datetime('service_finished_at')
  t.datetime('main_contractor_started_at')
  t.datetime('main_contractor_finished_at')
  t.string('main_contract_attached',128)
  // Array t.split_contract_durations
  //    - string64/name
  //    - string64/unit
  //    - datetime/from
  //    - datetime/to
  t.double('create_full_investment_salary')
  t.double('about_full_investment_salary')
  t.double('settlement_audit_salary')
  t.string('settlement_audit_summary_attached',128)
  t.double('settlement_audit_full_investment_salary')
  t.string('settlement_audit_full_investment_attached',128)
  t.double('contruction_project_cost_audit')
  t.string('settlement_project_cost_audit_attached',128)
  t.datetime('audit_send_time')
  t.string('audit_send_time_attached',128)
  t.datetime('first_audit_started_at')
  t.datetime('first_audit_finished_at')
  t.string('constrcution_project_cost_audit_attached',128)
  t.datetime('second_audit_started_at')
  t.datetime('second_autid_finished_at')
  // Array t.help_audit_units
  //  - string64/name
  //  - string16/charger
  //  - string16/phone

  // Array t.audit_units
  //  - string64/name
  //  - string16/charger
  //  - string16/phone
  
})


o.initdb = async (forced) => {
  await MYSQL.initdb(_T, t => {
    t.uuid('id').index().primary() // uuid
    t.string('code',16)
    t.string('name', 64)
    t.string('shortname',16)
    t.string('avatar',256)
    t.integer('state').defaultTo(0)
    t.uuid('created_by')
      t.uuid('charger')
    t.datetime('created_at')
    t.string('desc',256)
    t.integer('business_type')
    t.integer('building_type')
    t.string('address',128)
    t.text('images')
  }, forced)

  // 用工记录
  await MYSQL.initdb(_TR, t => {
    t.increments('id').index().primary() // uuid
    t.bigInteger('employee_id').notNull()
    t.uuid('project_id').notNull()
    t.bigInteger('position_id').notNull()
    t.double('factor')
    
    t.datetime('inDate')
    t.datetime('outDate')
    t.datetime('created_at')
    t.uuid('created_by')
  }, forced)

  // 项目标签
  await MYSQL.initdb(_TC, t => {
    t.increments('id').index().primary()
    t.uuid('project_id')
    t.integer('project_cat_id')
    t.string('project_cat_key')
  }, forced)

}

o.initdb_e = async (ent_schema, forced) => {
  await MYSQL.initdb(_T, t => {
    t.uuid('id').index().primary() // uuid
    t.string('code', 16)
    t.string('name', 64)
    t.string('shortname', 16)
    t.uuid('charger')
    t.string('avatar', 256)
    t.integer('state').defaultTo(0)
    t.uuid('created_by')
    t.string('desc',256)
    t.datetime('created_at')
  }, forced, ent_schema)

  // 用工记录
  await MYSQL.initdb(_TR, t => {
    t.increments('id').index().primary() // uuid
    t.uuid('employee_id').notNull()
    t.uuid('project_id').notNull()
    t.bigInteger('position_id').notNull()
    t.double('factor')
    t.datetime('inDate')
    t.datetime('outDate')
    t.boolean('trainee')
    t.datetime('created_at')
    t.uuid('created_by')
    t.string('comment',128)
  }, forced, ent_schema)

  // 项目分类
  await MYSQL.initdb(_TC, t => {
    t.increments('id').index().primary()
    t.uuid('project_id')
    t.integer('project_cat_id')
    t.string('project_cat_key')
  },forced,ent_schema)

  // if(forced){
  //    Type.AddType("P_ARCH_TYPE", ['全过程咨询', '市政监理', '项目管理', '房建监理', 'BIM咨询', '造价咨询', '招标代理', ],ent_id)
  //    Type.AddType("P_BUILDING_TYPE", ['住宅', '学校', 'CBD', '桥梁', '厂房', '公园', '小区', '旧房改造', '数据中心'], ent_id)

  // }

}

o.init = (ent_id,forced)=>{

}

// o.init = async ()=>{
//   o.initdb('ENT_NBGZ',true)
// }

o.sync = async ent_id=>{
  if(ent_id == "NBGZ")
  {
    let projects = await GZSQL('gzadmin.contract')

    return await sychronize_oa_project(projects)
  }

  return []
  
}

const sychronize_oa_project = async (raw_projects)=>{
  let projects = raw_projects.map(p=>{

    return p
  })
  // dep=>dep_belong
  // type_id => business_type
  // employees
  // 
  return projects
}

o.GetList = async ent_id=>{
  return await o.query(null,{},ent_id)
}

o.query = async (ctx,condition = {},ent_id) => {
  let Q = ent_id ? MYSQL.E(ent_id, _T) : MYSQL(_T)
  Q =  Q.select('id', 'code','name', 'state','charger','avatar','created_by','business_type','created_at')
  if(condition.where){
    Q = Q.where(condition.where)
  }
  let items = await Q
  items.forEach(v=>{
    if(v.business_type != undefined)
      v.type = ['全过程咨询', '市政监理', '项目管理', '房建监理', 'BIM咨询', '造价咨询', '招标代理'][v.business_type]
    else 
      v.type = '其他项目'
  })
  return items
}

o.add = async (ctx,item, ent_id) => {
  const Q = ent_id ? MYSQL.E(ent_id, _T) : MYSQL(_T)
  let createInfo = {
    id:UTIL.createUUID(),
    created_at: UTIL.getTimeStamp(),
    created_by:ctx.id,
    state:0
  }
  Object.assign(item,createInfo)
  await Q.insert(item)
  return createInfo
}

o.patch = async (ctx,id, item, ent_id) => {
  const Q = ent_id ? MYSQL.E(ent_id, _T) : MYSQL(_T)
  await Q.update(item).where({
    id
  })
}

o.del = async (state,id_list,ent_id) => {
   const Q = ent_id ? MYSQL.E(ent_id, _T) : MYSQL(_T)
  await Q.whereIn("id", id_list).del()
}

o.get = async (state,id,ent_id) => {
  if(id.includes('CT')){
    let item = await OA.oaContract.get(id)
    //await GZSQL('gzadmin.contract').first().where({id})
    let charger = await MYSQL('account').first().where('name',item.charger)
    if(charger)
      item.charger = charger.id
    if(item.images){
      try{
      item.images = JSON.parse(item.images)
      item.avatar = item.images[0]
      }catch(e){
        
      }
    }

     item.type = ['项目管理', '造价咨询', 'BIM咨询', '装修工程', '市政监理', '房建监理', '对外合作', '其他'][item.type_id]
    return item
  }


   const Q = ent_id ? MYSQL.E(ent_id, _T) : MYSQL(_T)
  
  let item = await Q.first().where({
    id
  })

  item.records = await o.getEmployees(state,id,ent_id)
  return item
}

o.getEmployees = async (state,id,ent_id)=>{
  const Q_RECORDS = ent_id ? MYSQL.E(ent_id, _TR) : MYSQL(_TR)
  let records = await Q_RECORDS.where({
    project_id: id
  })
  return records
}

o.patchEmployee = async (state,id,data,ent_id)=>{
 
  let Q = ent_id ? MYSQL.E(ent_id, _TR) : MYSQL(_TR)
  if(data.id){
    let record_id =  data.id
    delete data.id
    data.project_id = id
   
    await Q.update(data).where({
      id: record_id
    })
  }else{
    data.project_id = id
    if(!data.inDate)
      data.inDate = UTIL.getTimeStamp()
    if (!data.factor)
      data.factor = 1
    data.created_at = UTIL.getTimeStamp()
    data.created_by = state.id
    
    let record_id = await Q.insert(data).returning('id')
    let updateInfo = {
      created_by: data.created_by,
      project_id: data.project_id,
      id:record_id
    }
    return updateInfo
  }
}


o.oa_query = async (state,condition = {})=>{
 let query = GZSQL("gz_admin.contract")
 MYSQL.ParseCondition(query,condition)
 let items = await query
  return items
}

o.oa_query_mine = async (state,)=>{
   let me = await MYSQL('account').first('name').where({
     id: state.id
   })
   if(!me)
    return []
   let work_durations = await GZSQL("gzadmin.contract_employee").select('contract_id','positionIndex as position').where({name:me.name})
   console.log(work_durations.length)
   let contract_ids = work_durations.map(v=>v.contract_id)
   console.log(contract_ids)
   _.uniq(contract_ids)
   let queryContracts = GZSQL("gzadmin.contract").select('id', 'name', 'type_id', 'images', 'state', 'amount', 'dep_id').leftOuterJoin('gzadmin.contract_belongto_dep', 'contract_id', 'contract.id')
   if(contract_ids && contract_ids.length > 1){
      queryContracts = queryContracts.whereIn('id', contract_ids).orWhere('charger', 'like', `%${me.name}%`)
   }
    else {
    queryContracts = queryContracts.where('charger', 'like', `%${me.name}%`)
    }
   let contracts = await queryContracts
   
   contracts.forEach(v=>{
    let wd = work_durations.find(w=>w.contract_id == v.id) 
    if(wd)
      v.position = wd.position
    else
      v.position = "项目经理/总监"
      v.type = ['未设置', '全过程咨询', '房建监理', 'BIM咨询', '造价咨询', '招标代理', '项目管理', '市政监理', '其他服务'][v.type_id]
      v.dep = ['项目管理', '造价咨询', 'BIM咨询', '装修工程', '市政监理', '房建监理', '挂靠', '其他'][v.dep_id]
      v.stateText = ["前期", "在建", "竣工", "结束", "中止", "待定"][v.state]
    if(v.images)
      v.avatar = JSON.parse(v.images)[0]
   })
   return contracts
  
}

module.exports = o









