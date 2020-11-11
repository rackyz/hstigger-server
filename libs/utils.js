const rp = require('request-promise');
var exports = {}
const moment = require('moment')
const images = require('images')

/**
 *  getPMIS_fID
 *  2019/3/7
 */
const options = {
    uri: 'http://zzlatm.gicp.net:10000/api/create_fID.html',
    json: true
}
exports.getPMIS_fID = async function () {
    return await rp(options)
}

exports.zipJpg = function(filepath,filepath_out,quality){
    images(filepath).save(filepath_out, {
        quality //保存图片到文件,图片质量为50
    })
}



exports.formatSmartDate = function (dateStr, formatStr, noFromNow) {
    let date = moment(dateStr,formatStr)
    let today = moment()
    let duration = moment.duration(today - date)
    if (!noFromNow && duration.asDays() < 7)
        return date.fromNow()
    else if(date.year() == today.year())
        return date.format('MM月DD日')
    else 
        return date.format('YYYY年MM月DD日')
}
const debug = require('debug')('qcloud-sdk[CosUploader]')
const shortid = require('shortid')
const fs = require('fs')
const CosSdk = require('cos-nodejs-sdk-v5')
const config = require('../config')
const ERRORS = require('constants').ERRORS
const regionMap = {
    'ap-beijing-1': 'tj',
    'ap-beijing': 'bj',
    'ap-shanghai': 'sh',
    'ap-guangzhou': 'gz',
    'ap-chengdu': 'cd',
    'ap-singapore': 'sgp',
    'ap-hongkong': 'hk',
    'na-toronto': 'ca',
    'eu-frankfurt': 'ger'
}

var cos = null
exports.putObject = async (filepath) => {
    // 初始化 sdk
    if(!cos){
        cos = new CosSdk({
            SecretId: config.cos.SecretId,
            SecretKey: config.cos.SecretKey,
            Domain: `http://${config.cos.fileBucket}-${config.qcloudId}.cos.${config.cos.region}.myqcloud.com/`
        })
    }


      // 生成上传参数
      const srcpath = filepath
      let imageFile = fs.statSync(filepath)
      let exts = filepath.split('.')
      if(!exts && exts.length == 0){
          throw('文件后缀名无效')
      }
      let ext = exts[exts.length-1]
      const imgKey = `${Date.now()}-${shortid.generate()}` + (ext ? `.${ext}` : '')
      let date = moment().format('YYYYMMDD')
      let uploadFolder = config.cos.uploadFolder ? 
        config.cos.uploadFolder + '/': ''
        uploadFolder = uploadFolder + date + '/'
      debug(config.qcloudId)
      const params = {
          Bucket: `${config.cos.fileBucket}-${config.qcloudId}`,
          Region: config.cos.region,
          Key: `${uploadFolder}${imgKey}`,
          Body: fs.createReadStream(srcpath),
          ContentLength: imageFile.size
      }
     
      return new Promise((resolve, reject) => {
          // 上传图片
          cos.putObject(params, (err, data) => {
              if (err) {
                  reject(err)
                  // remove uploaded file
                  //fs.unlink(srcpath, () => {})
                  return
              }

              resolve(`https://${config.cos.fileBucket}-${config.qcloudId}.cos.${config.cos.region}.myqcloud.com/${uploadFolder}${imgKey}`,
              )

              // remove uploaded file
              //fs.unlink(srcpath, () => {})
            })
    })
    
    
    }






module.exports= exports