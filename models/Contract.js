const MYSQL = require('../base/mysql')
const Type = require('./Type')
const UTIL = require('../base/util')
const Exception = require('../base/exception')
const Payment = require('./Payment')
let o = {}

const GZSQL = require('../base/nbgz_db')
const OASQL = GZSQL.withSchema('gzadmin')

o.required = ['Type']

const T_CONTRACT = MYSQL.Create(
  "contract",
   t => {
     // ID
     t.uuid('id').index().primary() // uuid
     // 编号
     t.string('code', 16)
     // 名称
     t.string('name', 64)
     // 类别 Contract_type
     t.integer('type_id').defaultTo(0)
     
     // 关联项目
     t.uuid('project_id')
     // 签订日期
     t.datetime('register_date')
     // 付款条件
     t.text('pay_condition_raw')
     t.string('file',256),
     t.string('file_assurance',256)
     // 甲方
     t.string('partA',64)
     // 乙方
     t.string('partB',64)
     // 金额
     t.double('amount').defaultTo(0)
     t.double('adjusted_amount').defaultTo(0)
     // 概算金额
     t.double('plan_amount').defaultTo(0)
     t.double('payed_amount').defaultTo(0)
     // 修改次数,版本
     t.integer('version').defaultTo(0)
     t.text('important_raw')
     // 创建信息
     t.uuid('created_by')
     t.datetime('created_at')
   }
)

const T_CONDITION = MYSQL.Create(
  "contract_payconditions",
  t=>{
    t.increments().primary()
    t.uuid('contract_id')
    t.string('content',64)
    t.double('amount')
    t.double('percent')
  }
)

const T_EVENT = MYSQL.Create(
  "contract_event",
  t=>{
    t.increments().primary()
    t.uuid('contract_id')
    t.string('content',256)
    t.datetime('time')
    t.datetime('created_at')
    t.uuid('created_by')
  }
)

const T_PAYRECORD = MYSQL.Create(
  "contract_payrecord",
  t=>{
    t.increments().primary()
    t.uuid('contract_id')
    t.integer('condition_id')
    t.string('comment',256)
    t.double('amount')
    t.text('files') //付款凭证
    t.datetime('paytime')
  }
)

const T_FINERECORD = MYSQL.Create(
  "contract_finerecord",
  t => {
    t.increments().primary()
    t.uuid('contract_id')
    t.integer('condition_id')
    t.string('comment', 256)
    t.double('amount')
    t.datetime('paytime')
  }
)

const T_CHANGERECORD = MYSQL.Create(
  "contract_changerecord",
  t => {
    t.increments().primary()
    t.uuid('contract_id')
    t.string('comment', 256)
    t.double('amount')
    t.datetime('paytime')
  }
)

const Tables = [T_CONTRACT,T_EVENT,T_FINERECORD,T_PAYRECORD,T_CONDITION,T_CHANGERECORD]

o.initdb = async (forced) => {
  //forced = true
  Tables.forEach(async t=>{
    await t.Init(forced)
  })
}
 const GZContractTypes = ['项目管理', '造价咨询', 'BIM咨询', '装修工程', '市政监理', '房建监理', '对外合作', '其他']

o.initdb_e = async (ent_id, forced) => {
  
  Tables.forEach(async t => {
    await t.Init(forced, ent_id)
  })


  if(ent_id == 'NBGZ'){
     await Type.AddType_e(ent_id, 'CONTRACT_TYPE', GZContractTypes)
     let contracts = await OASQL.from('contract')
     let InsertContracts = T_CONTRACT.Query(ent_id)
     let ClearContracts = T_CONTRACT.Query(ent_id)

     

     await ClearContracts.del()
     await InsertContracts.insert(contracts.map(v=>({
       id:v.id,
       code:v.code,
       name:v.name,
       amount:v.amount,
       project_id:v.id,
       partA:v.partA,
       partB:"NBGZ",
       type_id:v.type_id,
       register_date: v.registerDate,
       adjusted_amount: v.amount_adjusted,
       payed_amount:v.payed_amount,
       pay_condition_raw:v.conditions_raw,
       important_raw:v.special_conditions,
       created_at:v.inputTime,
       created_by:'NBGZ'
     })))

  }

}

o.updatePayment = async (state,id,amount,ent_id)=>{
  if(amount != undefined)
   await o.patch(state,id,{payed_amount:amount},ent_id)
}


// 
o.count = async (ctx, queryCondition = {}, ent_id) => {
  const Q = T_CONTRACT.Query(ent_id)
  const condition = {}
  let res = await Q.count('count').where(condition)
  return res.count
}

o.list = async (ent_id)=>{
  return await o.query({},{},ent_id)
}

o.query = async (ctx, queryCondition = {}, ent_id) => {
  let pageSize = queryCondition.pageSize || 100
  let page = queryCondition.page || 1
  const condition = null
  const Q = T_CONTRACT.Query(ent_id)
  if (condition) {
    Q = Q.where(condition)
  }
  let items = await Q.offset((page - 1) * pageSize).limit(pageSize)

  return items
}

o.get = async (ctx, id, ent_id) => {
  const Q = T_CONTRACT.Query(ent_id)

  let item = await Q.first().where({
    id
  })
  

  return item
}

o.add = async (ctx, data, ent_id) => {
  const Q = T_CONTRACT.Query(ent_id)

  let created_at = UTIL.getTimeStamp()
  let created_by = ctx.id

  let updateInfo = {
    id: UTIL.createUUID(),
    created_at,
    created_by,
    state:0
  }

  Object.assign(data, updateInfo)
  await Q.insert(data)
  return updateInfo
}

o.patch = async (ctx, id, data, ent_id) => {
  const Q = T_CONTRACT.Query(ent_id)
  await Q.update(data).where({
    id
  })
}

o.del = async (ctx, id_list, ent_id) => {
  const Q = T_CONTRACT.Query(ent_id)
  await Q.whereIn('id', id_list).del()
  // 移除文件的关联
  await Payment.removeFromContracts(ctx,id_list,ent_id)
}





module.exports = o