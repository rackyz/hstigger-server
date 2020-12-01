const Spider = require('../base/spider')
const cheerio = require('cheerio')
const UTIL = require('../base/util')

const PIC_NEWS = "PIC_NEWS"
const TEXT_NEWS = "TEXT_NEWS"
const baseURL = "http://bid.cnnb.com.cn"
module.exports = {
  rss: {
    [TEXT_NEWS]: {
      name: "宁波招标网-最新项目",
      source_type: 0,
      subject_type: 0,
      link: baseURL,
      media_type: 2,
      state: 1,
      created_at: UTIL.getTimeStamp()
    }
  },
  async getData(key) {

    let html = await Spider.html(baseURL,'gbk')

    $ = cheerio.load(html, {
      ignoreWhitespace: true,
      xmlMode: true
    })

    const data = {}
    data[key] = $('tr').filter((i,el)=>{
      return ($(el).find("td").length == 4 && $(el).find("td").first().attr('width') == 68)
    }).map((i,el)=>{
      let o = {}

      let tds = $(el).find('td')
      o.id = $(tds[0]).text()
      o.link= $(tds[1]).children('a').first().attr('href')
      o.title = $(tds[1]).find('a').first().text()
      o.date = $(tds[3]).text()
      return o
    }).get()
    // data[TEXT_NEWS] = $('body').find('table').first().find('table').map((i, el) => {
    //   return {
    //     title: $(el).find('.zx-text').attr('title'),
    //     link: baseURL + $(el).find('a').attr('href'),
    //     date: $(el).find('.zx-data').text()
    //   }
    // }).get()

    
    data[key] = data[key].slice(1,13)
    await Spider.save("NBZBW_" + TEXT_NEWS, data[key])
    return data[key]
  }

}
