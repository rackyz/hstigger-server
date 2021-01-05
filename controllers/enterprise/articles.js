// 专栏
const {Article} = require('../../models')
let out = {}

out.List = ctx=>{
  let q = ctx.query.q
  if(q == 'recm'){
    return Article.query({type:'recm'})
  }
}

module.exports = out