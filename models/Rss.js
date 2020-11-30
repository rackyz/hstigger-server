const UTIL = require('../base/util')
const REDIS = require('../base/redis')
//const MYSQL = require('../base/mysql')
const EXCEPTION = require('../base/exception')
const TYPE = require('./Type')
const MYSQL = require('../base/mysql')
const o = {
  required: ['Type']
}

const T_RSS = "rss"
const NBFJ_PIC_NEWS = {
  name: "宁波市房建局官网 - 图片新闻",
  source_type:0,
  subject_type:'建筑',
  content_type:'图片新闻',
  media_type:'picnews',
  key:"NBFJJ_PIC_NEWS",
  state: 0,
  created_at: UTIL.getTimeStamp()
}

const NBFJ_NEWS = {
  name: "宁波市房建局官网 - 行业动态",
  source_type: 0,
  subject_type: '建筑',
  content_type: '新闻',
  media_type: 'news',
  key: "NBFJJ_NEWS",
  state: 0,
  created_at: UTIL.getTimeStamp()
}
o.initdb = async (forced)=>{



}


module.exports = o