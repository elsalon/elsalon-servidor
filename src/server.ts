import express from 'express'
import payload from 'payload'
const path = require('path');
const globals = require('./globals');
const { initializeMailQueue, cleanupFailedEmails } = require('./mailQueueProcessor');

var cors = require('cors');
var corsOptions = {
  origin: '*',
  credentials: true
}

require('dotenv').config()
const app = express()
app.use(cors(corsOptions));

app.use(express.json({limit: '100mb'}));
app.use(express.urlencoded({limit: '100mb', extended: true, parameterLimit: 50000}));

// Redirect root to Admin panel
app.get('/', (_, res) => {
  res.redirect('/admin')
})

app.use('/public', express.static(path.join(__dirname, 'public')));


const start = async () => {
  // Initialize Payload
  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    express: app,
    onInit: async () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`)
      const elsalon = await LoadSalonPrincipal(payload);
      globals.elSalonId = elsalon.id;

      // Initialize mail queue
      const mailQueue = initializeMailQueue(payload);
      // Optional: Set up periodic cleanup of failed emails
      setInterval(() => {
        cleanupFailedEmails(payload);
      }, 1000 * 60 * 60); // Run every hour
    },
  })

  // Add your own express routes here

  app.listen(process.env.PORT)
}

start()



const LoadSalonPrincipal = async (payload) => {
  const salon = await payload.find({
    collection: 'salones',
    where:{
      slug: {
        equals: 'el-salon'
      }
    }
  })
  if(salon.docs.length > 0){
    return salon.docs[0];
  }else{
    const res = await payload.create({
      collection: 'salones',
      data: {
        nombre: 'El Salón',
        slug: 'el-salon',
      }
    })
    return res;
  }
}
