
let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

// 生成随机字符或数字
function rnd(len = 15) {
  let str = ''
  let chatLen = chars.length
  for (let i = 0; i < len; i++) {
    str += chars[Math.floor(Math.random() * chatLen)]
  }
  return str
}

module.exports = {
  rnd
}