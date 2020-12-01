const Spider = require('../base/spider')
const cheerio = require('cheerio')
const UTIL = require('../base/util')

const PIC_NEWS = "PIC_NEWS"
const TEXT_NEWS = "TEXT_NEWS"
 const baseURL = "http://zjw.ningbo.gov.cn"
module.exports = {
  rss:{
    [PIC_NEWS]:{
       name: "宁波市房建局官网 - 图片新闻",
       source_type: 0,
        subject_type: 0,
        link: baseURL,
        media_type: 1,
        state: 1,
        created_at: UTIL.getTimeStamp()
    },
    [TEXT_NEWS]:{
      name: "宁波市房建局官网 - 行业动态",
      source_type: 0,
      link: baseURL,
      subject_type: 0,
      media_type: 2,
      state: 1,
      created_at: UTIL.getTimeStamp()
    }
  },
  async getData(key){
    
     let html = await Spider.html(baseURL)

     $ = cheerio.load(html, {
       ignoreWhitespace: true,
       xmlMode: true
     })

     const data ={}
     data[PIC_NEWS] = $('.imgbanner').find('li').map((i, el) => {
       return {
         title: $(el).text(),
         link: baseURL+$(el).find('a').first().attr('href'),
         image: baseURL + $(el).find('img').first().attr('src')
       }
     }).get()

     await Spider.save('NBFJJ_' + PIC_NEWS, data[PIC_NEWS])

     data[TEXT_NEWS] = $('#rdgz1').find('li').map((i, el) => {
       return {
         title: $(el).find('.zx-text').attr('title'),
         link: baseURL + $(el).find('a').attr('href'),
         date: $(el).find('.zx-data').text()
       }
     }).get()

     await Spider.save('NBFJJ_'+TEXT_NEWS, data[TEXT_NEWS])
     
     return data[key]
  }

}
