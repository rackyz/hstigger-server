const Config = {
    client: 'mysql',
    connection: {
      host: 'zzlatm.gicp.net',
      port: 33060,
      user: 'nbgz',
      password: 'nbgz123',
      database: 'gzcloud_orm'
    }, 
    acquireConnectionTimeout:30000,
    pool: { min: 0, max: 100 },
    debug:false,
}
const MYSQL = require('knex')(Config)

module.exports = MYSQL