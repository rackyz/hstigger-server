const Spider = require('../base/spider')
const cheerio = require('cheerio')
const UTIL = require('../base/util')
const request = require('request')
const fs = require('fs')
const path = require('path')
const PIC_NEWS = "PIC_NEWS"
const TEXT_NEWS = "TEXT_NEWS"
const QCOS = require('cos-nodejs-sdk-v5')
const config = require('../base/config')
const images = require('images')
const REDIS = require('../base/redis')
var cos = new QCOS(config.cos)
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
    console.log('start spider loading...')
     let loading = await REDIS.ASC_GET('SPIDER_LOADER'+key)
     console.log('loading:', 'SPIDER_LOADER' + key,loading)
     if(loading){
      console.log('SPIDER already in loading..',key)
      return []
     }
     await REDIS.ASC_SET('SPIDER_LOADER' + key,true)
     REDIS.EXPIRE('SPIDER_LOADER' + key, 1)
     
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
         image:  $(el).find('img').first().attr('src')
       }
     }).get()

      let raw_images = data[PIC_NEWS].map(v=>v.image)
      console.log('spider images length:',raw_images.length)
      for (let i = 0; i < raw_images.length; i++) {
        let imgUrl = baseURL + raw_images[i]
        let filename = raw_images[i].slice(raw_images[i].lastIndexOf('/') + 1)
        data[PIC_NEWS][i].image = 'https://nbgzfiles-1257839135.cos.ap-shanghai.myqcloud.com/spider/' + filename
        let stream_download = request(imgUrl).pipe(fs.createWriteStream("./tmp/" + filename))
        stream_download.on('finish',()=>{
          console.log('download finished:',filename)
            let filezipped_path = "./tmp/" + filename
            try {
              filezipped_path = "./tmp/zipped_" + filename
              images("./tmp/" + filename).size(600).save(filezipped_path, {
                quality: 60
              })
            } catch (e) {
              console.log('images-error:',filename, e.message)
              filezipped_path = "./tmp/" + filename
            }

            try{
            cos.putObject({
              Bucket: config.cos.fileBucket,
              Region: config.cos.region,
              Key: "spider/" + filename,
              Body: fs.createReadStream(filezipped_path)
            }, (err, data) => {
              if (err) {
                console.log('upload cos failed:', err, data)
              }else{
                console.log('upload cos succeed:', filename)
              }
              
            })
          }catch(e){
            console.log('cos-upload error:',e.message)
            data[PIC_NEWS][i].image = 'https://api.hstigger.com/public/'+filezipped_path
          }
        })
        
         
        }
     

     await Spider.save('NBFJJ_' + PIC_NEWS, data[PIC_NEWS])

     data[TEXT_NEWS] = $('#rdgz1').find('li').map((i, el) => {
       return {
         title: $(el).find('.zx-text').attr('title'),
         link: baseURL + $(el).find('a').attr('href'),
         date: $(el).find('.zx-data').text()
       }
     }).get()

     await Spider.save('NBFJJ_'+TEXT_NEWS, data[TEXT_NEWS])
     await REDIS.del('SPIDER_LOADER'+key)
     return data[key]
  }

}
