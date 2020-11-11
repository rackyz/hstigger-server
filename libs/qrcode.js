var utils = {};
var fs = require('fs');
var qr = require('qr-image');
var images = require("images");
const path = require('path')
/**
 * 根据地址生成二维码
 * 参数 url(string) 地址
 * 参数 callback(Function)
 */
utils.createQr = function (text,size=400) {
    var qr_png = qr.image(text, {
        type: 'png'
    });
    
    var imgName = +(new Date()) + '' + Math.ceil(Math.random() * 89 + 10)
    const file_path = path.format({
        root: path.join(__dirname, '../static/qrcode/'),
        name:imgName,
        ext:'.png'
    })

    return new Promise((resolve,reject)=>{
        var qr_pipe = qr_png.pipe(fs.createWriteStream(file_path));
        qr_pipe.on('error', function (err) {
            reject(err)
            return;
        })
        qr_pipe.on('finish', function () {
            resolve(file_path)
        })
    })
    
};

utils.createNbgzQr = async function(text,size=400){
    const waterImg = path.format({
        root: path.join(__dirname, '../static/'),
        name: 'NBGZ',
        ext: '.png'
    })
    var imgName = +(new Date()) + '' + Math.ceil(Math.random() * 89 + 10)
    let filepath = await utils.createQr(text,size).catch(e=>{
        throw(e)
    })
    console.log('FILE:',filepath)
    utils.addWater(filepath, waterImg, filepath)
    return filepath.replace(/^.*static/, 'https://www.nbgzpmis.xyz')
}

/**
 * 给图片添加水印
 * 参数 sourceImg(string) 原图片路径
 * 参数 waterImg(string) 水印图片路径
 * 参数 callback(Function)
 */
utils.addWater = function (sourceImg, waterImg) {
    var outputImgName = +(new Date()) + '' + Math.ceil(Math.random() * 89 + 10) +'_nbgz'
    images(sourceImg) //Load image from file 
        //加载图像文件
        .size(400)
        //等比缩放图像到400像素宽
        .draw(images(waterImg).size(80), 160, 160) //Drawn logo at coordinates (70,260)//为了遮住不该看的东西..
        //在(10,10)处绘制Logo
        .save(sourceImg, { //Save the image to a file,whih quality 50
            quality: 50 //保存图片到文件,图片质量为50
        });
};

module.exports = utils;
