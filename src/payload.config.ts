// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'

import { s3Storage } from '@payloadcms/storage-s3'

// import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'


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
// import { cloudStorage } from '@payloadcms/plugin-cloud-storage'
import MailQueue from './collections/MailQueue'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const GenerateFileURL = ( filename:string, prefix:string ) => {
  const fullUrl = process.env.DO_SPACES_CDN_URL
  console.log('Generating URL for', filename, prefix, fullUrl)
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
    archivos: true,
    avatares: true,
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
    // storage-adapter-placeholder
  ],
})
