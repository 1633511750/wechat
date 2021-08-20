const express = require('express')
const router = express.Router()
const UserRoute = require('./user')
const GroupRoute = require('./group')

router.get('/', (req, res) => {
  res.send('root')
})

router.use('/user', UserRoute)
router.use('/group', GroupRoute)

module.exports = app => {
  app.use(router)
}