
const sms = require('../libs/qsms')
const Message = {}
// QSMS
Message.Create = async (from, to, content) => {
  await mysql('message').insert({
    from,
    to,
    content,
    created_at: utils.getTimeStamp(),
  })
}

// SMS
Message.sendSMS = sms.sendSMS

module.exports = Message