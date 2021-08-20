const jwt = require('jsonwebtoken')
const { secret } = require('../config/config')
const User = require('../model/user')

// 验证用户石否登录的中间件
const isLogin = (req, res, next) => {
  if (!req.headers || !req.headers.authorization) {
    return res.send({ code: 205, msg: 'token错误' })
  }
  // const token = jwt.verify(req.headers.authorization.split(' ').pop(), secret)
  jwt.verify(req.headers.authorization.split(' ').pop(), secret, async (err, token) => {
    if (err) {
      switch (err.name) {
        case 'JsonWebTokenError':
          res.send({ code: 205, msg: 'token无效' })
          break
        case 'TokenExpiredError':
          res.send({ code: 205, msg: 'token已过期' })
          break
      }
    } else {
      const user = await User.findById(token._id)
      if (!user) {
        return res.send({ code: 205, msg: '用户不存在' })
      }
      if (token.username !== 'user.username') {
        return res.send({ code: 205, msg: '用户错误' })
      }
      // if (user.isAdmin !== '1') {
      //   return res.send({ code: 'c4', msg: '无权限' })
      // } else {
      //   next()
      // }
      req.user = user
      next()
    }
  })
}

module.exports = isLogin