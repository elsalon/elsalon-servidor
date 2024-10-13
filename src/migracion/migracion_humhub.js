import payload from 'payload'
import path from 'path'
import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
})

const { PAYLOAD_SECRET } = process.env

const token = "XSKsjaD7cVqpPDTgwkWuUUzPMzp4ylmRHt0GgSUJEWrSgXQ-Oy8LnXipQfU7v_vLIxe-7QYzK5tJMH5XiPd2zr"
const fetchHumhub = axios.create({
  baseURL: 'https://elsalon.org/api/v1',
  timeout: 1000,
  headers: {'Authorization': `Bearer ${token}`}
});


const doAction = async () => {
  console.log("Comenzando migración de datos...")

  // const humhubUsuarios = await fetchHumhub('/user')
  // const usuarios = humhubUsuarios.data.results
  // console.log("usuarios", usuarios)
  /*
  id
  guid
  display_name
  url
  account
    id
    guid
    username
    email
    visibility
    status
    tags
    language
    time_zone
    contentcontainer_id
    authclient
    autclient_id
    last_login
  profile
    firstname
    lastname
    title
    gneder
    street
    url
    (etc)
  */

  const humhubEntradas = await fetchHumhub('/post')
  const entradas = humhubEntradas.data.results
  console.log("entradas", entradas)
  /*
  id,
  message // contenido en markdown
  content
    id
    metadata
      id
      guid
      object_model
      object_id
      visibility
      state
      archived
      hidden
      pinned
      locked_comments
      created_by
        id
        guid
        display_name
        url
      created_at
      updated_by
        id
        guid
        display_name
        url
      updated_at
      scheduled_at
      url
      contentcontainer_id ***
      stream_channel
    comments
      total
      latest
    likes
      total
    topics
    files
  */
  

    // SPACES
    /*
    id
    guid
    name
    url
    contentcontainer_id ***
    */



    // Comentarios
    // {{API_URL}}/comment/content/416453

    // 416453 -> id de la entrada (entrada.content.id)


  // await payload.init({
  //   secret: PAYLOAD_SECRET,
  //   local: true, // Enables local mode, doesn't spin up a server or frontend
  // })

  // // Perform any Local API operations here
  // const entradas = await payload.find({
  //   collection: 'entradas',
  //   limit: 5,
  //   // where: {} // optional
  // })

  // console.log("entradas", entradas)
  
}



doAction()