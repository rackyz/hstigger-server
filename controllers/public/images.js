const fs = require('fs')
const path = require('path')
const request = require('request')
let out = {}

out.Get = async ctx => {
  let file = ctx.params.id
  const pathUrl = path.join(__dirname, '../../tmp/'+file);
  let postFix = file.slice(file.lastIndexOf('.')+1)
  if(!['jpg','png','gif'].includes(postFix))
    throw "文件不存在"
  ctx.type = 'image/'+postFix
  ctx.body = fs.createReadStream(pathUrl)
  
}



module.exports = out
