let out = {}
const superagent = require('superagent')
require('superagent-proxy')(superagent)
require('superagent-charset')(superagent)
const cheerio = require('cheerio')

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


out.Get = async ctx=>{
  let id = ctx.params.id

  let html = await GetHTML("http://zjw.ningbo.gov.cn/")
  $ = cheerio.load(html, {
    ignoreWhitespace: true,
    xmlMode: true
  })
  console.log("PARSED:",$('.imgbanner').text())
  let news = []
  return $('.imgbanner').find('li').map(v=>{
    return $(v).text()
  })

}

module.exports = out