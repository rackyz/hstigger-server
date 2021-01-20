const mysql = require('../base/nbgz_db')
const debug = require('debug')('Kernel')
const moment = require('moment')


////////////////////////////////////////////////////////////
// OA - system
var models = {}


models.oaPayCondition = {
  table: 'gzadmin.contract_payment_condition',
  async list(contract_id) {
    return await mysql(this.table).where('contract_id', contract_id)
  },
  async get(id) {
    return await mysql(this.table).first().where('id', id)
  }

}

models.oaType = {
  t: 'gzadmin.category',
  async get(id) {
    if (id)
      return await mysql(this.t).first().where({
        id
      })
  },
  async list() {
    return await mysql(this.t).select('*')
  }
}

models.oaDepartment = {
  table: 'gzadmin.department',
  con2dep: 'gzadmin.contract_belongto_dep',
  async list() {
    let res = await mysql(this.con2dep).select('*')
    return res
  },
  async getContractDeps(id) {
    let res = await mysql(this.con2dep).where('contract_id', id).leftJoin(this.table, 'dep_id', `${this.table}.id`)
    return res.map(item => item.id)
  },
  async getContractDepsFull(id) {
    let res = await mysql(this.con2dep).where('contract_id', id).leftJoin(this.table, 'dep_id', `${this.table}.id`)
    return res
  }
}

models.oaMonthData = {
  t: 'gzadmin.contract_month_data',
  async deleteContractPlan(date_id, contract_id) {
    await mysql(this.t).where({
      id: date_id,
      contract_id,
      type: 'hrplan'
    }).del()
  },
  async deleteContractHrData(date_id, contract_id) {
    await mysql(this.t).where({
      id: date_id,
      contract_id,
      type: 'hractual'
    }).del()
  },
  async insert(param) {
    await mysql(this.t).insert(param)
  }
}


models.oaTrans = {
  t: 'gzadmin.contract_transfer',
  async list(bill_id) {
    let query = mysql(this.t)
    if (bill_id)
      query = query.where({
        bill_id
      })
    return await query
  },
  async listByContract(contract_id) {
    let res = await mysql(this.t).where({
      contract_id
    })
    return res
  },
  async del(id) {
    await mysql(this.t).where({
      id
    }).del()
  },

  async delByContract(contract_id) {
    await mysql(this.t).where({
      contract_id
    }).del()
  },

  async insert(data, user) {

    if (Array.isArray(data)) {
      data = data.filter(v => v.bill_id)
      for (let i = 0; i < data.length; i++) {
        let v = data[i]
        let timeStamp = models.util.getTimeStamp()
        if (!v.id) {
          let id = await models.util.createId('trans')
          v.id = id
        }
        v.inputor = user
        v.inputTime = timeStamp
      }
    } else {
      let timeStamp = models.util.getTimeStamp()
      if (!data.id) {
        let id = await models.util.createId('trans')
        data.id = id
      }
      data.inputor = user
      data.inputTime = timeStamp
    }


    await mysql(this.t).insert(data)
    return data
  }
}

models.oaContract = {
  $table: 'gzadmin.contract',
  verify(item) {

  },
  nodes: {
    nt: 'gzadmin.contract_nodes',
    async list(con_id) {
      let res = await mysql(this.nt).where('contract_id', con_id)
      res.forEach(v => {
        v.hrplan = v.hrplan ? JSON.parse(v.hrplan) : []
        v.actual_hrplan = v.actual_hrplan ? JSON.parse(v.actual_hrplan) : []
      })
      return res
    },
    async update(id, nodes) {
      if (nodes) {
        for (let i = 0; i < nodes.length; i++) {
          nodes[i].id = await models.util.createId('CNODES')
          delete nodes[i].rplan_end_time
          nodes[i].contract_id = id
          nodes[i].actual_start_time = nodes[i].rplan_start_time
          nodes[i].actual_duration = nodes[i].rplan_duration
          delete nodes[i].hrsum
          if (nodes[i].hrplan) {
            nodes[i].hrplan = JSON.stringify(nodes[i].hrplan)
            nodes[i].actual_hrplan = nodes[i].hrplan
          }
        }

        await mysql(this.nt).where('contract_id', id).del()
        await mysql(this.nt).insert(nodes)
      }

    },
    async updateActualPlan(id, data, user) {
      let nodes = data.nodes
      let positions = data.positions
      let updateParams = data.calc || {}
      let completeTime = null


      let hrplan = {
        nodes,
        positions,
        updator: user,
        updateTime: models.util.getTimeStamp()
      }
      let params = {
        data: JSON.stringify(hrplan),
        updator: user,
        updateTime: models.util.getTimeStamp()
      }
      let res = await mysql('gzadmin.contract_month_data').first('id').where('id', data.date_id).where('contract_id', id).where('type', 'hrplan')
      if (res) {
        await mysql('gzadmin.contract_month_data').update(params).where('id', data.date_id).where('contract_id', id).where('type', 'hrplan')
      } else {
        params.contract_id = id
        params.id = data.date_id
        params.type = 'hrplan'
        await mysql('gzadmin.contract_month_data').insert(
          params
        )
      }


      if (Array.isArray(nodes) && nodes.length > 0) {
        for (let i = 0; i < nodes.length; i++) {
          let nid = nodes[i].id
          delete nodes[i].id
          if (nodes[i].complete)
            completeTime = moment(nodes[i].actual_start_time).add(nodes[i].actual_duration, 'd').format("YYYY-MM-DD")
          if (nodes[i].actual_hrplan) {
            nodes[i].actual_hrplan = JSON.stringify(nodes[i].actual_hrplan)
          }
          if (nid) {
            await mysql(this.nt).where('id', nid).update(nodes[i])
          }
        }

        updateParams.startDate = nodes[0].actual_start_time,
          updateParams.endDate = completeTime
      }

      if (Array.isArray(positions) && positions.length > 0) {
        updateParams.actual_positions = JSON.stringify(positions)
      }

      await models.oaContract.update(id,
        Object.assign(data.calc, updateParams))
    }
  },
  async update(id, data) {
    // nodes
    if (data.plans) {
      data.nodes = data.plans.nodes
      if (data.plans.positions) {
        data.positions = JSON.stringify(data.plans.positions)
        data.actual_positions = data.positions
        if (data.nodes && data.nodes.length > 0) {
          data.startDate = data.nodes[0].rplan_start_time
          let lastIndex = data.nodes.length - 1
          data.endDate = models.util.dateAddDays(data.nodes[lastIndex].rplan_start_time, data.nodes[lastIndex].rplan_duration)
        }
      }
      delete data.plans
    }

    if (data.aplans) {
      await this.nodes.updateActualPlan(data.aplans.nodes)
      data.actual_positions = JSON.stringify(data.plans.positions)

      if (data.nodes && data.nodes.length > 0) {
        data.startDate = data.nodes[0].actual_start_time
        let lastIndex = data.nodes.length - 1
        data.endDate = models.util.dateAddDays(data.nodes[lastIndex].actual_start_time, data.nodes[lastIndex].actual_duration)
      }

      //LOG 修改计划
    }





    if (data.nodes) {
      await this.nodes.update(id, data.nodes)
      delete data.nodes
      data.rplan = true

    }




    await mysql(this.$table).update(data).where({
      id
    })
  },
  async updateEmployeePlan(id, e, user) {

    if (Array.isArray(e)) {
      let params = {
        contract_id: id,
        type: 'eplan',
        updator: user,
        updateTime: models.util.getTimeStamp(),
        data: JSON.stringify(e)
      }
      await await mysql('gzadmin.contract_month_data').where('contract_id', id).where('type', 'eplan').del()
      await models.oaMonthData.insert(params)
    }
  },
  async deleteEmployeePlan(id) {
    await await mysql('gzadmin.contract_month_data').where('contract_id', id).where('type', 'eplan').del()
  },
  async getByCode(code) {
    return await mysql(this.$table).first().where({
      code
    })
  },
  async count() {
    return await mysql(this.$table).count('id as c')
  },
  async list(condition, selector) {
    let query = mysql(this.$table)
    if (selector)
      query = query.distinct(selector).orderBy('inputTime', 'desc')
    if (condition) {
      if (condition.where)
        query = query.where(condition.where)
      if (condition.authed)
        query = query.whereIn('id', condition.authed)
      if (condition.mother)
        query = query.where('parent_id', '')
      if (condition.sub) {
        query = query.where('splited', 0).orWhereNull('splited')
      }
    }

    return await query
  },
  async listtree(condition, onlyProject) {
    let query = mysql(this.$table).orderBy('inputTime', 'desc')

    if (condition && condition.authed)
      query = query.whereIn('id', condition.authed)
    else if (onlyProject) {
      query = query.where('splited', '<>', 1).orWhereNull('splited').orWhere('virtualSplit', 1)
    } else {
      query = query.where('parent_id', '')
    }
    let res = await query

    if (!onlyProject) {
      for (let i = 0; i < res.length; i++) {
        //  res[i].subs = await this.list({
        //      where: {
        //          parent_id: res[i].id
        //      }
        //  })
        res[i].bills = await models.oaBill.list({
          contract_id: res[i].id
        }, 'asc')
        res[i].nodes = await this.nodes.list(res[i].id)

        //  if (res[i].subs) {
        //      for (let j = 0; j < res[i].subs.length; j++) {
        //          res[i].subs[j].bills = await models.oaBill.list({
        //              contract_id: res[i].subs[j].id
        //          })
        //      }
        //  }

        await models.oaBill.calcAmount(res[i])


      }
    }


    return res
  },
  async delete(id, user) {
    const $table = "gzadmin.contract"
    const $table_belongToDeps = "gzadmin.contract_belongto_dep"
    const $table_conditions = "gzadmin.contract_payment_condition"
    const $table_nodes = "gzadmin.contract_nodes"
    const $table_bills = "gzadmin.contract_bill"

    // 删除所有子合同
    res = await mysql(this.$table).where('parent_id', id)
    if (res > 0) {
      for (let i = 0; i < res.length; i++)
        await this.delete(res[i].id)
    }
    try {
      await mysql.transaction(trx => {
        //  删除合同主体
        return mysql($table).transacting(trx).where('id', id).del().then(res => {
          // 删除合同付款条件
          return mysql($table_conditions).transacting(trx).where('contract_id', id).del().then(res => {
            // 删除部门信息
            return mysql($table_belongToDeps).transacting(trx).where('contract_id', id).del().then(res => {
              // 删除收据
              return mysql($table_bills).transacting(trx).where('contract_id', id).del().then(res => {
                // 删除项目节点数据
                return mysql($table_nodes).transacting(trx).where('contract_id', id).del().then(trx.commit).catch(trx.rollback)
              }).catch(trx.rollback)
            }).catch(trx.rollback)
          }).catch(trx.rollback)
        }).catch(trx.rollback)
      })
      await mysql('gzadmin.contract_employee').where('contract_id', id).del()
      await mysql('gzadmin.contract').where('parent_id', id).del()
    } catch (e) {
      throw (e)
    }
  },

  async updatePayConditions(id, data) {
    if (Array.isArray(data) && data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        let pc_id = data[i].id
        if (!pc_id)
          continue
        let estimate_payment_date = data[i].estimate_payment_date
        let actual_payment_date = data[i].actual_payment_date
        delete data[i].current
        let updateItem = {}
        if (estimate_payment_date)
          updateItem.estimate_payment_date = estimate_payment_date
        if (actual_payment_date)
          updateItem.actual_payment_date =
          actual_payment_date
        if (estimate_payment_date || actual_payment_date) {
          await mysql('gzadmin.contract_payment_condition').update(updateItem).where('id', pc_id)

          //log
        }
      }

    }
  },
  async exist(code) {
    // 检测重复性
    let res = await mysql("gzadmin.contract").select('id').where('code', code)
    if (res.length != 0)
      return true
    else
      return false
  },
  async insert(data, user) {
    const $table = "gzadmin.contract"
    const $table_belongToDeps = "gzadmin.contract_belongto_dep"
    const $table_conditions = "gzadmin.contract_payment_condition"
    const $table_deps = "gzadmin.department"
    let conditions = data.conditions
    delete data.conditions
    let belongToDeps = data.belongToDeps
    delete data.belongToDeps

    data.state = 'created'

    // 1-处理customType
    if (data.customType && data.customType.trim() != "") {
      // data.type_id = OAType.Add(data.customType)
      data.type_id = await mysql($table_type).returning('id').insert({
        name: data.customeType,
        family: "contractType"
      })
      data.parent_id = data.type_id
      delete data.customType
    }

    let id = await models.util.createId('CT')

    // 2-处理conditions
    let conditions_params = null
    if (conditions && conditions.length > 0) {
      conditions_params = await Promise.all(conditions.map(async v => ({
        id: await models.util.createId('paycon'),
        contract_id: id,
        detail: v.detail,
        amount: v.amount,
        estimate_payment_date: v.estimate_payment_date,
        actual_payment_date: v.actual_payment_date,
        percent: v.percent
      })))
    }

    // 3-处理deps
    if (typeof belongToDeps !== 'object')
      belongToDeps = [belongToDeps]
    let dep_params = belongToDeps.map(item => ({
      dep_id: item,
      contract_id: id
    }))

    // 4-处理subs
    let subs = null
    if (data.subs && data.subs.length > 0) {
      subs = data.subs
      for (let i = 0; i < data.subs.length; i++) {
        subs[i].id = await models.util.createId('CT')
        subs[i].parent_id = id
        subs[i].inputor = user
        subs[i].inputTime = models.util.getTimeStamp()
        subs[i].effectiveDate = data.effectiveDate
        subs[i].registerDate = data.registerDate
        subs[i].partA = data.partA
        let subtype = await models.oaType.get(subs[i].type_id)
        subs[i].name = data.name + `(${subtype?subtype.name:'未分类'})`
        if (subs[i].conditions && subs[i].conditions.length > 0) {
          conditions_params = conditions_params ? conditions_params.concat(
            await Promise.all(subs[i].conditions.map(async v => ({
              id: await models.util.createId('paycon'),
              amount: v.amount,
              contract_id: subs[i].id,
              detail: v.detail,
              estimate_payment_date: v.estimate_payment_date,
              actual_payment_date: v.actual_payment_date,
              percent: v.percent
            })))
          ) : await Promise.all(subs[i].conditions.map(async v => ({
            id: await models.util.createId('paycon'),
            amount: v.amount,
            contract_id: subs[i].id,
            detail: v.detail,
            estimate_payment_date: v.estimate_payment_date,
            actual_payment_date: v.actual_payment_date,
            percent: v.percent
          })))
          delete subs[i].conditions
        }

        if (subs[i].belongToDeps) {
          if (typeof subs[i].belongToDeps !== 'object')
            subs[i].belongToDeps = [subs[i].belongToDeps]
          dep_params = dep_params.concat(
            subs[i].belongToDeps.map(item => ({
              dep_id: item,
              contract_id: subs[i].id
            }))
          )
          delete subs[i].belongToDeps
        }

      }
      delete data.subs
    }
    delete data.subs

    if (data.special_conditions)
      data.special_conditions = JSON.stringify(data.special_conditions)

    if (data.qalist)
      data.qalist = JSON.stringify(data.qalist)

    if (data.bi_amount)
      data.bi_amount = JSON.stringify(data.bi_amount)

    data.id = id
    data.inputTime = moment().format('YYYY-MM-DD HH:mm:ss')
    data.inputor = "admin"
    await mysql.transaction(trx => {
      return mysql($table).transacting(trx).insert(data).then(contract_id => {

        return mysql($table_belongToDeps).transacting(trx).insert(dep_params).then(res => {
          if (conditions_params) {
            return mysql($table_conditions).transacting(trx).insert(conditions_params).then(
              res => {
                if (subs) {
                  return mysql($table).transacting(trx).insert(subs).then(trx.commit).catch(trx.rollback)
                } else {
                  return trx.commit()
                }

              }).catch(trx.rollback)
          } else {
            if (subs) {
              return mysql($table).transacting(trx).insert(subs).then(trx.commit).catch(trx.rollback)
            } else {
              return trx.commit()
            }
          }
        }).catch(trx.rollback)

      }).catch(trx.rollback)
    })

  },
  async report(type, options) {
    options.where = {
      splited: null
    }
    let contracts = await this.list(options)
    switch (type) {
      case 'summary':
        for (let i = 0; i < contracts.length; i++) {
          let item = contracts[i]
          item.bills = await models.oaBill.list({
            contract_id: item.id
          }, 'asc')
          item.conditions = await models.oaPayCondition.list(item.id)
          await models.oaBill.calcAmount(item)
        }
        break
    }

    return contracts
  },
  async getDetail(id) {
    let res = await mysql(this.$table).first().where('id', id)
    if (!res) {
      throw ('合约id不存在')
    }
    res.bills = await models.oaBill.list({
      contract_id: id
    }, 'asc')
    await models.oaBill.calcAmount(res)

    res.employeesEx = await mysql('gzadmin.rel_contract_employee').select('gzadmin.rel_contract_employee.*',
      'name').leftJoin('gzadmin.employee', 'gzadmin.employee.id', 'employee_id').where('contract_id', id)

    if (res.images) {
      res.images = JSON.parse(data.images)
    }
    if (res.bi_amount) {
      try {
        res.bi_amount = JSON.parse(res.bi_amount)
      } catch (e) {
        delete res.bi_amount
      }
    }

    if (res.inherit) {
      res.conditions = await models.oaPayCondition.list(res.parent_id)
      let res = await mysql(this.$table).first('amount').where('id', res.parent_id)
      let parentAmount = res ? res.amount || 0 : 0
      res.conditions.forEach(v => {
        v.amount = parseFloat(parentAmount * v.percent / 100)
      })
    } else
      res.conditions = await models.oaPayCondition.list(id)

    res.deps = await models.oaDepartment.getContractDeps(id)

    return res
  },
  async get(id) {
    let res = await mysql(this.$table).where('id', id)
    if (res.length == 0)
      throw (`合约id(${id})不存在`)

    let item = res[0]
    item.adjustedAmount = parseFloat(item.amount) - (item.amount_adjust ? parseFloat(item.amount_adjust) : 0)
    item.nodes = await this.nodes.list(id)
    item.conditions = await models.oaPayCondition.list(item.inherit ? item.parent_id : id)
    if (item.inherit) {
      item.conditions.forEach(v => {
        v.amount = parseFloat(item.amount * v.percent / 100)
      })
    }
    item.progress_nodes = await models.oaContract.list(id)

    if (item.images) {
      item.images = JSON.parse(item.images)
    }

    if (item.bi_amount) {
      try {
        item.bi_amount = JSON.parse(item.bi_amount)
      } catch (e) {
        delete item.bi_amount
      }
    }

    if (item.qalist && typeof (item.qalist) == 'string')
      item.qalist = JSON.parse(item.qalist)
    else
      item.qalist = []

    if (item.special_conditions && typeof (item.special_conditions) == 'string')
      item.special_conditions = JSON.parse(item.special_conditions)
    else
      item.special_conditions = []
    item.monthData = await mysql('gzadmin.contract_month_data').where('contract_id', id).where('type', 'hrplan')
    item.monthData.sort((a, b) => {
      return moment(a.id, 'YYYY-MM').isAfter(b.id, 'YYYY-MM') ? 1 : -1
    })

    item.monthData.forEach(v => {
      if (v.data)
        v.data = JSON.parse(v.data)
    })





    item.type = await models.oaType.get(item.type_id)
    item.bills = await models.oaBill.list({
      contract_id: id
    }, 'asc')

    item.trans = await models.oaTrans.listByContract(id)

    await models.oaBill.calcAmount(item)
    item.bills.forEach(v => {
      let c = item.conditions.find(con => con.id == v.condition_id)
      if (c)
        c.actual_payment_date = v.billingDate
    })
    item.deps = await models.oaDepartment.getContractDepsFull(id)
    item.belongToDeps = await models.oaDepartment.getContractDeps(id)
    item.positions = item.positions ? JSON.parse(item.positions) : []
    item.actualPositions = item.actual_positions ? JSON.parse(item.actual_positions) : []
    if (item.payplan)
      item.payplan = JSON.parse(item.payplan)
    item.plans = {
      nodes: item.nodes,
      positions: item.positions,
      actualPositions: item.actual_positions
    }
    item.actual_positions = item.actual_positions ? JSON.parse(item.actual_positions) : []

    item.employeesEx = await mysql('gzadmin.rel_contract_employee').select('gzadmin.rel_contract_employee.*',
      'name').leftJoin('gzadmin.employee', 'gzadmin.employee.id', 'employee_id').where('contract_id', id)


    item.employees = await mysql('gzadmin.contract_employee').where('contract_id', id).orderBy('inputTime', 'desc')
    item.hrMonthData = await mysql('gzadmin.contract_month_data').where('contract_id', id).where('type', 'hractual')
    item.hrMonthData.sort((a, b) => {
      return moment(a.id, 'YYYY-MM').isAfter(b.id, 'YYYY-MM') ? 1 : -1
    })

    item.hrMonthData.forEach(v => {
      if (v.data)
        v.data = JSON.parse(v.data)
    })

    let eplan = await mysql('gzadmin.contract_month_data').first('*').where('contract_id', id).where('type', 'eplan')
    if (eplan && eplan.data)
      eplan.data = JSON.parse(eplan.data)
    item.hrActualData = {
      employees: item.employees || [],
      factors: item.hrMonthData || [],
      plan: eplan || []
    }
    item.subs = await mysql(this.$table).where('parent_id', id)

    if (item.subs && item.subs.length > 0) {
      item.splited = true
      for (let i = 0; i < item.subs.length; i++) {
        item.subs[i].conditions = await models.oaPayCondition.list(item.subs[i].id)
        item.subs[i].belongToDeps = await models.oaDepartment.getContractDeps(item.subs[i].id)
        item.subs[i].type = await models.oaType.get(item.subs[i].type_id)


      }
    }
    return item
  },
  async updateEmployees(id, employees, factors, user) {
    let timeStamp = models.util.getTimeStamp()
    // employees
    let updateItems = []
    let insertItems = []
    if (Array.isArray(employees)) {
      for (let i = 0; i < employees.length; i++) {
        let v = employees[i]
        if (v.id) {
          let id = v.id
          updateItems.push(v.id)
          delete v.id
          await mysql('gzadmin.contract_employee').where('id', id).update(v)

          continue
        }
        v.id = await models.util.createId('chr')
        v.contract_id = id,
          v.inputor = user
        v.inputTime = timeStamp
        insertItems.push(v)
      }
      await mysql('gzadmin.contract_employee').where('contract_id', id).whereNotIn('id', updateItems).del()
      await mysql('gzadmin.contract_employee').insert(insertItems)
    }

    if (Array.isArray(factors)) {
      factors.forEach(v => {
        v.data = JSON.stringify(v.data)
        v.contract_id = id,
          v.updator = user
        v.updateTime = timeStamp
        v.type = 'hractual'
      })
      await mysql('gzadmin.contract_month_data').where('contract_id', id).where('type', 'hractual').del()
      await mysql('gzadmin.contract_month_data').where('contract_id', id).insert(factors)
    }
  }

}

models.oaApply = {
  t: "gzadmin.apply",
  td: "gzadmin.contract_draft",
  l18n: {
    action: {
      'insert': '创建',
      'update': '修改',
      'delete': '删除'
    },
    type: {
      'contract': '合约',
      'contract-hr': '人力资源信息',
      'contract-raw-plan': '签阅计划',
      'contract-bill': '开票信息'
    }
  },
  async get(id) {
    let item = await mysql(this.t).first().where({
      id
    })
    if (!item) {
      throw ('该操作不存在,请联系管理员')
    }
    if (item.type == 'contract') {
      if (item.action == 'insert') {
        return JSON.parse(item.data)
      } else {
        let oldItem = await models.oaContract.get(item.target_id)
        return item.data ? Object.assign(oldItem, JSON.parse(item.data)) : oldItem
      }
    }
  },
  async applyTo(action, type, target_id, data, user) {
    await mysql(this.t).insert({
      action,
      type,
      target_id,
      data: data ? JSON.stringify(data) : '',
      inputor: user,
      inputTime: models.util.getTimeStamp(),
      state: 0
    })

    if (action == 'insert' && type == 'contract') {
      await mysql(this.td).where('id', target_id).update('state', 2)
    }

  },
  async count() {
    let res = await mysql(this.t).count('id as c')
    return res[0].c
  },
  async list(type, user) {

    let query = mysql(this.t).orderBy('inputTime', 'desc')
    query.select('apply.*', 'name').leftOuterJoin('gzadmin.contract', 'target_id', 'contract.id')
    // conditions
    if (user)
      query = query.where('inputor', user)

    let res = await query
    res.forEach(v => {
      if (v.action == 'insert')
        v.name = v.target_id
      else if (!v.name)
        v.state = 4
      v.action = this.l18n.action[v.action]
      v.type = this.l18n.type[v.type]
    })

    return res
  },
  async permit(id, user, data) {
    let applyItem = await mysql(this.t).first().where({
      id
    })
    if (!applyItem) {
      throw ('该操作不存在,请联系管理员')
    }
    switch (applyItem.action) {
      case 'insert':
        if (applyItem.type == 'contract') {
          await models.oaContract.insert(JSON.parse(applyItem.data), applyItem.inputor)
          await mysql(this.td).where('id', applyItem.target_id).del()
        }

        break

      case 'update':

        break
      case 'delete':
        if (applyItem.type == 'contract')
          await models.oaContract.delete(applyItem.target_id)
    }
    await mysql(this.t).update({
      state: 1,
      checkor: user,
      reason: data.reason || "",
      checkTime: models.util.getTimeStamp()
    }).where({
      id
    })


  },
  async deny(id, user, data) {
    await mysql(this.t).update({
      state: 2,
      checkor: user,
      reason: data.reason || "",
      checkTime: models.util.getTimeStamp()
    }).where({
      id
    })

    // 1 - 暂存
    // await mysql(this.td).where('id', applyItem.target_id).update('state',1)
  },
  async cancel(id) {
    await mysql(this.t).where({
      id
    }).del()
  }
}

models.oaBill = {
  $table: "gzadmin.contract_bill",
  $tableContract: "gzadmin.contract",
  verify(bill) {
    return true
  },
  async updateTransContract(contract_id) {
    let bills = await this.list({
      contract_id
    })
    if (bills.length > 0)
      await Promise.all(bills.map(async v => await this.updateTrans(v.id)))
  },
  async updateTrans(id) {
    let trans = await models.oaTrans.list(id)
    let params = {
      transferredAmount: 0
    }
    if (trans.length > 0) {
      let amount = 0
      trans.forEach(v => {
        amount += parseFloat(v.amount)
      })
      let transferredDate = trans[trans.length - 1].transferredDate

      if (transferredDate)
        params.transferredDate = transferredDate
      params.transferredAmount = amount
    }
    await mysql(this.$table).update(params).where({
      id
    })
  },
  async count(conditions = {}) {
    let res = await mysql(this.$table).where(conditions).count('id as c')
    return res[0].c
  },
  async calcAmount(item) {
    if (item.subs && item.subs.length > 0) {
      item.billedAmount = 0
      item.transferredAmount = 0
      item.currentMonthBilled = 0
      item.currentSeasonBilled = 0
      item.currentYearBilled = 0
      for (let i = 0; i < item.subs.length; i++) {
        await this.calcAmount(item.subs[i])
        item.billedAmount += item.subs[i].billedAmount || 0
        item.transferredAmount += item.subs[i].transferredAmount || 0
        item.billpoint = item.subs[i].billpoint
        if (item.subs[i].currentMonthBilled)
          item.currentMonthBilled += item.subs[i].currentMonthBilled
        if (item.subs[i].currentSeasonBilled)
          item.currentSeasonBilled += item.subs[i].currentSeasonBilled
        if (item.subs[i].currentYearBilled)
          item.currentYearBilled += item.subs[i].currentYearBilled
      }
    } else if (item.bills && item.bills.length > 0) {
      item.billedAmount = 0
      item.transferredAmount = 0
      item.currentMonthBilled = 0
      item.currentSeasonBilled = 0
      item.currentYearBilled = 0
      let current = moment()

      item.bills.forEach(v => {
        if (v.transferredAmount)
          item.transferredAmount += parseFloat(v.transferredAmount)
        if (v.amount) {
          item.billedAmount += parseFloat(v.amount)
          let mBillingDate = moment(v.billingDate)
          if (current.format('YYYY-MM') == mBillingDate.format('YYYY-MM')) {
            item.currentMonthBilled += v.amount
          }

          if (current.format('YYYY') == mBillingDate.format('YYYY')) {
            item.currentYearBilled += v.amount
          }

          if (current.year() == mBillingDate.year() && current.quarter() == mBillingDate.quarter()) {
            item.currentSeasonBilled += v.amount
          }
        }
      })
      let lastBillCondition = await models.oaPayCondition.get(item.bills[item.bills.length - 1].condition_id)
      item.billpoint = lastBillCondition ? lastBillCondition.detail : ''



    }
  },
  async getByContract(id) {
    return models.oaContract.get(id)
  },
  async list(conditions = {}, order = 'asc') {
    return await mysql(this.$table).select('contract.id', 'code', 'contract.name as name', `${this.$table}.*`).leftJoin(this.$tableContract, 'contract_id', 'contract.id')
      .where(conditions).orderBy('contract_bill.id', order)
  },
  async insert(bill) {
    if (!this.verify(bill))
      return
    await mysql(this.$table).insert(bill)
  },
  async deleteIdIn(dellist) {
    await mysql(this.table).whereIn(dellist).del()
  },
  async delByContract(id) {
    return mysql(this.$table).where('contract_id', id).del()
  },
  async getContractId(bill) {
    if (bill.condition_id) {
      let res = await models.oaPayCondition.get(bill.condition_id)
      if (res) {
        return res.contract_id
      }
    }
  }
}

/** oaAnalysis
 *  dependencies: oaContract
 */
const OA_CountItem = (items, target, getKey, countKey, isInited, initKey) => {
  if (Array.isArray(items)) {
    items.forEach(v => {
      v._key = getKey(v)
      if (!v._key)
        return

      let data = target[v._key]
      if (!data) {
        data = target[v._key] = initKey(v)
      } else {
        if (isInited(data))
          countKey(data, v)
        else
          data = Object.assign(data, initKey(v))
      }
      data._key = v._key
    })
  }

}

const OA_SumItem = (target, items, initKey, addKey) => {
  target.sum = initKey(target)
  if (Array.isArray(items)) {
    items.forEach(v => {
      addKey(target.sum, v)
    })
  }
}

const OA_AccurateItem = (target, items, initKey, addKey) => {
  let total = {}
  total = initKey(total)
  if (Array.isArray(items)) {
    items.forEach(v => {
      addKey(total, v)
      v.accurated = Object.assign({}, total)
      v.accurated.key = v.key
    })
  }
}

const OA_GetSeasons = (t) => {
  if (!t)
    return
  let seasons = {

  }
  for (let i = 0; i < 4; i++) {
    seasons[i + 1] = {
      key: i + 1
    }
  }

  const getkey = item => item.registerDate ? (moment(item.registerDate).quarter()) : null
  const getkey_bill = item => item.billingDate ? (moment(item.registerDate).quarter()) : null
  const getkey_tran = item => item.transferredDate ? (moment(item.registerDate).quarter()) : null

  if (t.contracts) {
    OA_CountItem(t.contracts, seasons,
      // get key
      getkey,
      // count key
      (data, item) => {
        data.counts++
        if (item.amount)
          data.amount += item.amount
      },
      //data is inited
      data => data._hasContract,
      // init key
      item => ({
        counts: 1,
        _hasContract: true,
        amount: item.amount
      })
    )
  }

  if (t.bills) {
    OA_CountItem(t.bills, seasons,
      // get key
      getkey_bill,
      // count key
      (data, item) => {
        if (!data.billCounts)
          data.billCounts = 1
        else
          data.billCounts++

        if (item.amount)
          data.billed += item.amount
      },
      // is inited
      item => item._hasBill,
      // init key
      item => ({
        _hasBill: true,
        billCounts: 1,
        billed: item.amount,
      })
    )
  }

  if (t.trans) {
    OA_CountItem(t.trans, seasons,
      //get key
      getkey_tran,
      //count key
      (data, item) => {
        if (!data.transferredCounts)
          data.transferredCounts = 1
        else
          data.transferredCounts++

        if (item.amount)
          data.transferred += item.amount
      },
      // is inited
      item => item._hasTrans,
      // init key
      item => ({
        _hasTrans: true,
        transferredCounts: 1,
        transferred: item.amount
      })
    )
  }


  t.seasons = []
  for (let s in seasons) {
    t.seasons.push(seasons[s])
  }
}

const OA_GetHarfs = (t) => {
  if (!t)
    return
  let harfs = {}
  for (let i = 0; i < 2; i++) {
    harfs[i + 1] = {
      key: i == 1 ? '上半年' : '下半年'
    }
  }

  const getkey = item => item.registerDate ? (moment(item.registerDate).month() > 5 ? 2 : 1) : null
  const getkey_bill = item => item.billingDate ? (moment(item.billingDate).month() > 5 ? 2 : 1) : null
  const getkey_tran = item => item.transferredDate ? (moment(item.transferredDate).month() > 5 ? 2 : 1) : null

  if (t.contracts) {
    OA_CountItem(t.contracts, harfs,
      // get key
      getkey,
      // count key
      (data, item) => {
        data.counts++
        if (item.amount)
          data.amount += item.amount
      },
      //data is inited
      data => data._hasContract,
      // init key
      item => ({
        counts: 1,
        _hasContract: true,
        amount: item.amount
      })
    )
  }

  if (t.bills) {
    OA_CountItem(t.bills, harfs,
      // get key
      getkey_bill,
      // count key
      (data, item) => {
        if (!data.billCounts)
          data.billCounts = 1
        else
          data.billCounts++

        if (item.amount)
          data.billed += item.amount
      },
      // is inited
      item => item._hasBill,
      // init key
      item => ({
        _hasBill: true,
        billCounts: 1,
        billed: item.amount,
      })
    )
  }

  if (t.trans) {
    OA_CountItem(t.trans, harfs,
      //get key
      getkey_tran,
      //count key
      (data, item) => {
        if (!data.transferredCounts)
          data.transferredCounts = 1
        else
          data.transferredCounts++

        if (item.amount)
          data.transferred += item.amount
      },
      // is inited
      item => item._hasTrans,
      // init key
      item => ({
        _hasTrans: true,
        transferredCounts: 1,
        transferred: item.amount
      })
    )
  }


  t.harfs = []
  for (let m in harfs) {
    t.harfs.push(harfs[m])
  }
}


const OA_Clear = t => {
  if (t) {
    delete t.bills
    delete t.contracts
    delete t.trans
  }
}

const OA_GetCategorys = (t, types) => {
  if (!t || !types)
    return
  let mapobj = {}
  let con2type = {}

  if (t.contracts) {
    t.contracts.forEach(v => {
      con2type[v.id] = v.type_id
    })
    OA_CountItem(t.contracts, mapobj,
      // get key
      item => item.type_id || null,
      // count key
      (data, item) => {
        data.counts++
        if (item.amount)
          data.amount += item.amount
      },
      //data is inited
      data => data._hasContract,
      // init key
      item => ({
        counts: 1,
        _hasContract: true,
        amount: item.amount
      })
    )
  }

  if (t.bills) {
    OA_CountItem(t.bills, mapobj,
      // get key
      item => item.contract_id ? con2type[item.contract_id] : null,
      // count key
      (data, item) => {
        if (!data.billCounts)
          data.billCounts = 1
        else
          data.billCounts++

        if (item.amount)
          data.billed += item.amount
      },
      // is inited
      item => item._hasBill,
      // init key
      item => ({
        _hasBill: true,
        billCounts: 1,
        billed: item.amount,
      })
    )
  }

  if (t.trans) {
    OA_CountItem(t.trans, mapobj,
      //get key
      item => item.contract_id ? con2type[item.contract_id] : null,
      //count key
      (data, item) => {
        if (!data.transferredCounts)
          data.transferredCounts = 1
        else
          data.transferredCounts++

        if (item.amount)
          data.transferred += item.amount
      },
      // is inited
      item => item._hasTrans,
      // init key
      item => ({
        _hasTrans: true,
        transferredCounts: 1,
        transferred: item.amount
      })
    )
  }

  t.cats = []
  let typeMap = {}
  types.forEach(v => {
    typeMap[v.id] = v.name
  })
  for (let m in mapobj) {
    mapobj[m].key = typeMap[mapobj[m]._key]
    t.cats.push(mapobj[m])
  }

}

const OA_GetMonths = (t) => {
  if (!t)
    return
  let months = {}
  for (let i = 0; i < 12; i++) {
    months[i + 1] = {
      key: (i + 1) + '月'
    }
  }


  if (t.contracts) {
    OA_CountItem(t.contracts, months,
      // get key
      item => item.registerDate ? (moment(item.registerDate).month() + 1) : null,
      // count key
      (data, item) => {
        data.counts++
        if (item.amount)
          data.amount += item.amount
      },
      //data is inited
      data => data._hasContract,
      // init key
      item => ({
        counts: 1,
        _hasContract: true,
        amount: item.amount
      })
    )
  }

  if (t.bills) {
    OA_CountItem(t.bills, months,
      // get key
      item => item.billingDate ? (moment(item.billingDate).month() + 1) : null,
      // count key
      (data, item) => {
        if (!data.billCounts)
          data.billCounts = 1
        else
          data.billCounts++

        if (item.amount)
          data.billed += item.amount
      },
      // is inited
      item => item._hasBill,
      // init key
      item => ({
        _hasBill: true,
        billCounts: 1,
        billed: item.amount,
      })
    )
  }

  if (t.trans) {
    OA_CountItem(t.trans, months,
      //get key
      item => item.transferredDate ? moment(item.transferredDate).year() : null,
      //count key
      (data, item) => {
        if (!data.transferredCounts)
          data.transferredCounts = 1
        else
          data.transferredCounts++

        if (item.amount)
          data.transferred += item.amount
      },
      // is inited
      item => item._hasTrans,
      // init key
      item => ({
        _hasTrans: true,
        transferredCounts: 1,
        transferred: item.amount
      })
    )
  }

  t.months = []
  for (let m in months) {
    t.months.push(months[m])
  }
}

const OA_GetYears = (t, types) => {
  let years = {}
  OA_CountItem(t.contracts, years,
    // get key
    item => item.registerDate ? moment(item.registerDate).year() : null,
    // count key
    (data, item) => {
      data.counts++
      data.contracts.push(item)
      if (item.amount)
        data.amount += item.amount
    },
    //data is inited
    data => data._hasContract,
    // init key
    item => ({
      counts: 1,
      _hasContract: true,
      amount: item.amount,
      contracts: []
    })
  )



  OA_CountItem(t.bills, years,
    // get key
    item => item.billingDate ? moment(item.billingDate).year() : null,
    // count key
    (data, item) => {
      if (!data.billCounts)
        data.billCounts = 1
      else
        data.billCounts++
      data.bills.push(item)

      if (item.amount)
        data.billed += item.amount
    },
    // is inited
    item => item._hasBill,
    // init key
    item => ({
      _hasBill: true,
      billCounts: 1,
      billed: item.amount,
      bills: []
    })
  )



  OA_CountItem(t.trans, years,
    //get key
    item => item.transferredDate ? moment(item.transferredDate).year() : null,
    //count key
    (data, item) => {
      data.trans.push(item)
      if (!data.transferredCounts)
        data.transferredCounts = 1
      else
        data.transferredCounts++

      if (item.amount)
        data.transferred += item.amount
    },
    // is inited
    item => item._hasTrans,
    // init key
    item => ({
      trans: [],
      _hasTrans: true,
      transferredCounts: 1,
      transferred: item.amount
    })
  )

  let yearArray = []
  for (y in years) {
    OA_GetMonths(years[y])
    OA_GetSeasons(years[y])
    OA_GetHarfs(years[y])
    OA_GetCategorys(years[y], types)
    OA_Clear(years[y])
    years[y].key = y + '年'
    yearArray.push(years[y])
  }

  t.years = yearArray
}

const OA_Sum = (target) => {
  const initAmount = t => {
    if (t) {
      return {
        amount: 0,
        billed: 0,
        transferred: 0,
        counts: 0,
        billCounts: 0,
        transferredCounts: 0
      }

    }
  }

  const summaryAmount = (t, item) => {
    if (t) {
      if (item.amount)
        t.amount += item.amount
      if (item.counts)
        t.counts += item.counts
      if (item.billed)
        t.billed += item.billed
      if (item.billCounts)
        t.billCounts += item.billCounts
      if (item.transferredCounts)
        t.transferredCounts += item.transferredCounts
      if (item.transferred)
        t.transferred += item.transferred
    }
  }

  OA_SumItem(target, target.years, initAmount, summaryAmount)

  OA_AccurateItem(target, target.years, initAmount, summaryAmount)
}

models.oaAnalysis = {
  async query(q) {
    switch (q) {
      case 'total-years':
        return this.getTotalYears()
      case 'total-cats':
        return this.getTotalCats()
      case 'total':
        return this.getTotal()
    }
  },
  async getTotalCats() {

    let cats = {}
    let contracts = await models.oaContract.list({
      sub: true
    })

    debug(contracts.length)
    let types = await models.oaType.list()
    //let deps = await models.oaDepartment.list()
    let Contract2Type = {}

    contracts.forEach(v => {
      Contract2Type[v.id] = v.type_id
      if (cats[v.type_id]) {
        cats[v.type_id].counts++
        cats[v.type_id].amount += v.amount

      } else {
        let type = types.find(t => t.id == v.type_id)
        if (!type) return
        cats[v.type_id] = {
          key: type.name,
          counts: 1,
          billCounts: 0,
          transCounts: 0,
          amount: v.amount,
          billed: 0,
          transferred: 0
        }
      }
    })

    let bills = await models.oaBill.list()
    bills.forEach(v => {
      let type_id = Contract2Type[v.contract_id]
      if (!type_id)
        return
      if (cats[v.type_id]) {
        cats[v.type_id].billed += v.amount
        cats[v.type_id].billCounts++
      } else {
        let type = types.find(t => t.id == type_id)
        cats[v.type_id] = {
          key: type.name,
          counts: 0,
          transCounts: 0,
          billCounts: 1,
          amount: 0,
          billed: v.amount,
          transferred: 0
        }
      }
    })

    let trans = await models.oaTrans.list()
    trans.forEach(v => {
      let type_id = Contract2Type[v.contract_id]
      if (!type_id)
        return
      if (cats[v.type_id]) {
        cats[v.type_id].transferred += v.amount
        cats[v.type_id].transCounts++
      } else {
        let type = types.find(t => t.id == type_id)
        cats[v.type_id] = {
          key: type.name,
          counts: 0,
          transCounts: 1,
          billCounts: 0,
          amount: 0,
          billed: v.amount,
          transferred: 0
        }
      }
    })

    let items = []
    for (let c in cats) {
      items.push(cats[c])
    }

    return items
  },
  async getTotal() {
    let total = {}
    // get Data
    let contracts = await models.oaContract.list({
      sub: true
    })
    contracts = contracts.filter(v => v.registerDate)
    contracts.sort((a, b) => moment(a.registerDate).isAfter(b.registerDate) ? 1 : -1)
    total.contracts = contracts

    let bills = await models.oaBill.list()
    bills = bills.sort((a, b) => moment(a.billingDate).isAfter(b.billingDate) ? 1 : -1).filter(v => v.billingDate)
    total.bills = bills

    let trans = await models.oaTrans.list()
    trans = trans.sort((a, b) => moment(a.transferredDate).isAfter(b.transferredDate) ? 1 : -1).filter(v => v.transferredDate)
    total.bills = bills

    let types = await models.oaType.list()

    OA_GetCategorys(total, types)
    OA_GetYears(total, types)
    OA_Sum(total)
    OA_Clear(total)


    return total
  },

  async getTotalYears() {
    let contracts = await models.oaContract.list({
      mother: true
    })
    let years = {}
    let accurated = {
      counts: 0,
      amount: 0,
      billed: 0,
      transferred: 0
    }

    contracts = contracts.filter(v => v.registerDate)
    contracts.sort((a, b) => moment(a.registerDate).isAfter(b.registerDate) ? 1 : -1)

    contracts.forEach((v, i, a) => {
      let year = v.year = moment(v.registerDate).year()

      let yearData = years[year]

      // setup last year accurated
      if (i != 0 && a[i - 1].year != year) {
        years[a[i - 1].year].accurated = Object.assign({}, accurated)
      }

      // accurated
      accurated.counts++
      accurated.amount += v.amount

      // map to years
      if (yearData) {
        yearData.counts++
        yearData.amount += v.amount
      } else {
        yearData = years[year] = {
          year,
          counts: 1,
          amount: v.amount,
          billed: 0,
          transferred: 0
        }
      }

      // situation : last one is new year 
      if (i != 0 && i == a.length - 1) {
        if (yearData.accurated) {
          throw ('it cant get here')
        } else {
          yearData.accurated = Object.assign({}, accurated)
        }

      }

    })


    let bills = await models.oaBill.list()
    bills = bills.sort((a, b) => moment(a.billingDate).isAfter(b.billingDate) ? 1 : -1).filter(v => v.billingDate)

    bills.forEach((v, i, a) => {
      let year = moment(v.billingDate).year()

      v.year = year
      // setup last year billed
      if (i != 0 && a[i - 1].year != year) {
        debug(a[i - 1].year, accurated.billed)
        if (years[a[i - 1].year].accurated)
          years[a[i - 1].year].accurated.billed = accurated.billed
        else {
          years[a[i - 1].year].accurated = {
            billed: accurated.billed
          }
        }
      }

      // accurating
      accurated.billed += v.amount

      // map to year
      let yearData = years[year]

      if (yearData) {
        yearData.billed += v.amount
      } else {
        yearData = years[year] = {
          year,
          counts: 0,
          amount: 0,
          billed: v.amount
        }
      }


      // situation : last one is new year 
      if (i != 0 && i == a.length - 1) {
        debug(year, accurated.billed)
        if (!yearData.accurated) {
          let lastyear = year - 1
          while (!years[lastyear] && year > 2000) {
            lastyear = lastyear - 1
          }
          yearData.accurated = Object.assign({}, years[lastyear].accurated)
        }
        yearData.accurated.billed = accurated.billed

      }

    })


    let trans = await models.oaTrans.list()
    trans = trans.sort((a, b) => moment(a.transferredDate).isAfter(b.transferredDate) ? 1 : -1).filter(v => v.transferredDate)

    trans.forEach((v, i, a) => {
      let year = moment(v.transferredDate).year()
      let yearData = years[year]
      v.year = year

      // setup last year billed
      if (i != 0 && a[i - 1].year != year) {
        if (years[a[i - 1].year].accurated)
          years[a[i - 1].year].accurated.transferred = accurated.transferred
        else {
          years[a[i - 1].year].accurated = {
            transferred: accurated.transferred
          }
        }
      }

      // accurating
      accurated.transferred += v.amount

      // map to year
      if (yearData) {
        yearData.transferred += v.amount
      } else {
        yearData = years[year] = {
          year,
          counts: 0,
          amount: 0,
          billed: 0,
          transferred: v.amount
        }
      }


      // situation : last one is new year 
      if (i != 0 && i == a.length - 1) {
        if (!yearData.accurated) {
          let lastyear = year - 1
          while (!years[lastyear] && year > 2000) {
            lastyear = lastyear - 1
          }
          yearData.accurated = Object.assign({}, years[lastyear].accurated)
        }

        yearData.accurated.transferred = accurated.transferred

      }

    })

    let items = []
    let accuratedItems = []
    for (let y in years) {
      years[y].accurated.year = y
      accuratedItems.push(years[y].accurated)
      delete years[y].accurated
      items.push(years[y])
    }





    return {
      accurated: accuratedItems,
      years: items
    }
  }
}


models.oaEmployee = {
  t: 'gzadmin.employee',
  rel: 'gzadmin.rel_contract_employee',
  async insert(data) {
    await mysql(this.t).insert(data)
  },
  async existByName(name) {
    await mysql(this.t).first('id').where('name', name)
  },
  async addContractEmployee(relationItem) {
    await mysql(this.rel).insert(relationItem)
  },
  async allNames() {
    let query = mysql(this.t).distinct('name')
    let res = await query
    return res.map(v => v.name)
  },
  async patch(id, data) {
    await mysql(this.t).update(data).where({
      id
    })
  },
  async delete(id) {
    await mysql(this.t).where({
      id
    }).del()
  },
  async DeleteFromContract(id) {
    await mysql(this.rel).where({
      employee_id: id
    }).del()
  },
  async AddRecord(data) {
    let res = await mysql(this.rel).returning('r_id').insert(data)
    return res[0]
  },
  async PatchRecord(id, params) {
    await mysql(this.rel).where({
      r_id: id
    }).update(params)
  },
  async DeleteRecord(id) {
    await mysql(this.rel).where({
      r_id: id
    }).del()
  }
}

models.oaUser = {
  t: 'gzadmin.user',

  async list() {
    let query = mysql(this.t).orderBy('account')
    return await query
  },

  async insert(data) {
    await mysql(this.t).insert(data)
  },
  async existByName(name) {
    await mysql(this.t).first('id').where('name', name)
  },

  async patch(id, data) {
    await mysql(this.t).update(data).where({
      id
    })
  },
  async login(account, pass) {
    let query = mysql(this.t).first('id').where({
      account,
      pass
    })

    return await query
  }

}

///////////////////////////////////////////////////////////////

models.Company = {
  table: 'gzadmin.company',
  async insert(data, user) {
    data.id = await models.util.createId('COM')
    data.inputor = user
    data.inputTime = models.util.getTimeStamp()
    await mysql(this.table).insert(data)
    return data.id
  }
}







///////////////////////////////////////////////////////////////
const request = require('request')
const WXBizDataCrypt = require('../libs/WXBizDataCrypt')
models.weappGZCloud = {
  async loginWithTicket(data) {
    var code = data.code
    var appId = 'wxb15659120aab0938'
    var appSecret = 'f3d1f4f197d749a2dbf4678d8207e345'
    // 1 - 通过客户端的js_code获取微信open_id及session_key
    var appurl = 'https://api.weixin.qq.com/sns/jscode2session?appid=' + appId + '&secret=' + appSecret +
      '&js_code=' + code + '&grant_type=authortization_code'
    var requestAction = function (url) {
      return new Promise(function (resolve, reject) {
        request({
          url: url
        }, function (error, response, body) {
          if (error) return reject(error)
          resolve(body)
        })
      })
    }

    var response = JSON.parse(await requestAction(appurl));
    var user_openid = response.openid;
    var user_skey = response.session_key;
    let pc = new WXBizDataCrypt(appId, user_skey)
    let gidData = pc.decryptData(data.encryptedData, data.iv)


    let user = await this.getUser(user_openid)
    if (user) {
      if (data.userinfo) {
        user = data.userinfo
        user.skey = user_skey
        user.lastlogin = models.util.getTimeStamp()

        await this.updateUser(user_openid, user)
      }

    } else {
      user = data.userinfo || {}
      user.open_id = user_openid
      user.skey = user_skey
      user.regtime = models.util.getTimeStamp()
      await this.createUser(user)
    }


    if (data.sheet_id) {

      try {

        await mysql('weapp_contact_relation').insert({
          data_id: data.sheet_id,
          open_gid: gidData.openGId,
          data_type: 'sheet'
        })
      } catch (e) {}

    }

    if (gidData && gidData.openGId) {
      try {
        await mysql('weapp_contact_relation').insert({
          data_id: user_openid,
          open_gid: gidData.openGId,
          data_type: 'user'

        })
        let res = await mysql('weapp_contact_sheet').first('opengid').where('id', data.sheet_id)
        if (res) {
          res.opengid = res.opengid ? gidData.openGId : res.opengid + ',' + gidData.openGId
        }
        await mysql('weapp_contact_sheet').update({
          opengid: res.opengid
        }).where('id', data.sheet_id)

      } catch (e) {}
    }
    return user
  },
  async login(data) {
    var code = data.code
    var appId = 'wxb15659120aab0938'
    var appSecret = 'f3d1f4f197d749a2dbf4678d8207e345'
    // 1 - 通过客户端的js_code获取微信open_id及session_key
    var appurl = 'https://api.weixin.qq.com/sns/jscode2session?appid=' + appId + '&secret=' + appSecret +
      '&js_code=' + code + '&grant_type=authortization_code'
    var requestAction = function (url) {
      return new Promise(function (resolve, reject) {
        request({
          url: url
        }, function (error, response, body) {
          if (error) return reject(error)
          resolve(body)
        })
      })
    }

    var response = JSON.parse(await requestAction(appurl));
    var user_openid = response.openid;
    var user_skey = response.session_key;
    let user = await this.getUser(user_openid)
    if (user) {
      if (data.userinfo) {
        user = data.userinfo
        user.skey = user_skey
        user.lastlogin = models.util.getTimeStamp()
        user.open_id = user_openid
        await this.updateUser(user_openid, user)
      }
      return user
    } else {
      user = data.userinfo || {}
      user.open_id = user_openid
      user.skey = user_skey
      user.regtime = models.util.getTimeStamp()
      await this.createUser(user)

      if (data.opengid && data.sheetId)
        await mysql('weapp_contact_relation').insert({
          user_id: user.open_id,
          open_gid: data.open_gid,
          sheet_id: data.sheet_id
        })
      return user
    }
  },
  async getUser(open_id) {
    return mysql('weapp_gzcloud_user').first().where({
      open_id
    })
  },
  async createUser(user) {
    await mysql('weapp_gzcloud_user').insert(user)
  },
  async updateUser(id, user) {
    await mysql('weapp_gzcloud_user').update(user).where('open_id', id)
  }
}

module.exports = models