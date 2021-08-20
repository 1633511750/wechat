const mongoose = require('mongoose')
const mongoUrl = 'mongodb://localhost:27017/wechat'

module.exports = () => {
  mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false }, () => {
    console.log('mongodb connect');
  })
}