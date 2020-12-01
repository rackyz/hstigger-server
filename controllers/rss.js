let out = {}
<<<<<<< HEAD
const {
  Rss
} = require('../models')
=======
const superagent = require('superagent')
require('superagent-proxy')(superagent)
require('superagent-charset')(superagent)
const cheerio = require('cheerio')
const {Rss} = require('../models')
const GetHTML = async url=>{
  return new Promise((resolve,reject)=>{
     var header = {
       'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
       'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.6',
       'Host': 'www.dianping.com',
       'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Mobile Safari/537.36',
       'Cache-Control': 'max-age=0',
       'Connection': 'keep-alive'
     };


     superagent // 发起请求
     
       .get(url)
       .set('header', header)
       .end(onresponse);

     // 对返回的response进行处理
     function onresponse(err, res) {
       if (err) {
         console.log(err);
         reject(err)
       } else {
         resolve(res.text)
       }
     }
  })
}
>>>>>>> e700285739b1809fee14e9bf9fa875cbea09a525


out.Auth = (user_id,ent_id)=>{

}

out.Get = async ctx => {
  let id = ctx.params.id
  let data = await Rss.get(id,ctx.state.id)

  return data
}


<<<<<<< HEAD
=======
out.List = async ctx=>{
  return await Rss.list()
}

out.Post = async ctx=>{
  let data = ctx.request.body
  let op = ctx.state.id
  return await Rss.create(data,op)
}

out.Patch = async ctx=>{
  let id = ctx.params.id
  let data = ctx.request.body
  let op = ctx.state.id

  return await Rss.patch(id,item.op)
}

out.PostAction = async ctx=>{
  let action = ctx.params.action
  let id_list = ctx.request.body
  let op = ctx.state.id
  Rss.deleteObjects(id_list,op)
}
>>>>>>> e700285739b1809fee14e9bf9fa875cbea09a525

module.exports = out