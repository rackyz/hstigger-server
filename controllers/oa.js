const mysql_cloud = require('knex')({
    client: 'mysql',
    connection: {
      host: 'zzlatm.gicp.net',
      port: 33060,
      user: 'nbgz',
      password: 'nbgz123',
      // password:"5622070x",

      database: 'gzcloud2'
    },
    acquireConnectionTimeout: 30000,
    pool: {
      min: 0,
      max: 100
    },
    debug: false,
  })
const mysql_oa = require('knex')({
  client: 'mysql',
  connection: {
    host: 'zzlatm.gicp.net',
    port: 33060,
    user: 'nbgz',
    password: 'nbgz123',
    database: 'gzadmin'
  },
  acquireConnectionTimeout: 30000,
  pool: {
    min: 0,
    max: 100
  },
  debug: false,
})

const util = require('../base/util')

const moment = require('moment')

const OLDAPI = require('../models/Oa')

const List = async ctx => {
  let queryBills = mysql_oa('contract_bill')
  let queryTrans = mysql_oa('contract_transfer')
  let queryConditions = mysql_oa('contract_payment_condition')
  let queryC2B = mysql_oa('contract_belongto_dep')
  let queryDeps = mysql_oa('department')
  let queryNodes = mysql_oa('contract_nodes')
  let queryEmployees = mysql_oa('rel_contract_employee')
  let queryTemplates = mysql_oa('user_template').where('user_id', ctx.state.id)


  let contracts = await mysql_oa('contract').where('splited', '<>', 1).orWhereNull('splited').orWhere('virtualSplit', 1).limit(50)
  let bills = await queryBills
  let trans = await queryTrans
  let nodes = await queryNodes
  let conditions = await queryConditions
  let rContract2Dep = await queryC2B
  let relEmployees = await queryEmployees
  let employees = await mysql_oa('employee')
  let monthDatas = await mysql_oa('contract_month_data')

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



  return {
    contracts,
    bills,
    trans,
    conditions,
    nodes,
    templates,
    monthDatas,
    employees: relEmployees
  }
}

const Get = async ctx => {
  let q = ctx.query.q
  if (q == 'employees') {
    return await OLDAPI.oaEmployee.allNames()
  }

  let id = ctx.params.id
  return await OLDAPI.oaContract.get(id)
}

const Post = async ctx => {
  let data = ctx.request.body
  let q = ctx.query.q
  if (q == 'list') {
    await mysql_cloud('contract').insert(data)
  }
  return "hello,ali-api-post"
}

const Patch = async ctx => {
  let id = ctx.params.id
  let q = ctx.query.q




  if (q == 'fill') {

    let contracts = await mysql_oa('contract')
    let monthDatas = await mysql_oa('contract_month_data').where('type', 'hrplan')
    let nodes = await mysql_oa('contract_nodes')
    let map = {}
    contracts.forEach(v => {
      map[v.id] = v
    })



    nodes.forEach(v => {
      let c = map[v.contract_id]
      if (c) {
        if (c.nodes) {
          c.nodes.push(v)
        } else {
          c.nodes = [v]
        }
      }
    })

    monthDatas.forEach(v => {
      let c = map[v.contract_id]
      if (c) {
        if (c.splan) {
          if (moment(c.splan.id).isBefore(moment(v.id)))
            c.splan = v
        } else {
          c.splan = v
        }
      }
    })


    let now = moment()
    contracts.forEach(v => {
      let nodes = v.nodes
      if (v.splan) {
        let data = JSON.parse(v.splan.data)
        if (data) {
          nodes = data.nodes
        }
      }

      if (!v.registerDate)
        v.registerDate = v.inputTime
      if (!v.proStartDate && nodes) {
        v.proStartDate = nodes[0].rplan_start_time
      }

      if (nodes) {
        let d = 0
        let dc = 0
        let c = false
        nodes.forEach(n => {
          d += (n.rplan_duration || 0)
          if (n.complete && !c) {
            dc = d
            c = true
          }
        })

        console.log(d, dc)

        if (v.proStartDate) {
          if (!v.proFinishedDate) {
            v.proFinishedDate = moment(v.proStartDate).add(dc, 'days').format()
          }
          v.endDate = moment(v.proStartDate).add(d, 'days').format()
        }
      }

      v.state = 0

      if (v.proStartDate && v.proFinishedDate) {

        if (moment(v.proStartDate).isAfter(moment())) {
          v.state = 0
        } else if (moment(v.proFinishedDate).isAfter(moment())) {
          v.state = 1
        } else {
          v.state = 2
        }
      } else {
        v.state = 0
      }

      if (v.endDate) {
        if (moment(v.endDate).isBefore(moment())) {
          v.state = 3
        }
      }

      console.log(v.state)


    })

    let updateItems = contracts.map(v => ({
      id: v.id,
      state: v.state,
      proStartDate: v.proStartDate,
      proFinishedDate: v.proFinishedDate,
      endDate: v.endDate
    }))
    for (let i = 0; i < updateItems.length; i++) {
      let id = updateItems[i].id
      let data = {}
      if (updateItems[i].state)
        data.state = updateItems[i].state
      if (updateItems[i].proStartDate)
        data.proStartDate = updateItems[i].proStartDate
      if (updateItems[i].proFinishedDate)
        data.proFinishedDate = updateItems[i].proFinishedDate
      if (updateItems[i].endDate)
        data.endDate = updateItems[i].endDate

      if (contracts[i].registerDate)
        data.registerDate = contracts[i].registerDate
      if (Object.keys(data).length > 0 && id) {
        console.log(data.state)
        await mysql_oa('contract').update(data).where({
          id
        })
      }
    }
    return "success"
  } else if (q == 'clone') {
    // 1 - copy basic
    let contract = await mysql_oa('contract').first().where({
      id
    })
    let bills = await mysql_oa('contract_bill').where({
      contract_id: id
    })
    let contract_belongto_dep = await mysql_oa('contract_belongto_dep').where({
      contract_id: id
    })
    let trans = await mysql_oa('contract_transfer').where({
      contract_id: id
    })
    let contract_payment_condition = await mysql_oa('contract_payment_condition').where({
      contract_id: id
    })
    let contract_month_data = await mysql_oa('contract_month_data').where({
      contract_id: id
    })
    let rel_contract_employee = await mysql_oa('rel_contract_employee').where({
      contract_id: id
    })
    let nodes = await mysql_oa('contract_nodes').where({
      contract_id: id
    })

    if (!contract)
      throw ("id不存在")

    contract.id = 'CRT00000000000VC'

    for (let i = 0; i < nodes.length; i++) {
      let v = nodes[i]
      v.id = await util.createId('CNODES')
      v.contract_id = contract.id
    }



    if (nodes.length > 0)
      await mysql_oa('contract_nodes').insert(nodes)

    contract.id = await util.createId('CRT')
    contract.name += '[副本]'
    delete contract.parent_id
    await mysql_oa('contract').insert(contract)

    contract_belongto_dep.forEach(v => {
      v.contract_id = contract.id
    })
    await mysql_oa('contract_belongto_dep').insert(contract_belongto_dep)

    for (let i = 0; i < bills.length; i++) {
      let v = bills[i]
      v.contract_id = contract.id
      v.condition_id += 10000
      let oldid = v.id
      v.id = await util.createId('BILL')
      trans.forEach(t => {
        if (t.bill_id == oldid)
          t.bill_id = v.id
      })
    }

    for (let i = 0; i < trans.length; i++) {
      let v = trans[i]
      v.id = await util.createId('TRANS')
      v.contract_id = contract.id
    }

    if (bills.length > 0)
      await mysql_oa('contract_bill').insert(bills)

    if (trans.length > 0)
      await mysql_oa('contract_transfer').insert(trans)

    contract_payment_condition.forEach(v => {
      v.contract_id = contract.id
      v.id += 10000
    })

    if (contract_payment_condition.length > 0)
      await mysql_oa('contract_payment_condition').insert(contract_payment_condition)

    contract_month_data.forEach(v => {
      v.contract_id = contract.id
    })

    if (contract_month_data.length > 0)
      await mysql_oa('contract_month_data').insert(contract_month_data)

    rel_contract_employee.forEach(v => {
      delete v.r_id
      v.contract_id = contract.id
    })

    if (rel_contract_employee.length > 0)
      await mysql_oa('rel_contract_employee').insert(rel_contract_employee)




  } else if (id == 'AddTemplate') {
    let data = ctx.request.body
    data.user_id = ctx.state.id
    await mysql_oa('user_template').insert(data)
  } else if (id == 'DelTemplate') {
    let data = ctx.request.body
    await mysql_oa('user_template').del().where({
      id: data.tid
    })
  } else {
    let data = ctx.request.body
    delete data.id

    console.log("DATA:", data)
    await mysql_oa('contract').update(data).where({
      id
    })
  }
}

module.exports = {
  Post,
  Patch,
  Get,
  List
}