const MYSQL = require('../base/mysql')
const GZSQL = require('../base/nbgz_db')
const UTIL = require('../base/util')
const TrainingClass = require('./TrainingClass')
const _ = require('lodash')
let o = {}


o.invoke = async (state,key)=>{
  if(typeof o[key] == 'function'){
    return await o[key](state)
  }
}

o.synchronize_employee = async state=>{
  let enterprise_id = ctx.state.enterprise_id
  let users = await MYSQL('account_enterprise').select('user_id as id').where({
    enterprise_id
  }).leftJoin('account', 'account.id', 'user_id').where('type', 1)
  let exists = await MYSQL.E(enterprise_id, 'employee').select('id')
  let excludes = _.difference(users.map(v => v.id), exists.map(v => v.id))
  excludes = _.uniq(excludes)
  console.log(excludes)
  await MYSQL.E(enterprise_id, 'employee').insert(excludes.map(v => ({
    id: v
  })))

  return `UPDATED ${users.length} ${exists.length} ${excludes.length} RECORDS`
}

o.synchronize_account = async state=>{
  let enterprise_id = ctx.state.enterprise_id
  let zzl_users = await GZSQL.withSchema('zzlatm').select().from('aclusr').where("allowed", "yes").where(t => {
    t.where('company', 'like', '%高专%').orWhere('company', "").orWhereNull("company")
  })
  let ding_users = await GetDDUsers()
  let users = await MYSQL('account').select('id', 'name', 'zzl_id', 'ding_id', 'user', 'phone')
  let ret = ""
  ret += `同步工作正在进行中... \n项目平台用户:${zzl_users.length},钉钉用户:${ding_users.length},已同步用户${ users.length}\n`

  let user_enterprises = await MYSQL('account_enterprise').select('user_id', 'enterprise_id')

  ret += `\n修复未注册企业的用户`
  let fix_enterprise = users.filter(v => {

    let ue = user_enterprises.find(e => e.user_id == v.id)
    if (ue) {
      return false
    }
    ret += `\n${v.name}`
    return true
  }).map(v => ({
    user_id: v.id,
    enterprise_id: "NBGZ"
  }))

  await MYSQL('account_enterprise').insert(fix_enterprise)

  ret += `
      zzl_user.uid -> user.zzl_id,
      zzl_user.
      zzl_user.phone -> ding_user.mobile-> user.phone
      md5(zzl_user.password) - > user.password,
      ding_user.user_id -> user.ding_id,
      ding_user.openId -> user.ding_open_id,
      ding_user.department ---> ADD_DEP_RELATIONS
    `
  let new_zzl_users = zzl_users.filter(z => {
    if (z.name.includes('代理') || z.name.includes('测试'))
      return false
    if (!z.phone)
      return false
    let u = users.find(v => v.zzl_id == z.uid || (v.phone != null && v.phone == z.phone))
    if (u)
      return false
    else
      return true
  })

  let ding_zzl_users = ding_users.filter(z => {
    if (z.name.includes('詹红') || z.name.includes('张童英'))
      return false
    let u = users.find(v => v.ding_id == z.userid || (v.phone != null && v.phone != "" && v.phone == z.mobile))
    if (u)
      return false
    else
      return true
  })
  ret += `\n平台新用户:${new_zzl_users.length} `


  let usermap = {}

  // create new zzl_account
  let departs = []
  let newAccounts = new_zzl_users.map(v => {
    let id = UTIL.createUUID()
    ret += `\n+ ${v.name}[${v.phone}] [${v.user}]`
    if (Array.isArray(v.departments))
      departs.concat(v.departments.map(d => {
        return {
          dep_id: d,
          user_id: id
        }
      }))
    return {
      id,
      name: v.name,
      user: v.user,
      password: UTIL.encodeMD5(v.password),
      phone: v.phone,
      zzl_id: v.zzl_id
    }
  })

  let newEnterprise = new_zzl_users.map(v => ({
    user_id: v.id,
    enterprise_id: "NBGZ"
  }))

  let employees = newAccounts.map((v => ({
    id: v.id
  })))

  // await MYSQL('account').insert(newAccounts)
  // ret += "\n 账号已创建"

  // await MYSQL('account_enterprise').insert(newEnterprise)
  // ret += "\n 企业已绑定至'宁波高专'"

  // await MYSQL.E('NBGZ', 'employee').insert(employees)
  // ret += "\n 企业员工信息初始化完成"

  ret += "\n======================================================="
  ret += `\n钉钉新用户:${ding_zzl_users.length}`
  let newDingAccount = ding_zzl_users.map(v => {
    ret += `\n+ ${v.name}[${v.mobile}]`

    return {
      id: UTIL.createUUID(),
      name: v.name,
      user: v.mobile,
      password: UTIL.encodeMD5("123456"),
      phone: v.mobile,
      ding_id: v.user_id,
      ding_open_id: v.openId
    }
  })

  let newDingEnterprise = newDingAccount.map(v => ({
    user_id: v.id,
    enterprise_id: "NBGZ"
  }))

  let dingEmployees = newDingAccount.map((v => ({
    id: v.id
  })))

  //  await MYSQL('account').insert(newDingAccount)
  //  ret += `\n ${newDingAccount.length} 账号已创建`

  //  await MYSQL('account_enterprise').insert(newDingEnterprise)
  //  ret += "\n 企业已绑定至'宁波高专'"

  //  await MYSQL.E('NBGZ', 'employee').insert(dingEmployees)
  //  ret += "\n 企业员工信息初始化完成"

  return ret

}
    
o.sychronize_projects = async (state)=>{
  let queryBills = mysql_oa.withSchema('gzadmin').from('contract_bill')
  let queryTrans = mysql_oa.withSchema('gzadmin').from('contract_transfer')
  let queryConditions = mysql_oa.withSchema('gzadmin').from('contract_payment_condition')
  let queryC2B = mysql_oa.withSchema('gzadmin').from('contract_belongto_dep')
  let queryDeps = mysql_oa.withSchema('gzadmin').from('department')
  let queryNodes = mysql_oa.withSchema('gzadmin').from('contract_nodes')
  let queryEmployees = mysql_oa.withSchema('gzadmin').from('rel_contract_employee')
  let queryTemplates = mysql_oa.withSchema('gzadmin').from('user_template')


  let contracts = await mysql_oa.withSchema('gzadmin').from('contract').where('splited', '<>', 1).orWhereNull('splited').orWhere('virtualSplit', 1)
  let bills = await queryBills
  let trans = await queryTrans
  let nodes = await queryNodes
  let conditions = await queryConditions
  let rContract2Dep = await queryC2B
  let relEmployees = await queryEmployees
  let employees = await mysql_oa.withSchema('gzadmin').from('employee')
  let monthDatas = await mysql_oa.withSchema('gzadmin').from('contract_month_data')

  let templates = await queryTemplates

  let contractMap = {}
  contracts.forEach(v => {
    let r = rContract2Dep.find(c => c.contract_id == v.id)
    if (r) {
      v.dep_id = r.dep_id
    }
    contractMap[v.id] = v
    v.billedAmount = 0
    v.transferredAmount = 0
  })

  let conditionMap = {}
  conditions.forEach(v => {
    conditionMap[v.id] = v
  })

  nodes.forEach(v => {
    if (!contractMap[v.contract_id])
      return

    if (contractMap[v.contract_id].nodes) {
      contractMap[v.contract_id].nodes.push(v)
    } else {
      contractMap[v.contract_id].nodes = [v]
    }
  })

  bills.forEach(v => {
    let c = contractMap[v.contract_id]
    if (c && v.amount) {
      c.billedAmount += v.amount
      if (v.condition_id == '10086') {
        c.billpoint = '(非常规)' + v.note
      } else {
        let condition = conditionMap[v.condition_id]
        if (condition)
          c.billpoint = condition.detail
      }
    }
  })

  trans.forEach(v => {
    let c = contractMap[v.contract_id]
    if (c && v.amount) {
      c.transferredAmount += v.amount
    }
  })

  const positions = [...(['项目经理', '项目经理助理', '前期工程师', '技术工程师', '合约工程师', '机电工程师', '项目副经理', '造价工程师', '现场工程师'].map((v, i) => ({
    id: 'a' + (i + 1),
    name: v
  }))), ...(['总监', '总代', '土建工程师', '土建监理员', '安装工程师', '市政工程师', '市政监理员', '资料员', '安装监理员', '桩基监理员'].map((v, i) => ({
    id: 'b' + (i + 1),
    name: v
  }))), {
    id: "c3",
    name: '其他岗位'
  }]

  relEmployees.forEach(v => {
    let e = employees.find(s => s.id == v.employee_id)
    v.name = e ? e.name : '未命名'
    let p = positions.find(p => p.id == v.position_id)
    v.position = p ? p.name : '未设置'

  })

  let data = {
    contracts,
    bills,
    trans,
    conditions,
    nodes,
    templates,
    monthDatas,
    employees: relEmployees
  }

  return data
}


o.clear_training_dup = async state=>{
  let res = '清理报名重复数据'
  let accounts = await MYSQL('account').select('id','name')
  // 找到所有培训项目
  let relations = await MYSQL.E(state.enterprise_id, 'training_project_user').select('id','user_id', 'project_id')
  let len = relations.length
  relations = _.uniqBy(relations,e=>{
    return JSON.stringify({user_id:e.user_id,project_id:e.project_id})
  })
  res += '\n 共检测到重复人数: '+(len - relations.length)
  // 检查重复报名人员
  res += '\n 按培训项目逐步处理'
  let projects = await MYSQL.E(state.enterprise_id,'training_project').select('id','name').orderBy('created_at','asc')
  for(let i=0;i<projects.length;i++){
    res += `\n [project] 处理项目${i+1} ${projects[i].name}`
    let relations = await MYSQL.E(state.enterprise_id, 'training_project_user').select('id', 'user_id').where('project_id',projects[i].id)
    let len = relations.length
    relations = _.uniqBy(relations, e => {
      return e.user_id
    })
    
    res += '\n 共检测到重复人数: ' + (len - relations.length)
    if(len-relations.length == 0){
      res += '\n 无需删除'
    }else{
      let idlist = relations.map(v => v.id)

      res += '\n删除重复人员完成'
      let users = await MYSQL.E(state.enterprise_id, 'training_project_user').select('user_id').where('project_id', projects[i].id).whereNotIn('id', idlist)
      res += '\n' + users.map(v => accounts.find(a => a.id == v.user_id).name).join(",")
      // await MYSQL.E(state.enterprise_id, 'training_project_user').where('project_id', projects[i].id).whereNotIn('id', idlist).del()
     

        // 更新绑定情况
    await MYSQL.E(state.enterprise_id,'training_project').update({count:relations.length}).where('id',projects[i].id)

    }
      // 更新绑定情况
       res += '\n 更新报名人员缓存完成'
      await MYSQL.E(state.enterprise_id, 'training_project').update({
        count: relations.length
      }).where('id', projects[i].id)
  

    // 删除重复的任务
    let tasks = await MYSQL.E(state.enterprise_id,'training_appraisal').where('project_id',projects[i].id)
    res += '\n 本项目共有任务:'+tasks.length
    for(let j=0;j<tasks.length;j++){
      res += `\n  [task] ** 处理任务${j+1}: ${tasks[j].name} `
      let users = await MYSQL.E(state.enterprise_id,'training_appraisal_user').where('appraisal_id',tasks[j].id)
      if(users.length == 0){
        res += '  [finish task] 未添加用户,无需修正'
        continue
      }
      let uniqUsers = _.uniqBy(users,e=>e.user_id)
      
      res += '\n   --- 检测到重复性数据:'+(users.length - uniqUsers.length)
      let idlist = uniqUsers.map(v=>v.id)
      res += '\n   --- 重复性任务存在上传:'+users.filter(v=>!idlist.includes(v.id)).filter(v=>v.state>1).length
      res += '\n   --- 移除重复性数据'
      await MYSQL.E(state.enterprise_id, 'training_appraisal_user').where('appraisal_id', tasks[j].id).where('state', 1).whereNotIn('id', uniqUsers.map(e => e.id)).del()

      res += '\n   ** 更新任务统计数据'
      await MYSQL.E(state.enterprise_id, 'training_appraisal').update({
        member_count: uniqUsers.length,
        submitted_count: uniqUsers.filter(v => v.state == 2).length,
        passed_count: uniqUsers.filter(v => v.state == 3).length
      }).where('id', tasks[j].id)
      res += `\n  [finish task] 任务(${tasks[j].name})处理完成`
    }

    res+= `\n [finsih project] 项目(${projects[i].name})处理完成`
  }


  // 检查重负人员作业及绑定情况

  //  删除重复人员
  return res
}


o.training_statistic = async state=>{
  console.log('training_statistic')
  let res = '统计培训数据\n 1 - 培训项目的任务数 \n 2 -培训人员的任务提交/得分汇总'

  res += '\n 按培训项目逐步处理'
  let projects = await MYSQL.E(state.enterprise_id, 'training_project').select('id', 'name').orderBy('created_at', 'asc')
  for (let i = 0; i < projects.length; i++) {
    let project = projects[i]
    res += `\n [project] 处理项目${i+1} ${projects[i].name}`
    let users = await MYSQL.E(state.enterprise_id, 'training_project_user').select('id', 'user_id').where('project_id', projects[i].id)
    if (users.length == 0) {
      res += '  [finish project] 未添加用户 跳过'
      continue
    }

    let tasks = await MYSQL.E(state.enterprise_id, 'training_appraisal').where('project_id', projects[i].id)
    // 更新项目的任务数
    await MYSQL.E(state.enterprise_id, 'training_project').update({
      task_count: tasks.length
    }).where('id', projects[i].id)

    res += '\n 本项目共有任务:' + tasks.length
    users.forEach(v=>{
      v.score = 0 
      v.submitted_count = 0
    })
    for (let j = 0; j < tasks.length; j++) {
      res += `\n  [task] ** 处理任务${j+1}: ${tasks[j].name} `
      let task = tasks[j]
      let user_tasks = await MYSQL.E(state.enterprise_id, 'training_appraisal_user').where('appraisal_id', task.id)
      user_tasks.forEach(t=>{
        let user = users.find(u=>u.user_id == t.user_id)
        if(!user)
        {
          console.error('user is not exist');
          return
        }
        user.score += t.score || 0
        if(t.state > 1)
          user.submitted_count++
      })
    }
    res += '** 逐步更新用户得分汇总'
    for(let j=0;j<users.length;j++){
      await MYSQL.E(state.enterprise_id, 'training_project_user').update({
        score: users[j].score,
        submitted_count: users[j].submitted_count
      }).where({
        user_id: users[j].user_id,
        project_id: project.id
      })
    } 

    res += `\n [finsih project] 项目(${project.name})处理完成`
  }
  console.log(res)

  // 检查重负人员作业及绑定情况

  //  删除重复人员
  return res
}



module.exports = o