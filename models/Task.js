const MYSQL = require('../base/mysql')
const Type = require('./Type')
const UTIL = require('../base/util')
const Exception = require('../base/exception')
let o = {}

o.required = ['Type']
const _T = "task"

o.initdb = async (forced) => {
  //forced = true
  await MYSQL.initdb(_T, t => {
    // ID
    t.uuid('id').index().primary() // uuid
    // 编号
    t.string('code', 16)
    // 名称
    t.string('name', 64)
    // 类别
    t.integer('type1').defaultTo(0)
    t.integer('type2').defaultTo(0)
    // 关联项目
    t.uuid('project_id')
    // 关联部门
    t.integer('dep_id')
    // 履约状态
    t.integer('state')
    // 付款条件
    t.text('pay_condition', 128)
    // 甲方
    t.uuid('partA')
    // 乙方
    t.uuid('partB')
    // 金额
    t.double('amount')
    // 修改次数,版本
    t.integer('version')
    // 创建信息
    t.uuid('created_by')
    t.datetime('created_at')
  }, forced)

}

o.initdb_e = async (ent_id, forced) => {
 await MYSQL.initdb(_T, t => {
   // ID
   t.uuid('id').index().primary() // uuid
   // 编号
   t.string('code', 16)
   // 名称
   t.string('name', 64)
   // 类别
   t.integer('type1').defaultTo(0)
   t.integer('type2').defaultTo(0)
   // 关联项目
   t.uuid('project_id')
   // 关联部门
   t.integer('dep_id')
   // 履约状态
   t.integer('state')
   // 付款条件
   t.text('pay_condition', 128)
   // 甲方
   t.uuid('partA')
   // 乙方
   t.uuid('partB')
   // 金额
   t.double('amount')
   // 修改次数,版本
   t.integer('version')
   // 创建信息
   t.uuid('created_by')
   t.datetime('created_at')
 }, forced,ent_id)
}



// 
o.count = async (ctx, queryCondition = {}, ent_id) => {
  const Q = ent_id ? MYSQL.E(ent_id, _T) : MYSQL(_T)
  const condition = {}
  let res = await Q.count('count').where(condition)
  return res.count
}

o.query = async (ctx, queryCondition = {}, ent_id) => {
  let pageSize = queryCondition.pageSize || 100
  let page = queryCondition.page || 1
  const condition = null
  const Q = ent_id ? MYSQL.E(ent_id, _T) : MYSQL(_T)
  if (condition) {
    Q = Q.where(condition)
  }
  let items = await Q.offset((page - 1) * pageSize).limit(pageSize)

  return items
}

o.get = async (ctx, id, ent_id) => {
  const Q = ent_id ? MYSQL.E(ent_id, _T) : MYSQL(_T)

  let item = await Q.first().where({
    id
  })
  

  return item
}

o.add = async (ctx, data, ent_id) => {
  const Q = ent_id ? MYSQL.E(ent_id, _T) : MYSQL(_T)

  let created_at = UTIL.getTimeStamp()
  let created_by = ctx.id
  let filelist = []

  let updateInfo = {
    id: UTIL.createUUID(),
    created_at,
    created_by
  }

  Object.assign(data, updateInfo)
  await Q.insert(data)
  return updateInfo
}

o.patch = async (ctx, id, data, ent_id) => {
  const Q = ent_id ? MYSQL.E(ent_id, _T) : MYSQL(_T)
  await Q.update(data).where({
    id
  })
}

o.del = async (ctx, id_list, ent_id) => {
  const Q = ent_id ? MYSQL.E(ent_id, _T) : MYSQL(_T)
  await Q.whereIn('id', id_list).del()
  // 移除文件的关联
}




module.exports = o