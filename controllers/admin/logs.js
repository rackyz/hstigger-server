const fs = require('fs')
const path = require('path')
const dir = path.join(__dirname + '/../../logs')
let out = {}
out.List = async ctx => {
  let logs = fs.readdirSync(dir)

  return logs.map((v) => ({
    id: v,
    name: v
  }))
}


out.Get = async ctx => {
  let id = ctx.params.id
  let filepath = dir + '/' + id
  let data = fs.readFileSync(filepath, 'utf-8')

  data = data.split('\n')
  data = data.map(v => {
    let matches = v.match(/(\[.*\])\s(\[.*\])\s([^-.]*)\s-\s(.*)/)
    if (!matches)
      return
    let [, date, level, type, message] = matches
    if (date)
      date = date.slice(1, date.length - 1)
    if (level)
      level = level.slice(1, level.length - 1)
    return {
      date,
      level,
      type,
      message
    }
  })

  return data.filter(v => v)
}

module.exports = out