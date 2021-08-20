const { io } = require('../start')
const User = require('../model/user')
const fs = require('fs')
// const path = require('path')

const user_m = require('./user')
const group_m = require('./groups')
const tempGroup_m = require('./tempGroups')

let personNum = 0

// console.log(io.in(123));
io.on('connect', socket => {
  // 用户断开连接事件
  socket.on('disconnect', () => {
    socket.isLogin = false
    if (socket.nick) {
      personNum--
      console.log(socket.nick + ' 离开，当前在线人数：' + personNum);
    }
  })

  // 用户连接响应
  socket.on('userConnect', (o, fn) => {
    user_m.userConnect(socket, o, fn, () => {
      personNum++
      console.log(socket.nick + ' 加入，当前在线人数：' + personNum);
    })
  })

  // 用户登录
  socket.on('login', (o, fn) => {
    user_m.login_res(socket, o, fn, () => {
      personNum++
      console.log(socket.nick + ' 加入，当前在线人数：' + personNum);
    })
  })


  // 获取用户所有的群
  socket.on('getGroups', (o, fn) => group_m.getUserGroups_res(socket, o, fn))

  // 创建一个群聊
  socket.on('createGroup', (o, fn) => group_m.createGroup(socket, o, fn))

  // 删除一个群聊
  socket.on('deleteGroup', (o, fn) => group_m.deleteGroup(socket, o, fn))

  // 查找一个群聊
  socket.on('findGroup', (o, fn) => group_m.findGroup(socket, o, fn))

  // 加入一个群聊
  socket.on('addGroup', (o, fn) => group_m.addGroup(socket, o, fn))

  // 接受修改个人头像
  socket.on('avatar', (o, fn) => user_m.avatar(socket, o, fn))

  // 接受修改群聊头像
  socket.on('gAvatar', (o, fn) => group_m.gAvatar(socket, o, fn))

  // 接收修改用户昵称
  socket.on('updateNick', (o, fn) => user_m.updateNick(socket, o, fn))

  // 获取所有临时对话群列表
  socket.on('getTempGroups', (o, fn) => tempGroup_m.getTempGroups(socket, o, fn))

  // 监听所有的群消息
  socket.on('groupMsg', (o, fn) => tempGroup_m.groupMsg(socket, o, fn))

  // 添加群到临时列表
  socket.on('addTempGroup', (o, fn) => tempGroup_m.addTempGroup(socket, o, fn))

  // 从临时列表中移除一个群聊
  socket.on('deleteTempGroup', (o, fn) => tempGroup_m.deleteTempGroup(socket, o, fn))

  //用户发送的群聊图片
  socket.on('groupMsgImg', (o, fn) => tempGroup_m.groupMsgImg(socket, o, fn))

  // 从群聊中撤回一条消息
  socket.on('groupWithDraw', (o, fn) => tempGroup_m.groupWithDraw(socket, o, fn))

  // 在房间内发消息
  // io.to()
})

module.exports = { io }