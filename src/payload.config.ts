import path from 'path'

import { payloadCloud } from '@payloadcms/plugin-cloud'
import { s3Adapter } from '@payloadcms/plugin-cloud-storage/s3'

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { webpackBundler } from '@payloadcms/bundler-webpack'
import { slateEditor } from '@payloadcms/richtext-slate'
import { buildConfig } from 'payload/config'
import { searchQuery } from './SearchQuery'

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
import { cloudStorage } from '@payloadcms/plugin-cloud-storage'

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
  const endpoint = process.env.DO_SPACES_ENDPOINT; // "https://nyc3.digitaloceanspaces.com"
  const bucket = process.env.DO_SPACES_BUCKET; // "elsalon-test"
  // Extract the region from the endpoint (in this case, "nyc3")
  const url = new URL(endpoint);
  const region = url.hostname.split('.')[0]; // Extract "nyc3"
  // Create the new URL
  const fullUrl = `https://${bucket}.${region}.digitaloceanspaces.com`;
  return [fullUrl, prefix, filename].filter(Boolean).join('/')
}

export default buildConfig({
  admin: {
    user: Users.slug,
    bundler: webpackBundler(),
  },
  editor: slateEditor({}),
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
  ],
  globals: [
    Ajustes,
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
    // transportOptions: {
    //   host: 'smtp.ethereal.email',
    //   port: 587,
    //   auth: {
    //       user: 'antone.streich@ethereal.email',
    //       pass: 'UspHx1s8AKvK1Fn8Jj'
    //   }
    // },
    fromName: 'hello',
    fromAddress: 'hello@example.com',
    logMockCredentials: true, // Optional
  },
  endpoints: [
    {
      path: '/busqueda',
      method: 'get',
      handler: searchQuery,
    },
  ]
})
