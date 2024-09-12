import path from 'path'

import { payloadCloud } from '@payloadcms/plugin-cloud'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { webpackBundler } from '@payloadcms/bundler-webpack'
import { slateEditor } from '@payloadcms/richtext-slate'
import { buildConfig } from 'payload/config'

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
})
