import path from 'path'

import { payloadCloud } from '@payloadcms/plugin-cloud'
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
import Imagenes from './collections/Imagenes';
import Archivos from './collections/Archivos';
import Avatares from './collections/Avatares';
import Colaboraciones from './collections/Colaboraciones';
import Apreciaciones from './collections/Apreciaciones'
import Notificaciones from './collections/Notificaciones'
import Fijadas from './collections/Fijadas'
import Etiquetas from './collections/Etiquetas'

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
    Entradas,
    Comentarios,
    Colaboraciones,
    Apreciaciones,
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
  plugins: [payloadCloud()],
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
