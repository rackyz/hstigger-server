var QcloudSms = require("qcloudsms_js");

// 短信应用SDK AppID
var appid = 1400165976; // SDK AppID是1400开头

// 短信应用SDK AppKey
var appkey = "efcedd3573951d956eb543e671673730";
var qcloudsms = QcloudSms(appid, appkey);
var ssender = qcloudsms.SmsSingleSender();
var params = ["5678"]; //数组具体的元素个数和模板中变量个数必须一致，例如事例中templateId:5678对应一个变量，参数数组中元素个数也必须是一个

function callback(err, res, resData) {
  if (err) {
    console.log("SMS ERR: ", err);
  } else {
    console.log("SMS request data: ", res.req);
    console.log("SMS response data: ", resData);
  }
}

const SMS_TMPLS = {
  "VCODE":242160,
  "REGISTER": 766535
}

var sendSMS = function (tmpl_key, phone, params) {
 ssender.sendWithParam(86, phone, SMS_TMPLS[tmpl_key],
   params, '', "", "", callback);
}

var sendVcode = function (phone, vcode) {
  ssender.sendWithParam(86, phone, 242160,
    [vcode], '', "", "", callback);
}

var sendPassword = function (phone, pwd) {
  ssender.sendWithParam(86, phone, 283226, [pwd], '', '', '', callback)
}

var sendAccount = function (phone, acount, pwd) {
  ssender.sendWithParam(86, phone, 284011, [acount, pwd], '', '', '', callback)
}

var sendWorkflow = function (phone, flowName, flowDesc, nodeId, nodeName) {
  ssender.sendWithParam(86, phone, 311688, ['-' + flowName, flowDesc, nodeId, nodeName], '', '', '', callback)
}

var sendWorkflowFinish = function (phone, flowName, flowDesc) {
  ssender.sendWithParam(86, phone, 311592, ['-' + flowName, flowDesc], '', '', '', callback)
}

module.exports = {
  sendSMS,
  sendVcode,
  sendPassword,
  sendAccount,
  sendWorkflow,
  sendWorkflowFinish
}