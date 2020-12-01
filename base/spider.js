const superagent = require('superagent')
const REDIS = require('./redis')
require('superagent-proxy')(superagent)
require('superagent-charset')(superagent)

let o = {}
o.html = async (url,charset) => {
  console.log('[风险防控]爬虫统计访问次数:', await REDIS.ASC_GET('spider_request_count'))
  return new Promise((resolve, reject) => {
    var header = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.6',
      'Host': 'www.dianping.com',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Mobile Safari/537.36',
      'Cache-Control': 'max-age=0',
      'Connection': 'keep-alive'
    };
    
    REDIS.INCR('spider_request_count')

    superagent // 发起请求
      .get(url)
      .charset(charset || false)
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

o.save = async (key,data)=>{
  await REDIS.ASC_SET_JSON(key,data)
  REDIS.EXPIRE(key,3600*24)
  // Set Expire time to 24h
}

o.get =async (key)=>{
  return await REDIS.ASC_GET_JSON(key)
}


module.exports = o