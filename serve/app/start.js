const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, { cors: true });

const { port } = require('./config/config')

const mongo = require('./config/db')
mongo()

// const routes = require('./router')
// const bodyParser = require('body-parser')
// const cors = require('cors')

// 设置静态资源目录
app.use(express.static('public'))

// const config = require('./config/config')
// app.use(bodyParser.json())
// app.use(bodyParser.urlencoded({ extended: true }))
// app.use(cors())

// routes(app)

// 启动服务器
server.listen(port, function () {
  console.log('服务器启动在端口: %d', port);
});
// app.listen(config.appPort, () => {
//   console.log('服务器启动成功:3000');
// })
module.exports = { io }