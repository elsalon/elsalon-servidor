import express from 'express'
import payload from 'payload'
const path = require('path');
const globals = require('./globals');
import { NotificationService } from "./hooks/Notificaciones/NotificationService"
import { JobManager } from './Jobs/JobsManager'
const { initializeMailQueue, cleanupFailedEmails } = require('./MailQueueProcessor');

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
      const biblioteca = await LoadBiblioteca(payload);
      globals.bibliotecaId = biblioteca.id;
      payload.logger.info(`El Salon ID: ${globals.elSalonId}`);
      payload.logger.info(`Biblioteca ID: ${globals.bibliotecaId}`);
      globals.notificationService = new NotificationService();

      // Initialize mail queue
      const mailQueue = initializeMailQueue(payload);
      // Optional: Set up periodic cleanup of failed emails
      setInterval(() => {
        cleanupFailedEmails(payload);
      }, 1000 * 60 * 60); // Run every hour

      new JobManager();
    },
  })

  app.listen(process.env.PORT)
}

start()



const LoadSalonPrincipal = async (payload) => {
  const salon = await payload.find({
    collection: 'salas',
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
      collection: 'salas',
      data: {
        nombre: 'El Salón',
        slug: 'el-salon',
      }
    })
    return res;
  }
}

const LoadBiblioteca = async (payload) => {
  const sala = await payload.find({
    collection: 'salas',
    where: {
      slug: {
        equals: 'biblioteca'
      }
    }
  })
  if(sala.docs.length > 0){
    return sala.docs[0];
  }else{
    const res = await payload.create({
      collection: 'salas',
      data: {
        nombre: 'Biblioteca',
        slug: 'biblioteca',
      }
    })
    return res;
  }
}
