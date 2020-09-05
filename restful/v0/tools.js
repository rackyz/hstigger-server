const cp = require('child_process')
const iconv = require('iconv-lite')
let out = {}
const config = require('../../config')
const mysqldump =require('mysqldump')
let sql = config.mysql
let debug = require('debug')("[TOOLS]")
const moment = require('moment')

out.Get = async ctx=>{
  let id = ctx.params.id
  if (id == 'mysqldump') {
    // return await new Promise((resolve,reject)=>{
    //    cp.exec(`mysqldump -h ${sql.connection.host} -P ${sql.connection.port} -d ${sql.connection.database} -u ${sql.connection.user} -p ${sql.connection.password} > ./backup/backup.sql`, {
    //      encoding: 'buffer'
    //    }, (error, stdout, stderr) => {
    //      if (error) reject(error)
    //      resolve(stdout)
    //    })
    // })
    let timestamp = moment().format('YYYYMMDDHHmmss')
    let file = `./backup/dump${timestamp}.sql`
    mysqldump({
      connection:config.mysql.connection,
      dumpToFile: file
    })

    ctx.userlog.info(`${ctx.state.name} 创建了日志 ${file}`)

    return `dump${timestamp}.sql`
  }
}


module.exports = out