const Config = {
    client: 'mysql',
    connection: {
      host: '192.168.14.3',
      port: 3306,
      user: 'nbgz',
      password: 'nbgz123',
      database: 'gzcloud_orm'
    }, 
    acquireConnectionTimeout:30000,
    pool: { min: 0, max: 100 },
    debug:false,
}
const MYSQL = require('knex')(Config)

module.export = MYSQL