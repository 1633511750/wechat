const express = require('express')
const router = express.Router()
const Group = require('../model/group')
const User = require('../model/user')

const isLogin = require('./isLogin')

// 创建群
router.post('/create', isLogin, async (req, res) => {
  let g = await Group.findOne({ num: req.body.num })
  if (g) {
    res.send({ code: 1, msg: '该群号已存在，请换一个' })
    return
  }
  let group = await new Group({
    num: req.body.num,
    name: req.body.name
  }).save()

  let response = await User.updateOne({ _id: req.user._id }, { $addToSet: { groups: req.body.num } })
  let response1 = await Group.updateOne({ num: req.body.num }, { $addToSet: { userIds: req.user._id } })
  if (response.ok === 1 && response1.ok === 1) {
    res.send({ code: 0, msg: '创建群成功' })
  } else {
    res.send({ code: 2, msg: '创建群失败' })
  }
})

// 查找群
router.get('/find/:num', isLogin, async (req, res) => {
  let num = req.params.num - 0
  let group = await Group.findOne({ num })
  if (group) {
    res.send({ code: 0, msg: '已找到该群', data: { num, avatarUrl: group.avatarUrl } })
  } else {
    res.send({ code: 1, msg: '未找到该群' })
  }
})

// 加入群
router.post('/add/:num', isLogin, async (req, res) => {
  // let username = req.user.username
  let num = req.params.num - 0
  const user = await User.findOne({ _id: req.user._id, groups: num })
  if (user) {
    res.send({ code: 1, msg: '您已加入该群' })
    return
  }
  let response = await User.updateOne({ _id: req.user._id }, { $addToSet: { groups: num } })
  let response1 = await Group.updateOne({ num }, { $addToSet: { userIds: req.user._id } })
  if (response.ok === 1 && response1.ok === 1) {
    res.send({ code: 0, msg: '加群成功' })
  } else {
    res.send({ code: 2, msg: '加群失败' })
  }
})

// 返回用户加入的所有群
router.get('/user', isLogin, async (req, res) => {
  // let username = req.params.username
  let gList = []
  for (let i = 0; i < req.user.groups.length; i++) {
    let temp = await Group.findOne({ num: req.user.groups[i] })
    if (temp) {
      gList.push({ num: temp.num, name: temp.name, avatarUrl: temp.avatarUrl })
    }
  }
  req.user.groups = gList
  res.send({ code: 0, list: req.user.groups, msg: '获取所有群成功' })
  // let result = await User.aggregate([
  //   {
  //     $lookup:
  //     {
  //       from: "Group",
  //       localField: "groups",
  //       foreignField: "num",
  //       as: "list"
  //     }
  //   }
  // ])
})

// 用户删除已加入的一个群
router.delete('/user/delete/:num', isLogin, async (req, res) => {
  let num = req.params.num - 0

  let response2 = await Group.updateOne({ num }, { $pull: { userIds: req.user._id } })
  let response1 = await User.updateOne({ _id: req.user._id }, { $pull: { groups: num } })
  console.log(response1, response2);
  if (response1.ok > 0 && response2.ok > 0) {
    res.send({ code: 0, msg: '删除群成功' })
  } else {
    res.send({ code: 1, msg: '删除群失败' })
  }
})

module.exports = router