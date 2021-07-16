var QcloudSms = require("qcloudsms_js");

// 短信应用SDK AppID
var appid = 1400165976; // SDK AppID是1400开头

// 短信应用SDK AppKey
var appkey = "efcedd3573951d956eb543e671673730";
var qcloudsms = QcloudSms(appid, appkey);
var ssender = qcloudsms.SmsSingleSender();

function callback(err, res, resData) {
  if (err) {
    console.log("SMS ERR: ", err);
  } else {
    console.log("SMS request data: ", res.req);
    console.log("SMS response data: ", resData);
  }
}

const SMS_TEMPLATES = {
  VCODE:242160,
  REGISTER: 766535,
  FLOW: 311688
}

var sendSMS = function (tmpl_key, phone, params) {
  let tmpl = SMS_TEMPLATES[tmpl_key] || tmpl_key
  if(!tmpl)
    throw "TMPL not exist"

 ssender.sendWithParam(86, phone, tmpl,
   params, '宁波高专', "", "", callback);
}


module.exports = {
  sendSMS
}