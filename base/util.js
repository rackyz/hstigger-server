const utils = {}

// Module:ContextParser
// Description:
//  parsing request context
let ContextParser = {}

ContextParser.getIP = function (ctx) {
  let req = ctx.req
  let ip = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
  if (typeof ip == 'string' && ip.includes('ffff'))
    ip = ip.slice(7)
  return ip
}

ContextParser.getDevice = function (ctx) {
  return ctx.request.header['user-agent']
}

ContextParser.extractProp = (object, prop) => {
  let p = object[prop]
  delete object[prop]
  return p
}

ContextParser.filterByProps = (object, props = []) => {
  let r = {}
  props.forEach(v => {
    if (object[v] != undefined)
      r[v] = object[v]
  })
  return r
}

utils.ContextParser = ContextParser


// Module:Generator
// Description:
//  generate specific or random value for given type
let Generator = {}
Generator.createUUID = () => {
  return uuid.v1()
}

Generator.getTimeStamp = () => moment().format('YYYY-MM-DD HH:mm:ss')
Generator.getDateStamp = () => moment().format('YYYY-MM-DD')
Generator.dateAddDays = (d, offset) => moment(d).add('days', offset).format('YYYY-MM-DD')



Generator.generateVerifyCode = () => {
  let result = ""
  for (let i = 0; i < 6; i++)
    result += (parseInt(9 * Math.random()) + 1)
  return result
}

const PHONE_REGX = /^((0\d{2,3}-\d{7,8})|(1[3584]\d{9}))$/;
Generator.test = (type, value) => {
  let result = false
  if (type == 'phone') {
    result = PHONE_REGX.test(value)
  }

  return result
}

Generator.MD5 = (text) => {
  return crypto.createHash("md5").update(text).digest('hex')
}

Generator.maskPhone = phone => phone && phone.length == 11 ? (phone.slice(0, 3) + "****" + phone.slice(-4)) : '电话不合法'
utils.Generator = Generator



utils.updateCacheTime = async (key) => {
  // await mysql('cache').update({
  //     id: key,
  //     update: moment().toString()
  // })
}
utils.checkCached = async (key, updateTime) => {
  // let cacheRecord = await mysql('cache').first('update').where('id', key)
  // if (cacheRecord && cacheRecord.update) {
  //     if (moment(updateTime).isAfter(cacheRecord.update) == false) {
  //         return true
  //     }
  // }

  return false
}





/**
 * DESC    : Create a basic common proxy interface with validators
 * METHODS : POST/PATCH/DELETE/GET(list,item)
 * NOTE    : You can inherit from this basic class with .extend methods
 * @param {*} knex 
 * @param {*} proxy 
 * @param {*} config
 *   config.prefix    (default=proxy)
 *      prefix of id (used by util.createId)
 *   config.list
 *   config.get
 *      each method configuration
 *   {
 *      .columns
 *      .formatter(dataItem)=>dataItemFormatted
 *      .extend(ctx, query) => queryExtended *
          you can use this function to extend get query by ctx
 *   }
 *   config.post
 *   config.patch
 *   {
 *      validator(dataItem) => dataItemValidated throw (Invalid Data)
 *   }
 */
utils.CreateRestfulController = (knex, proxy, config) => {
  const List = async (ctx) => {
    // if (ctx.params.cachedtime && utils.checkCached(ctx.params.cacheTime)){
    //     return "cached"
    // }

    let query = knex(proxy)
    if (config && config.list && config.list.extend) {
      query = config.list.extend(ctx, query)
    }
    let res = await query
    if (config && config.list && config.list.formatter)
      res = config.list.formatter(res)
    return res
  }

  const Post = async (ctx) => {
    let dataItem = ctx.request.body
    let now = moment().format()
    if (config && config.post && config.post.validator)
      dataItem = config.post.validator(dataItem)

    if (config.autosign) {
      dataItem.inputor = ctx.state.id
      dataItem.inputTime = now
    }

    await knex(proxy).insert(dataItem)
    //await utils.updateCacheTime(proxy)
    if (config.autosign) {
      return {
        [idkey]: dataItem[idkey],
        inputor: dataItem.inputor,
        inputTime: dataItem.inputTime
      }
    }
    return dataItem.id
  }

  const Get = async (ctx) => {
    let dataId = ctx.params.id
    if (!dataId) {
      throw ("对象ID为丢失")
    }
    let idkey = config.idkey || "id"
    let query = knex(proxy).first().where({
      [idkey]: dataId
    })
    if (config.get && config.get.extend) {
      query = config.get.extend(ctx, query)
    }
    let res = await query
    if (config && config.get && config.get.formatter)
      res = config.get.formatter(res)
    return res
  }

  const Patch = async (ctx) => {
    let dataId = ctx.params.id
    let idkey = config.idkey || "id"
    if (!dataId) {
      throw ("对象ID为丢失")
    }
    let dataItem = ctx.request.body
    if (config && config.patch && config.patch.validator)
      dataItem = config.patch.validator(dataItem)

    let now = moment().format()
    if (config.autosign) {
      dataItem.updator = ctx.state.id
      dataItem.updateTime = now
    }

    await knex(proxy).update(dataItem).where({
      [idkey]: dataId
    })
    //await utils.updateCacheTime(proxy)

    return {
      updateTime: now
    }
  }

  const Delete = async (ctx) => {
    let dataId = ctx.params.id
    let idkey = config.idkey || "id"
    if (!dataId) {
      throw ("对象ID为丢失")
    }
    await knex(proxy).where({
      [idkey]: dataId
    }).del()
    //await utils.updateCacheTime(proxy)
  }

  return {
    List: config.List ? config.List(knex) : List,
    Post: config.Post ? config.Post(knex) : Post,
    Patch: config.Patch ? config.Patch(knex) : Patch,
    Delete: config.Delete ? config.Delete(knex) : Delete,
    Get: (config.Get ? config.Get(knex) : Get),
    Related: config.Related,
    AddRelated: config.AddRelated,
    PatchRelated: config.PatchRelated,
    DelRelated: config.DelRelated
  }
}

module.exports = utils