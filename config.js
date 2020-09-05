const CONF = {
  // server
  port: '5858',


  // weapp configuration
  rootPathname: '',
  root:'127.0.0.1:5858',
  qcloudId:'1257839135',
  qcloudAppId: '1257839135',

  appId: 'wx0b17a3ad6a47f9f8',
  appSecret: 'c1bf104cde1f29d1062e88f2ca5b1d76',
    // 微信登录态有效期
  wxLoginExpires: 7200,
  wxMessageToken: 'abcdefgh',

  // datebase
  // mysql:{
  //   client: 'mysql',
  //   connection: {
  //     host: '127.0.0.1',
  //     port: 3306,
  //     user: 'root',
  //       password: '',
  //       database: 'web'
  //   }, 
  //   acquireConnectionTimeout:30000,
  //   pool: { min: 0, max: 100 },
  //   debug:false,
  // },

  mysql: {
    client: 'mysql',
    connection: {
      host: '192.168.14.3',
      port: 3306,
      user: 'nbgz',
      password: 'nbgz123',
      database: 'gzcloud_orm'
    },
    acquireConnectionTimeout: 30000,
    pool: { min: 0, max: 100 },
    debug: false,
  },
  // cos
  cos: {
      /**
       * 地区简称
       * @查看 https://cloud.tencent.com/document/product/436/6224
       */
      region: 'ap-shanghai',
      SecretId: 'AKID673paDhy3FlL4nGhrt3Xt7EAxZLxnvAD',
      SecretKey: '2ta8XqzwoY1MWVgkeMyQhmrqfkfPyMya',
      // Bucket 名称
      fileBucket: 'nbgz-pmis',
      // 文件夹
      uploadFolder: 'upload'
  }

   
}


module.exports = CONF
