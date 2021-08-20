const Group = require('../model/group')
const User = require('../model/user')
const { getMsg } = require('./isLogin')
const fs = require('fs')
const { rnd } = require('../util/utils')
const { baseUrl } = require('../config/config')

// 获取用户所有的群
async function getUserGroups_res(socket, o, fn, cb) {
  if (!await getMsg(socket, o, fn)) return

  let gList = []
  for (let i = 0; i < socket.user.groups.length; i++) {
    let temp = await Group.findOne({ num: socket.user.groups[i] })
    if (temp) {
      gList.push({ num: temp.num, name: temp.name, avatarUrl: temp.avatarUrl })
    }
  }
  fn({ code: 0, list: gList, msg: '获取所有群成功' })
  cb && cb()
}

// 创建一个群聊
async function createGroup(socket, o, fn) {
  if (!await getMsg(socket, o, fn)) return

  let num = o.num - 0
  let g = await Group.findOne({ num })
  if (g) {
    fn({ code: 1, msg: '该群号已存在，请换一个' })
    return
  }
  await new Group({
    num,
    name: o.name
  }).save()

  let response = await User.updateOne({ _id: socket.user._id }, { $addToSet: { groups: num } })
  let response1 = await Group.updateOne({ num }, { $addToSet: { userIds: socket.user._id } })
  if (response.ok === 1 && response1.ok === 1) {
    socket.join('g' + num)
    fn({ code: 0, msg: '创建群成功' })
  } else {
    fn({ code: 2, msg: '创建群失败' })
  }
}

// 查找一个群聊
async function findGroup(socket, o, fn) {
  if (!await getMsg(socket, o, fn)) return
  let num = o.num - 0
  let group = await Group.findOne({ num })
  if (group) {
    fn({ code: 0, msg: '已找到该群', data: { num, avatarUrl: group.avatarUrl } })
  } else {
    fn({ code: 1, msg: '未找到该群' })
  }
}

// 加入一个群聊
async function addGroup(socket, o, fn) {
  if (!await getMsg(socket, o, fn)) return

  let num = o.num - 0
  let index = socket.user.groups.findIndex(item => item === num)
  if (index !== -1) {
    fn({ code: 1, msg: '您已加入该群' })
    return
  }
  let g = await Group.findOne({ num })
  if (!g) {
    return fn({ code: 3, msg: '该群不存在' })
  }
  let response = await User.updateOne({ _id: socket.user._id }, { $addToSet: { groups: num } })
  let response1 = await Group.updateOne({ num }, { $addToSet: { userIds: socket.user._id } })
  if (response.ok === 1 && response1.ok === 1) {
    fn({ code: 0, msg: '加群成功' })
  } else {
    fn({ code: 2, msg: '加群失败' })
  }
}

// 用户删除一个群聊
async function deleteGroup(socket, o, fn) {
  if (!await getMsg(socket, o, fn)) return

  let num = o.num - 0

  let response2 = await Group.updateOne({ num }, { $pull: { userIds: socket.user._id } })
  let response1 = await User.updateOne({ _id: socket.user._id }, { $pull: { groups: num } })
  console.log(response1, response2);
  if (response1.ok > 0 && response2.ok > 0) {
    fn({ code: 0, msg: '删除群成功' })
  } else {
    fn({ code: 1, msg: '删除群失败' })
  }
}

// 修改群聊头像
async function gAvatar(socket, o, fn) {
  if (!await getMsg(socket, o, fn)) return

  let reg = /^data:image\/\w+;base64,/
  let ext = o.base64Img.split(';')[0].slice(11)
  let base64Img = o.base64Img
  let num = o.num - 0
  base64Img = base64Img.replace(reg, '')
  var dataBuffer = new Buffer.from(base64Img, 'base64');
  //写入文件
  fs.writeFile('public/group/avatar/' + num + '.' + ext, dataBuffer, async function (err) {
    if (err) {
      console.log(err);
      fn({ code: 1, msg: '修改头像失败' })
    } else {
      let avatarUrl = baseUrl + '/group/avatar/' + num + '.' + ext + '?rnd=' + rnd(5)
      let result = await Group.updateOne({ num }, { avatarUrl })
      if (result.ok > 0) {
        fn({ code: 0, msg: '修改头像成功', avatarUrl })
      } else {
        fn({ code: 2, msg: '修改失败' })
      }
    }
  })
}

module.exports = {
  getUserGroups_res,
  createGroup,
  addGroup,
  deleteGroup,
  findGroup,
  gAvatar
}