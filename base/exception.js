module.exports = {
  // KERNEL
  E_INVALID_DATA: "数据传输错误,请联系管理员",
  E_INCORRECT_VCODE: "验证码错误",
  E_USER_UNLOGIN: "用户未登录",
  E_INVALID_TOKEN: "非法访问",
  E_UNDEFINED_REQUEST: "未定义的请求",
  E_UNEXPECTED_TOKEN: "非法访问",
  E_OUT_OF_DATE: "登录已过期",
  E_DO_NOT_PERMITTED: "不允许进行这种操作",
  // SESSION
  E_SESSION_LOGIN_LATER: "登录次数过多, 请15分钟后再登录",

  // USER
  E_USER_UNREGISTERATED: "用户名不存在",
  E_USER_INCCORECT_PASSWORD: "密码错误",
  E_USER_LOCKED: '该账户已锁定,请联系管理员',
  E_USER_PHONE_EXIST: {
    key: "phone",
    error: "添加用户失败:电话号码已存在"
  },
  E_USER_USER_EXIST: {
    key: "user",
    error: "添加用户失败:用户名已存在"
  },


  E_TEST_INVALID_PHONE_NUMBER: "电话号码无效，请联系管理员15991913205",
  E_SMS_OUT_OF_LIMIT: "同一手机号发送短信超过限制,请一小时后再试",
  E_INCORRECT_VCODE: "验证码错误",
  E_PHONE_EXIST: "手机号已被注册,请尝试找回密码或联系管理员"
  ,
  E_UNAUTHED_ENTERPRISE_ID:"您无权访问该企业"

}