const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const Spider = require('../base/spider')
const EXCEPTION = require('../base/exception')
/**
 * 映射 d 文件夹下的文件为模块
 */
const mapDir = d => {
  const tree = {}

  // 获得当前文件夹下的所有的文件夹和文件
  const [dirs, files] = _(fs.readdirSync(d)).partition(p => fs.statSync(path.join(d, p)).isDirectory())

  // 映射文件夹
  dirs.forEach(dir => {
    tree[dir] = mapDir(path.join(d, dir))
  })
  let current = null
  try {

    // 映射文件
    files.forEach(file => {
      current = file
      if (path.extname(file) === '.js') {
        tree[path.basename(file, '.js')] = require(path.join(d, file))
        tree[path.basename(file, '.js')].isCollection = true
      }
    })
  } catch (e) {
    throw ({
      current,
      e
    })
  }

  return tree
}

// 默认导出当前文件夹下的映射
let models = mapDir(path.join(__dirname))
delete models.index
const RSSMAP = {}
var initData = []
Object.keys(models).forEach(key=>{
  let model = models[key]
  if (model.rss) {
   
    initData = initData.concat(
      Object.keys(model.rss).map(subkey => {
        model.rss[subkey].id = key + '_' + subkey
        RSSMAP[key + '_' + subkey] = model
       
        return model.rss[subkey]
      }))
  }
})

const GetSubKey = (key)=>{
  return key.slice(key.indexOf('_')+1)
}


module.exports = {
  initData,
  get:async (key)=>{
    
    let data = await Spider.get(key)
    if(!data){
      let model = RSSMAP[key]
      if(!model)
        throw EXCEPTION.E_DO_NOT_PERMITTED
      data = await model.getData(GetSubKey(key))
    }
    return data
  }
}
