const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const o = {}

const TABLE_TYPE = 'type'
const TABLE_SETTING = 'setting'

o.initdb = async (forced)=>{
  

  MYSQL.initdb(TABLE_SETTING,t=>{
    t.string("name",32).index()
    t.string("value",64)
    t.string("type",)
  })
}



module.exports = o