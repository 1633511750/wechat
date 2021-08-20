const mongoose = require('mongoose')
const { Schema, model } = mongoose

const groupSchema = new Schema({
  num: {
    type: Number,
    require: true,
    unique: true
  },
  name: {
    type: String,
    require: true
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  userIds: {
    type: Array,
    default: []
  },
  messages: {
    type: Array,
    default: []
  }
})
const Group = model('group', groupSchema)
module.exports = Group