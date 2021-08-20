// 加密函数
function encrypt(pass) {
  let arr = pass.split('')
  let str = arr.map((item, index) => item + index).join('')
  return str
}

// 解密函数
function decrypt(pass) {
  let arr = pass.split('')
  let str = arr.filter((item, index) => index % 2 === 0).join('')
  return str
}

module.exports = {
  encrypt, decrypt
}