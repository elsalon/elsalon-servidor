import express from 'express'
import payload from 'payload'

var cors = require('cors');
var corsOptions = {
  origin: '*',
  credentials: true
}

require('dotenv').config()
const app = express()
app.use(cors(corsOptions));

// Redirect root to Admin panel
app.get('/', (_, res) => {
  res.redirect('/admin')
})


const start = async () => {
  // Initialize Payload
  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    express: app,
    onInit: async () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`)
    },
  })

  // Add your own express routes here

  app.listen(4000)
}

start()
