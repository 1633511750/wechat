const mongoose = require('mongoose')
const { Schema, model } = mongoose
const bcrypt = require('bcrypt')

const userSchema = new Schema({
  username: {
    type: String,
    require: true,
    unique: true
  },
  password: {
    type: String,
    require: true,
    set(val) {
      return bcrypt.hashSync(val, 10)
    }
  },
  nick: {
    type: String,
    require: true
  },
  localtion: {
    type: String,
    default: ''
  },
  sex: {
    type: Number,
    default: 0
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  friends: {
    type: Array,
    default: []
  },
  groups: {
    type: Array,
    default: []
  },
  tempGroups: {
    type: Array,
    default: []
  }
})
const User = model('user', userSchema)

module.exports = User