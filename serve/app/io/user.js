const User = require('../model/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { secret, expiredHour, baseUrl } = require('../config/config')
const { getMsg } = require('./isLogin')
const fs = require('fs')
const { rnd } = require('../util/utils')

// 登录
async function login_res(socket, { username, password }, fn, cb) {
  let user = await User.findOne({ username })
  if (!user) {
    return fn({ code: 1, msg: '用户不存在' })
  }
  if (!bcrypt.compareSync(password, user.password)) {
    return fn({ code: 2, msg: '密码错误' })
  }
  socket.uid = user._id
  socket.nick = user.nick

  let token = jwt.sign({ _id: user._id, username: 'user.username' }, secret, { expiresIn: expiredHour + 'h' })

  // 把用户加入到已加入的群房间
  user.groups.forEach(item => {
    socket.join('g' + item)
  })

  socket.isLogin = true

  fn({ code: 0, msg: '登录成功', token, uid: user._id, nick: user.nick, avatarUrl: user.avatarUrl })
  cb && cb()
}

// 刷新网页用户连接服务器
async function userConnect(socket, o, fn, cb) {
  if (!await getMsg(socket, o, fn)) {
    return
  }

  socket.uid = socket.user._id
  socket.nick = socket.user.nick

  // 把用户加入到已加入的群房间
  socket.user.groups.forEach(item => {
    socket.join('g' + item)
  })
  socket.isLogin = true
  fn({ code: 0, msg: '连接服务器成功' })
  cb && cb()
}

// 修改个人头像
async function avatar(socket, o, fn) {
  if (!await getMsg(socket, o, fn)) return

  let reg = /^data:image\/\w+;base64,/
  let ext = o.base64Img.split(';')[0].slice(11)
  console.log(ext);
  let base64Img = o.base64Img
  base64Img = base64Img.replace(reg, '')
  var dataBuffer = new Buffer.from(base64Img, 'base64');
  //写入文件
  fs.writeFile('public/user/avatar/' + socket.uid + '.' + ext, dataBuffer, async function (err) {
    if (err) {
      console.log(err);
      fn({ code: 1, msg: '修改头像失败' })
    } else {
      let avatarUrl = baseUrl + '/user/avatar/' + socket.uid + '.' + ext + '?rnd=' + rnd(5)
      let result = await User.updateOne({ _id: socket.uid }, { avatarUrl })
      if (result.ok > 0) {
        fn({ code: 0, msg: '修改头像成功', avatarUrl })
      } else {
        fn({ code: 2, msg: '修改失败' })
      }
    }
  })
}

// 修改用户昵称
async function updateNick(socket, o, fn) {
  if (!await getMsg(socket, o, fn)) return
  let nick = o.nick
  let result = await User.updateOne({ _id: socket.uid }, { $set: { nick } })
  if (result.ok > 0) {
    socket.nick = nick
    fn({ code: 0, msg: '修改昵称成功', nick })
  } else {
    fn({ code: 1, msg: '修改昵称失败' })
  }
}

module.exports = {
  login_res,
  userConnect,
  avatar,
  updateNick
}