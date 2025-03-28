import path from 'path'

import { payloadCloud } from '@payloadcms/plugin-cloud'
import { s3Adapter } from '@payloadcms/plugin-cloud-storage/s3'
import { cloudStorage } from '@payloadcms/plugin-cloud-storage'

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { webpackBundler } from '@payloadcms/bundler-webpack'
import { slateEditor } from '@payloadcms/richtext-slate'
import { buildConfig } from 'payload/config'
import { searchQuery } from './SearchQuery'
import { DesuscribirUsuario } from './GeneradorNotificacionesMail'

import Ajustes from './collections/Ajustes'

import Users from './collections/Users';
import Grupos from './collections/Grupos';
import Entradas from './collections/Entradas';
import Comentarios from './collections/Comentarios'
import Salas from './collections/Salas';
import Comisiones from './collections/Comisiones'
import Imagenes from './collections/Imagenes';
import Archivos from './collections/Archivos';
import Avatares from './collections/Avatares';
import Enlaces from './collections/Enlaces';
import Aprecio from './collections/Aprecio'
import Notificaciones from './collections/Notificaciones'
import Fijadas from './collections/Fijadas'
import Etiquetas from './collections/Etiquetas'
// import LinksExternos from './collections/LinksExternos'
// import Paginas from './collections/Paginas'
import Secciones from './collections/Secciones'
import MailQueue from './collections/MailQueue'

import Eventos from './collections/Eventos'

// DigitalOcean Spaces
const DOSpacesAdapter = s3Adapter({
  config: {
    endpoint: process.env.DO_SPACES_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.DO_SPACES_ACCESS_KEY_ID,
      secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY,
    },
    region: process.env.DO_SPACES_REGION,
  },
  bucket: process.env.DO_SPACES_BUCKET,
  acl: 'public-read',
});

const GenerateFileURL = ({ filename, prefix }) => {
  const fullUrl = process.env.DO_SPACES_CDN_URL
  return [fullUrl, prefix, filename].filter(Boolean).join('/')
}

export default buildConfig({
  debug: process.env.NODE_ENV === 'development',
  admin: {
    user: Users.slug,
    bundler: webpackBundler(),
  },
  // Desactivar rateLimit, por estar detras de un proxy toma todos los requests del mismo IP
  // https://payloadcms.com/docs/v2/production/preventing-abuse#rate-limiting-requests
  rateLimit:{
    trustProxy: true,
  },
  editor: slateEditor({}),
  globals: [
    Ajustes,
  ],
  collections: [
    Users,
    Grupos,
    Salas,
    Comisiones,
    Entradas,
    Comentarios,
    Enlaces,
    Aprecio,
    Imagenes,
    Archivos,
    Avatares,
    Notificaciones,
    Fijadas,
    Eventos,
    Etiquetas,
    // LinksExternos,
    Secciones,
    MailQueue,
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
  plugins: [
    cloudStorage({
      collections: {
        'imagenes': {
          adapter: DOSpacesAdapter,
          disableLocalStorage: true,
          prefix: 'media/imagenes',
          generateFileURL: ({ filename, prefix }) => GenerateFileURL({ filename, prefix })
        },
        'avatares': {
          adapter: DOSpacesAdapter,
          disableLocalStorage: true,
          prefix: 'media/avatares',
          generateFileURL: ({ filename, prefix }) => GenerateFileURL({ filename, prefix })
        },
        'archivos': {
          adapter: DOSpacesAdapter,
          disableLocalStorage: true,
          prefix: 'media/archivos',
          generateFileURL: ({ filename, prefix }) => GenerateFileURL({ filename, prefix })
        },
      }
    }),
    payloadCloud(),
  ],
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
  email: {
    transportOptions: process.env.SMTP_HOST ? {
      host: process.env.SMTP_HOST || 'smtp.mailersend.net',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    } : undefined,
    fromName: process.env.EMAIL_FROM_NAME || 'hello',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || 'hello@example.com',
    logMockCredentials: !process.env.SMTP_HOST, // Only log mock credentials if SMTP is not configured
  },
  endpoints: [
    {
      path: '/busqueda',
      method: 'get',
      handler: searchQuery,
    },
    {
      path: '/desuscribir',
      method: 'get',
      handler: DesuscribirUsuario,
    }
  ],
})

