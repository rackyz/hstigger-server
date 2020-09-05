const debug = require('debug')('qcloud-sdk[CosUploader]')
const multiparty = require('multiparty')
const readChunk = require('read-chunk')
const shortid = require('shortid')
const fs = require('fs')
const fileType = require('file-type')
const CosSdk = require('cos-nodejs-sdk-v5')
const config = require('../config')
const ERRORS = require('constants').ERRORS
const path = require('path')

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


module.exports = (req) => {
  // 初始化 sdk
 
  const cos = new CosSdk({
    AppId: config.qcloudId,
    SecretId: 'AKID673paDhy3FlL4nGhrt3Xt7EAxZLxnvAD',
    SecretKey: '2ta8XqzwoY1MWVgkeMyQhmrqfkfPyMya',
    Domain: `http://${config.cos.fileBucket}-${config.qcloudId}.cos.${config.cos.region}.myqcloud.com/`
  })

  const maxSize = config.cos.maxSize ? config.cos.maxSize : 1024
  const fieldName = config.cos.fieldName ? config.cos.fieldName : 'file'

  debug('Cos sdk init finished')

  // 初始化 multiparty
  const form = new multiparty.Form({
    encoding: 'utf8',
    maxFilesSize: maxSize * 1024 * 1024,
    autoFiles: true,
    uploadDir: path.join(__dirname,'../tmp')
  })

  return new Promise((resolve, reject) => {
    // 从 req 读取文件
    form.parse(req, (err, fields = {}, files = {}) => {
      err ? reject(err) : resolve({ fields, files })
    })
  }).then((res) => {
    // 存储文件信息到数据库
    let file_param = res.fields
    
    let files = res.files
    if (!(fieldName in files)) {
      debug('%s: 请求中没有名称为 %s 的field，请检查请求或 SDK 初始化配置', ERRORS.ERR_REQUEST_LOST_FIELD, fieldName)
      throw new Error(ERRORS.ERR_REQUEST_LOST_FIELD)
    }
    debug('FILES:',files.file[0].headers)
    
    const imageFile = files.file[0]

    /**
     * 判断文件类型
     * 为保证安全默认支持的文件类型有：
     * 图片：jpg jpg2000 git bmp png
     * 音频：mp3 m4a
     * 文件：pdf
     */
    
    //const buffer = readChunk.sync(imageFile.path, 0, fileType.minimumBytes)
    //let resultType = fileType(buffer)
    let ext = imageFile.path.match(/.*\.(\w+)$/i)
    if(ext)
      ext = ext[1]
    else 
      throw('不支持的文件类型')
    let resultType = {
      ext:ext,
      mime: imageFile.headers['content-type'],
    }

    // 如果无法获取文件的 MIME TYPE 就取 headers 里面的 content-type
    // if (!resultType && imageFile.headers && imageFile.headers['content-type']) {
    //   const tmpPathArr = imageFile.path ? imageFile.path.split('.') : []
    //   const extName = tmpPathArr.length > 0 ? tmpPathArr[tmpPathArr.length - 1] : ''
    //   resultType = {
    //     mime: imageFile.headers['content-type'],
    //     ext: extName
    //   }
    // }

    // const allowMimeTypes = config.cos.mimetypes
    //   ? config.cos.mimetypes
    //   : ['image/jpeg', 'image/jp2', 'image/jpm', 'image/jpx', 'image/gif', 'image/bmp', 'image/png', 'audio/mpeg', 'audio/mp3', 'audio/m4a', 'application/pdf']
    // if (!resultType || !allowMimeTypes.includes(resultType.mime)) {
    //   debug('%s: 不支持类型的文件', ERRORS.ERR_UNSUPPORT_FILE_TYPE, imageFile)
    //   throw new Error(ERRORS.ERR_UNSUPPORT_FILE_TYPE)
    // }

    // 生成上传参数
    const srcpath = imageFile.path
    const imgKey = `${Date.now()}-${shortid.generate()}` + (resultType.ext ? `.${resultType.ext}` : '')
    const uploadFolder = config.cos.uploadFolder ? config.cos.uploadFolder + '/' : ''
    const params = {
      Bucket: config.cos.fileBucket,
      Region: config.cos.region,
      Key: `${uploadFolder}${imgKey}`,
      Body: fs.createReadStream(srcpath),
      ContentLength: imageFile.size
    }

    return new Promise((resolve, reject) => {
      // 检查 bucket 是否存在，不存在则创建 bucket
      cos.getService(params, (err, data) => {
        if (err) {
          reject(err)
          // remove uploaded file
          fs.unlink(srcpath, () => { })
          return
        }

        // 检查提供的 Bucket 是否存在
        const hasBucket = data.Buckets && data.Buckets.reduce((pre, cur) => {
          return pre || cur.Name === `${config.cos.fileBucket}-${config.qcloudId}`
        }, false)

        if (data.Buckets && !hasBucket) {
          cos.putBucket({
            Bucket: config.cos.fileBucket,
            Region: config.cos.region,
            ACL: 'public-read'
          }, function (err, data) {
            if (err) {
              reject(err)
              // remove uploaded file
              fs.unlink(srcpath, () => { })
              return
            }

            resolve()
          })
        }

        resolve()
      })
    }).then(() => {
      return new Promise((resolve, reject) => {
        // 上传图片
       
        cos.putObject(params, (err, data) => {
          if (err) {
            reject(JSON.stringify(err))
            // remove uploaded file
            fs.unlink(srcpath, () => { })
            return
          }
          
          file_param.url = `https://${config.cos.fileBucket}-${config.qcloudId}.cos.${config.cos.region}.myqcloud.com/${uploadFolder}${imgKey}`
          resolve({
            imgUrl: `https://${config.cos.fileBucket}-${config.qcloudId}.cos.${config.cos.region}.myqcloud.com/${uploadFolder}${imgKey}`,
            imgUrlv4: `http://${config.cos.fileBucket}-${config.qcloudId}.cos${regionMap[config.cos.region]}.myqcloud.com/${uploadFolder}${imgKey}`,
            size: imageFile.size,
            mimeType: resultType.mime,
            name: imgKey,
            imgKey,
            file_param
          })
          
          // remove uploaded file
          fs.unlink(srcpath, () => { })
        })
      })
    })
  }).catch(e => {
    if (e && e.statusCode === 413) {
      debug('%s: %o', ERRORS.ERR_FILE_EXCEEDS_MAX_SIZE, e)
      throw new Error(`${ERRORS.ERR_FILE_EXCEEDS_MAX_SIZE}\n${e}`)
    } else {
      throw e
    }
  })
}
