const MYSQL = require('../base/mysql')
const Type =  require('./Type')
const UTIL = require('../base/util')
const Exception = require('../base/exception')
const File = require('./File')

let o = {}

o.required = ['Type']
const _T = "archive"
const _T_File = "archive_file"

o.initdb = async (forced) => {
      //forced = true
      await MYSQL.initdb(_T, t => {
        t.uuid('id').index().primary() // uuid
        t.string('code', 16)
        t.string('name', 64)
        t.integer('type1').defaultTo(0)
        t.integer('type2').defaultTo(0)
        t.uuid('project_id')
        t.integer('dep_id')
        t.integer('year')
        t.string('desc',128)
        t.integer('version')
        t.uuid('updated_by')
        t.datetime('updated_at')
        t.uuid('created_by')
        t.datetime('created_at')
      }, forced)

      await MYSQL.initdb_e(_T_File,t=>{
         t.increments('id').index().primary() // uuid
         t.uuid('file_id')
         t.string('name')
         t.uuid('archive_id')
          t.string('ext', 16)
      },forced)
}

o.initdb_e = async (ent_id,forced) => {
      if(forced){
        await Type.AddType_e(ent_id,'ARCHIVE_WORKTYPE', ['前期管理','后期工作','合约管理','设计管理','合同管理','现场管理','投资控制','项目计划','项目外控','项目内控'])
        await Type.AddType_e(ent_id, 'ARCHIVE_SAVETYPE', ['立项审批及往来文件', '项目建设证件文件','项目技术分析文件','施工图审查批准文件','工程变更管理文件','供水供电资料','竣工验收资料'])
        await Type.AddType_e(ent_id,'ARCHIVE_DOCTYPE',['审批文件','施工图纸','会议记录','计划','合同','技术文稿'])
      }
      //forced = true
     await MYSQL.initdb(_T, t => {
       t.uuid('id').index().primary() // uuid
       t.string('code', 16)
       t.string('name', 64)
       t.integer('type1').defaultTo(0)
       t.integer('type2').defaultTo(0)
       t.integer('type3').defaultTo(0)
       t.uuid('project_id')
       t.integer('count').defaultTo(0)
       t.integer('dep_id')
       t.integer('year')
       t.string('desc', 128)
       t.integer('version')
       t.uuid('updated_by')
       t.datetime('updated_at')
       t.uuid('created_by')
       t.datetime('created_at')
     }, forced, ent_id)

     await MYSQL.initdb_e(_T_File, t => {
       t.increments('id').index().primary() // uuid
       t.string('file_id',44)
       t.string('name')
       t.string('archive_id',44)
       t.string('ext',16)
     }, forced, ent_id)
}



// 
o.count = async (ctx,queryCondition= {},ent_id)=>{
   const Q = ent_id ? MYSQL.E(ent_id, _T) : MYSQL(_T)
   const condition = {}
   let res = await Q.count('count').where(condition)
   return res.count
}

o.query = async (ctx,queryCondition={},ent_id)=>{
  let pageSize = queryCondition.pageSize || 100
  let page = queryCondition.page || 1
  const condition = null
  const Q = ent_id ? MYSQL.E(ent_id, _T) : MYSQL(_T)
  if(condition){
    Q = Q.where(condition)
  }
  let items = await Q.offset((page - 1) * pageSize).limit(pageSize)
  
  return items
}

o.get = async (ctx,id,ent_id)=>{
  const Q = ent_id ? MYSQL.E(ent_id, _T) : MYSQL(_T)
  const QF = ent_id ? MYSQL.E(ent_id, _T_File) : MYSQL(_T_File)

  let item = await Q.first().where({id})
  if(!item)
    throw Exception.E_INVALID_DATA
  let files = await QF.select('file_id', 'archive_id', 'name','ext').where('archive_id', id)
  console.log(id,files)
  item.files = await StringifyFilesString(files)
  
  return item
}

o.add = async (ctx,data,ent_id)=>{
  const Q = ent_id ? MYSQL.E(ent_id, _T) : MYSQL(_T)
  const QF = ent_id ? MYSQL.E(ent_id, _T_File) : MYSQL(_T_File)

  let created_at = UTIL.getTimeStamp()
  let created_by = ctx.id
  let filelist = []
  
  let updateInfo = {
    id:UTIL.createUUID(),
    created_at,
    created_by
  }

  let list = ParseFilesString(data.files, updateInfo.id)
  delete data.files
  filelist = filelist.concat(list)
  updateInfo.count = list.length
  console.log(data, updateInfo, filelist)
  Object.assign(data, updateInfo)
  await Q.insert(data)
  await QF.insert(filelist)

  return updateInfo
}

const ParseFilesString = (file_str,archive_id)=>{
  let filelist = []
  if (typeof file_str === 'string' && file_str.includes(',')) {
    
    let files = file_str.split(';').map(f => f.split(','))
    filelist = files.map(f => ({
      archive_id,
      name: f[0],
      file_id: f[1] ? f[1].slice(f[1].lastIndexOf('/')+1) : "",
      ext:f[2]
    }))
  } else {
    throw '附件不合法:' + JSON.stringify(file_str)
  }

  return filelist
}

const StringifyFilesString = async files=>{
  for(let i=0;i<files.length;i++)
  {
    let url = await File.GetFileUrl(files[i].file_id)
    files[i].str = files[i].name + ',' + url + ',' + files[i].ext
  }
  return files.map(v => v.str).join(';')
}

o.patch = async (ctx,id,data,ent_id)=>{
   const Q = ent_id ? MYSQL.E(ent_id, _T) : MYSQL(_T)
   const QF = ent_id ? MYSQL.E(ent_id, _T_File) : MYSQL(_T_File)
   let updateInfo = {
     updated_at:UTIL.getTimeStamp(),
     updated_by:ctx.id
   }
   if(data.files){
     let files = ParseFilesString(data.files,id)
     await QF.where('archive_id',id).del()
     await QF.insert(files)
     delete data.files
    updateInfo.count = files.length
   }

  
   Object.assign(data,updateInfo)
   await Q.update(data).where({id})
   return updateInfo
}

o.del = async (ctx,id_list,ent_id)=>{
  const Q = ent_id ? MYSQL.E(ent_id, _T) : MYSQL(_T)
  const QF = ent_id ? MYSQL.E(ent_id, _T_File) : MYSQL(_T_File)
  await Q.whereIn('id',id_list).del()
  await QF.whereIn('archive_id',id_list).del()
  // 移除文件的关联
}




module.exports = o