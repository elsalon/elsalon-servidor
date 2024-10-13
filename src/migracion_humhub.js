import payload from 'payload'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
})

const { PAYLOAD_SECRET } = process.env

const doAction = async () => {
  console.log("Comenzando migración de datos...")
  await payload.init({
    secret: PAYLOAD_SECRET,
    local: true, // Enables local mode, doesn't spin up a server or frontend
  })

  // Perform any Local API operations here
  const entradas = await payload.find({
    collection: 'entradas',
    limit: 5,
    // where: {} // optional
  })

  console.log("entradas", entradas)
  
}



doAction()