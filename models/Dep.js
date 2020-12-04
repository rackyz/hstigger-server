const MYSQL = require('../base/mysql')
const UTIL = require('../base/util')
const EXCEPTION = require('../base/exception')
const Enterprise = require('./Enterprise')
const Type = require("./Type")
const Permission = require('./Permission')
const moment = require('moment')
const Ding = require('./Ding')
const config = require('../base/config')
const {
  UserLogger
} = require('../base/logger')
const REDIS = require('../base/redis')
const {
  ContextParser
} = require('../base/util')

let o = {
  required: ['Type']
}


const T = 'dep'
o.enterprise = true

o.initdb = async (ent_schema,forced)=>{

  await MYSQL.initdb(T, t => {
    t.uuid('id').index()
    t.string('name', 255).notNull()
    t.uuid('parent_id')
    t.string('color',16).defaultTo('#333')
    t.string('extra',32)
    t.string('extra2',32)
  }, forced, ent_schema)
  if(forced){
    if (ent_schema == "ENT_27d8c0f0-3504-11eb-a58f-19892a782200") {
      let groups = await Ding.getGroups()
      console.log(groups)
    }
  }

 

}

module.exports = o