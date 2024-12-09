// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'

import { s3Storage } from '@payloadcms/storage-s3'

// import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig, BasePayload } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import globals from './globals'

import Ajustes from './collections/Ajustes'

import Users from './collections/Users';
import Grupos from './collections/Grupos';
import Entradas from './collections/Entradas';
import Comentarios from './collections/Comentarios'
import Salones from './collections/Salones';
import Comisiones from './collections/Comisiones'
import Imagenes from './collections/Imagenes';
import Archivos from './collections/Archivos';
import Avatares from './collections/Avatares';
import Colaboraciones from './collections/Colaboraciones';
import Aprecio from './collections/Aprecio'
import Notificaciones from './collections/Notificaciones'
import Fijadas from './collections/Fijadas'
import Etiquetas from './collections/Etiquetas'
import MailQueue from './collections/MailQueue'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const GenerateFileURL = ( filename:string, prefix:string ) => {
  let fullUrl = process.env.DO_SPACES_CDN_URL || ""
  // Remove url trailing slash
  if (fullUrl.endsWith('/')) {
    fullUrl = fullUrl.substring(0, fullUrl.length - 1)
  }
  // console.log('Generating URL for', filename, prefix, fullUrl)
  return [fullUrl, prefix, filename].filter(Boolean).join('/')
}

const DOSpacesAdapter = s3Storage({
  enabled: true,
  collections: {
    imagenes: {
      disablePayloadAccessControl: true,
      prefix: 'media/imagenes',
      generateFileURL: ({ filename, prefix }) => GenerateFileURL( filename, prefix || "" )
    },
    archivos: {
      disablePayloadAccessControl: true,
      prefix: 'media/archivos',
      generateFileURL: ({ filename, prefix }) => GenerateFileURL( filename, prefix || "" )
    },
    avatares: {
      disablePayloadAccessControl: true,
      prefix: 'media/avatares',
      generateFileURL: ({ filename, prefix }) => GenerateFileURL( filename, prefix || "" )
    },
  },
  bucket: process.env.DO_SPACES_BUCKET || "",
  acl: 'public-read',
  config: {
    forcePathStyle: true,
    endpoint: process.env.DO_SPACES_ENDPOINT,
    credentials: {
      accessKeyId: process.env.DO_SPACES_ACCESS_KEY || "",
      secretAccessKey: process.env.DO_SPACES_SECRET_KEY || "",
    },
    region: process.env.DO_SPACES_REGION,
    // ... Other S3 configuration
  },
})

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Grupos,
    Salones,
    Comisiones,
    Entradas,
    Comentarios,
    Colaboraciones,
    Aprecio,
    Imagenes,
    Archivos,
    Avatares,
    Notificaciones,
    Fijadas,
    Etiquetas,
    MailQueue,
  ],
  globals: [
    Ajustes,
  ],
  // editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    DOSpacesAdapter,
  ],
  cors:['http://localhost:8080', 'http://localhost:3000'],
  csrf:['http://localhost:8080', 'http://localhost:3000'],
  
  onInit: async (payload) => {
    const elsalon = await LoadSalonPrincipal(payload)
    console.log('Salon Principal:', elsalon);
    globals.elSalonId = elsalon.id;
  }
})




const LoadSalonPrincipal = async (payload: BasePayload) => {
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