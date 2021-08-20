const { getMsg } = require('./isLogin')
const Group = require('../model/group')
const User = require('../model/user')
const rnd_m = require('../util/utils')
const mkdirp = require('mkdirp')
const fs = require('fs')
const { baseUrl } = require('../config/config')

// 获取最新临时群数据
async function getTempGroups(socket, o, fn) {
  if (!await getMsg(socket, o, fn)) return

  let list = []
  for (let i = 0; i < socket.user.tempGroups.length; i++) {
    let temp = await Group.findOne({ num: socket.user.tempGroups[i] })
    if (temp) {
      for (let j = 0; j < temp.messages.length; j++) {
        let u = await User.findById(temp.messages[j].uid)
        if (u) {
          temp.messages[j].nick = u.nick
          temp.messages[j].avatarUrl = u.avatarUrl
        }
      }
      list.push({ num: temp.num, name: temp.name, avatarUrl: temp.avatarUrl, messages: temp.messages })
    }
  }
  fn({ code: 0, list })
}

// 接受群聊消息
async function groupMsg(socket, o, fn) {
  if (!await getMsg(socket, o, fn)) return

  // 消息id，撤回消息要用到
  let mId = rnd_m.rnd()
  let group = await Group.findOneAndUpdate({ num: o.num }, { $push: { messages: { id: mId, uid: socket.uid, con: o.con } } }, { new: true })
  if (group) {
    if (group.messages.length > 10) {
      await Group.updateOne({ num: o.num }, { $unset: { 'messages.0': 1 } })
      await Group.updateOne({ num: o.num }, { $pull: { messages: null } })
    }
    fn({ code: 0, msg: '发送群聊消息成功', id: mId, name: group.name, num: o.num, uid: socket.user._id, nick: socket.user.nick, con: o.con, avatarUrl: socket.user.avatarUrl })
    socket.broadcast.emit('groupMsg', { code: 0, msg: '接收群聊消息成功', id: mId, name: group.name, num: o.num, uid: socket.user._id, nick: socket.user.nick, con: o.con, avatarUrl: socket.user.avatarUrl })
  } else {
    fn({ code: 1, msg: '未找到该群' })
  }
}

// 接受群聊图片
async function groupMsgImg(socket, o, fn) {
  if (!await getMsg(socket, o, fn)) return

  let mId = rnd_m.rnd()
  let num = o.num - 0
  let base64Img = o.base64Img
  let imgRnd = rnd_m.rnd(10)
  let reg = /^data:image\/\w+;base64,/
  let ext = base64Img.split(';')[0].slice(11)
  base64Img = base64Img.replace(reg, '')
  var dataBuffer = new Buffer.from(base64Img, 'base64');
  await mkdirp('public/group/img/' + num)
  fs.writeFile('public/group/img/' + num + '/' + imgRnd + '.' + ext, dataBuffer, async function (err) {
    if (err) {
      console.log(err);
      fn({ code: 1, msg: '图片写入失败' })
    } else {
      let imgUrl = baseUrl + '/group/img/' + num + '/' + imgRnd + '.' + ext
      let group = await Group.findOneAndUpdate({ num }, { $push: { messages: { id: mId, uid: socket.user._id, isImg: true, imgUrl } } }, { new: true })
      if (group) {
        if (group.messages.length > 10) {
          if (group.messages[0].isImg) {
            // fs.unlinkSync('public/group/img/' + num + group.messages[0].imgUrl.slice(group.messages[0].imgUrl.lastIndexOf('/')))
          }
          await Group.updateOne({ num }, { $unset: { 'messages.0': 1 } })
          await Group.updateOne({ num }, { $pull: { messages: null } })
        }
        fn({ code: 0, msg: '发送群聊图片成功', id: mId, name: group.name, num: o.num, uid: socket.user._id, nick: socket.user.nick, imgUrl, avatarUrl: socket.user.avatarUrl, isImg: true })
        socket.broadcast.emit('groupMsgImg', { code: 0, msg: '接收群聊图片成功', id: mId, name: group.name, num: o.num, uid: socket.user._id, nick: socket.user.nick, imgUrl, avatarUrl: socket.user.avatarUrl, isImg: true })
      } else {
        fn({ code: 1, msg: '未找到该群' })
      }
    }
  })
}

// 添加一个群聊到临时会话列表
async function addTempGroup(socket, o, fn) {
  if (!await getMsg(socket, o, fn)) return
  await User.findByIdAndUpdate(socket.user._id, { $addToSet: { tempGroups: o.num - 0 } })
  let group = await Group.findOne({ num: o.num - 0 })
  if (group) {
    for (let i = 0; i < group.messages.length; i++) {
      let u = await User.findById(group.messages[i].uid)
      if (u) {
        group.messages[i].nick = u.nick
        group.messages[i].avatarUrl = u.avatarUrl
      }
    }
    g_o = { num: group.num, name: group.name, messages: group.messages, avatarUrl: group.avatarUrl }
    fn({ code: 0, item: g_o })
  } else {
    fn({ code: 1, msg: '未找到该群' })
  }
}

// 从临时列表中移除一个群聊
async function deleteTempGroup(socket, o, fn) {
  if (!await getMsg(socket, o, fn)) return

  let num = o.num - 0
  let res = await User.updateOne({ _id: socket.user._id }, { $pull: { tempGroups: num } })
  if (res.n === 0) {
    return fn({ code: 1, msg: '用户不存在' })
  }
  if (res.ok > 0) {
    fn({ code: 0, msg: '移除群聊成功', num })
  } else {
    fn({ code: 2, msg: '移除群聊失败' })
  }
}

// 从临时列表中撤回一条群聊消息
async function groupWithDraw(socket, o, fn) {
  if (!await getMsg(socket, o, fn)) return

  let num = o.num - 0
  let id = o.id
  let g = await Group.findOne({ num })
  if (g) {
    let messages = g.messages.find(item => item.id === id)
    if (messages) {
      messages.num = num
      messages.con = ''
      messages.imgUrl = ''
      messages.isWithDraw = true
      let result = await Group.updateOne({ num, "messages.id": id }, { $set: { 'messages.$': messages } })
      if (result.ok > 0) {
        fn({ code: 0, msg: '消息撤回成功' })
        let u = await User.findById(messages.uid)
        if (u) {
          messages.nick = u.nick
          socket.broadcast.to('g' + num).emit('groupWithDraw', { ...messages, id, code: 0, msg: '撤回消息成功' })
        }
      } else {
        fn({ code: 1, msg: '消息撤回失败' })
      }
    } else {
      fn({ code: 2, msg: '未找到该消息' })
    }
  } else {
    fn({ code: 3, msg: '未找到该群' })
  }
}


module.exports = {
  getTempGroups,
  groupMsg,
  addTempGroup,
  deleteTempGroup,
  groupMsgImg,
  groupWithDraw
}