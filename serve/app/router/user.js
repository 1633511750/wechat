// const express = require('express')
// const router = express.Router()
const User = require('../model/user')
const Group = require('../model/group')
// const encode = require('../util/encode')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { secret, expiredHour } = require('../config/config')
const isLogin = require('./isLogin')

// 首页全部用户信息
// router.get('/', isLogin, async (req, res) => {
//   let list = await User.find()
//   res.send({ code: 0, list })
// })

// 检查用户是否登录
router.post('/checkLogin', isLogin, (req, res) => {
  res.send({ code: 0, msg: '已经登录' })
})

// 注册
router.post('/register', async (req, res) => {
  let user = await User.findOne({ username: req.body.username })
  if (user) {
    return res.send({ code: 1, msg: '该用户名已存在' })
  }
  // req.body.password = encode.encrypt(req.body.password)
  let newUser = await User(req.body).save()
  res.send({ code: 0, msg: '注册成功', username: newUser.username })
})

router.post('/login', async (req, res) => {
  let user = await User.findOne({ username: req.body.username })
  if (!user) {
    return res.send({ code: 1, msg: '用户不存在' })
  }
  if (!bcrypt.compareSync(req.body.password, user.password)) {
    return res.send({ code: 2, msg: '密码错误' })
  }
  // console.log(req.headers.authorization);
  let token = jwt.sign({ _id: user._id, username: 'user.username' }, secret, { expiresIn: expiredHour + 'h' })
  res.send({ code: 0, token, uid: user._id, nick: user.nick })
})

// 返回所有临时对话群
router.get('/groups/temp', isLogin, async (req, res) => {
  if (!req.user.tempGroups) {
    req.user.tempGroups = []
  }
  let tList = []
  for (let i = 0; i < req.user.tempGroups.length; i++) {
    let temp = await Group.findOne({ num: req.user.tempGroups[i] })
    tList.push({ num: temp.num, name: temp.name, avatarUrl: temp.avatarUrl })
  }
  res.send({ code: 0, list: tList })
})

// 添加群到临时对话列表
router.put('/groups/temp/add/:num', isLogin, async (req, res) => {
  // if (!req.user.tempGroups) {
  //   req.user.tempGroups = []
  // }
  let result = await User.findByIdAndUpdate(req.user._id, { $addToSet: { tempGroups: req.params.num - 0 } }, { new: true })
  console.log(result);
  res.send({ code: 0 })
})

// 从临时列表里移除指定的一个群
router.put('/groups/temp/delete/:num', isLogin, async (req, res) => {
  let num = req.params.num - 0
  let result = await User.updateOne({ _id: req.user._id }, { $pull: { tempGroups: num } })
  console.log(result);
  if (result.ok > 0) {
    res.send({ code: 0, msg: '移除群成功' })
  } else {
    res.send({ code: 1, msg: '移除群出错' })
  }
})

module.exports = router