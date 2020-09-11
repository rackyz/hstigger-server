const {
  mysql:Q,
  bookshelf:B
} = require('./util')

const Debug = require('debug')('[MODELS]')
const E = require('./exception')
const U = require('./util')
const models = {}


models.Q = Q
models.B = B
models.U = U
models.E = E
models.D = Debug

models.Session = B.model('Session', {
  tableName: 'session',
  user() {
    return belongTo('User', 'id')
  }
})

// **** Model -- USER **** /
function HandleUserException(e,ctx){
  Debug(ctx)
   if (e.code == "ER_DUP_ENTRY") {
     if (e.message.includes('user_unique')) {
       if (ctx && ctx.userlog && ctx.applog)
         ctx.userlog.warn(ctx.state.name + ' ' + E.E_USER_USER_EXIST.error)
       throw E.E_USER_USER_EXIST
     } else {
       if (ctx && ctx.userlog && ctx.applog)
        ctx.userlog.warn(ctx.state.name + ' ' + E.E_USER_PHONE_EXIST.error)
       throw E.E_USER_PHONE_EXIST
     }
   } else {
     ctx.applog.warn(e)
     throw (e)
   }
}


const PATCHABLE_COLUMNS = ['user', 'avatar', 'phone', 'name', 'deps', 'roles', 'password','state']
models.User = B.model('User', {
  tableName: 'user',
  uuid: true,
  hidden: ['password'],
  sessions: function () {
    return this.hasMany('Session')
  },
  deps: function () {
    return this.belongsToMany("Dep")
  },
  roles: function () {
    return this.belongsToMany("Role")
  }
}, {
 
  async List(ctx) {
    let query = Q('user')
                  .select(
                    'user.*',
                    Q.raw("group_concat(cast(dep_user.dep_id as CHAR) separator ',') as deps"),
                    Q.raw("group_concat(cast(role_user.role_id as CHAR) separator ',') as roles")
                  ).leftOuterJoin(
                    'dep_user',
                    'dep_user.user_id',
                    'user.id'
                  ).leftOuterJoin(
                    'role_user',
                    'role_user.user_id',
                    'user.id'
                  ).groupBy('user.id').orderBy('created_at','desc')

    let users = await query
    users.forEach(v => {
      if (v.deps)
        v.deps = v.deps.split(',').map(t => parseInt(t))
      else
        v.deps = []

      if (v.roles)
        v.roles = v.roles.split(',').map(t => parseInt(t))
      else
        v.roles = []

      if(v.password == '123456')
        v.passweak = 1
      delete v.password
    })
    return users
  },

  async Patch_ResetPassword(ctx){
    let id = ctx.params.id
    await Q('user').update('password','123456').where({id})
    throw "密码重置成功"
  },

  async PostAction(ctx){
    let action = ctx.params.action
    let data = ctx.request.body
    let res = "ok"
    if (action === 'delete') {
      let ids = data
      await Q.transaction(t => {
        Q('user').transacting(t).whereIn('id', ids).del().then(() => {
          Q('dep_user').transacting(t).whereIn('user_id', ids).del().then(() => {
            Q('role_user').transacting(t).whereIn('user_id', ids).del().then(t.commit).
            catch(t.rollback)
          }).catch(t.rollback)
        }).catch(t.rollback)
      })
    } else if (action === 'lock') {
      Debug('锁定w账户:' + JSON.stringify(data))
      await Q('user').whereIn('id', data).update({
        state: 1
      })
    } else if (action === 'unlock') {
      Debug('解锁账户:' + JSON.stringify(data))
      await Q('user').whereIn('id', data).update({
        state: 0
      })
    } else if (action === 'reset-pass') {
      Debug('重置密码:'+JSON.stringify(data))
      await Q('user').whereIn('id', data).update({
        password: "123456"
      })
    }
    return res
  },

  async Patch(ctx){
    let data = ctx.request.body
    let id = ctx.params.id

    data = U.filterByProps(data, PATCHABLE_COLUMNS)
    let deps = U.extractProp(data, 'deps')
    let roles = U.extractProp(data, 'roles')

    await B.transaction(t => {
      let promises = []
      if (deps) {
        let params = deps.map(v => ({
          user_id: id,
          dep_id: v
        }))
         promises.push(Q('dep_user').transacting(t).where({user_id:id}).del())
        promises.push(Q('dep_user').transacting(t).insert(params))
      }

      if (roles) {
        let params = roles.map(v => ({
          user_id: id,
          role_id: v
        }))
          promises.push(Q('role_user').transacting(t).where({
            user_id: id
          }).del())
        promises.push(Q('role_user').transacting(t).insert(params))
      }

       
      if(Object.keys(data).length > 0)
        promises.push(Q('user').transacting(t).update(data).where({id}))


        if (promises.length > 0) {
          return Promise.all(promises).then(() => t.commit())
        }else{
          throw E.E_INVALID_DATA
        }
    }).catch(e=>HandleUserException(e,ctx))

  },
  async Post(ctx) {
    let data = ctx.request.body

    data = U.filterByProps(data,PATCHABLE_COLUMNS)
    data.password = '123456'
    let deps = U.extractProp(data,'deps')
    let roles = U.extractProp(data,'roles')

    data.created_at = U.getTimeStamp()
    data.created_by = ctx.state.id

    let model = await B.transaction(t=>{
      return this.forge().save(data,{transacting:t}).then(model=>{
        let promises = []
        if (deps) {
          let params = deps.map(v => ({
            user_id: model.id,
            dep_id: v
          }))
          promises.push(Q('dep_user').transacting(t).insert(params))
        }

        if(roles){
          let params = roles.map(v => ({
            user_id: model.id,
            role_id: v
          }))
          promises.push(Q('role_user').transacting(t).insert(params))
        }

        if(promises.length > 0){
          return Promise.all(promises).then(()=>t.commit(model))
        }else{
          return t.commit(model)
        }
      }).catch(t.rollback)
    }).catch(e=>HandleUserException(e,ctx))
     
     
    return model.toJSON({visible:['id','created_by','created_at']})
  }
})

models.Dep = B.model('Dep', {
  tableName: "dep",
  users() {
    return this.hasMany("User")
  }
},{
  async AddRelated(ctx){
       let id = ctx.params.id
       let related = ctx.params.related
       let data = ctx.request.body
       if(!data) throw('未上传数据')

       if(related == 'users'){
        let items = data.map(v => ({
              dep_id: id,
              user_id:v
            }))
        
        await Q('dep_user').where('dep_id',id).del()
        await Q('dep_user').insert(items)
      }
  },
  async DelRelated(ctx){
    let id = ctx.params
    let related = ctx.params.related
    let relatedId = ctx.params.relatedId
    await Q('dep_user').where({user_id:relatedId,dep_id:id}).del()
  }
})

models.Role = B.model('Role', {
  tableName: "role",
  users() {
    return this.belongsToMany("User")
  }
})


models.Type = B.model('Type',{
  tableName:'type'
},{
  List: async function (ctx) {
    let items = await Q('type')
   
    return items
  },
  Post: async function(ctx){
    let data = ctx.request.body
    let model = await this.forge(data).save()
    return {id:model.get('id')}
  },
  Get: async function (ctx) {
    let id = ctx.params.id
    let item = await this.forge({id}).fetch()
    return item
  },
  Delete: async function (ctx) {
    let id = ctx.params.id
    let ids = id.split(',')
    
    // check valid

    await Q('type').whereIn('id',ids).del()
  },
  Patch: async function (ctx) {
    let id = ctx.params.id
    let data = ctx.request.body
    await this.forge({id}).save(data)
  }

})


module.exports = models