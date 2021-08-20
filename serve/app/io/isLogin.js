const User = require('../model/user')
const jwt = require('jsonwebtoken')
const { secret } = require('../config/config')

// 接受到请求的中间件
function getMsg(socket, o, fn) {
  return new Promise((resolve, reject) => {
    if (!o.token) {
      fn({ code: 205, msg: '无token的请求' })
      resolve(false)
    }
    jwt.verify(o.token, secret, async (err, token) => {
      if (err) {
        switch (err.name) {
          case 'JsonWebTokenError':
            fn({ code: 205, msg: 'token无效' })
            break
          case 'TokenExpiredError':
            fn({ code: 205, msg: 'token已过期' })
            break
        }
        resolve(false)
      } else {
        const user = await User.findById(token._id)
        if (!user) {
          fn({ code: 205, msg: '用户不存在' })
          resolve(false)
        }
        socket.user = user
        resolve(true)
      }
    })
  })
}

module.exports = {
  getMsg
}