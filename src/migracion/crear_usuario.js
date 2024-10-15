import payload from 'payload'
import path from 'path'
import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
})

const { PAYLOAD_SECRET } = process.env
const { HUMHUB_TOKEN } = process.env

const fetchHumhub = axios.create({
  baseURL: 'https://elsalon.org/api/v1',
  timeout: 1000,
  headers: {'Authorization': `Bearer ${HUMHUB_TOKEN}`}
});

const init = async () => {
    await payload.init({
        secret: PAYLOAD_SECRET,
        local: true, // Enables local mode, doesn't spin up a server or frontend
        onInit: doAction,
    })
}

const doAction = async () => {
    console.log("initialized")
    



  // Creo un usuario random
  
  try{
    const randomUsername= Math.random().toString(36).substring(7);
      const userData = {
          nombre: randomUsername,
          email: randomUsername+'@coso.com',
          password: 'gonzalom',
        }
        console.log("Creando usuario random", userData.email)

        const response = await payload.create({
            collection: 'users',
            data: userData,
            // Include the skipVerification flag
            req: {
              body: {
                skipVerification: true,
              },
            },
        });
    
        console.log(response)
    }catch(e){
        console.log(e)
    }
}

init();