const fs = require('fs')
const path = require('path')
const dir = path.join(__dirname + '/../../backup')
const debug = require('debug')('[BACKUPS]')
let out = {}
out.List = async ctx => {
  let logs = fs.readdirSync(dir)

  return logs
}



module.exports = out