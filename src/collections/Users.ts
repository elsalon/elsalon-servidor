import { CollectionConfig } from 'payload/types'
import { SlugField } from '@nouance/payload-better-fields-plugin'
import { simpleEmailTemplate } from '../emailTemplates'

const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    // 1 mes
    tokenExpiration: 1000 * 60 * 60 * 24 * 30,
    maxLoginAttempts: 7,
    lockTime: 1000 * 60, // 1 minute
    verify: {
      generateEmailSubject: ({ req, user }) => {
        return `Verificá tu cuenta de El Salón`;
      },
      generateEmailHTML: ({ req, token, user }) => {
        // Use the token provided to allow your user to verify their account
        const backendUrl = `${req.protocol}://${req.get('host')}`; // Dynamically obtain the backend URL
        const frontUrl = req.headers.origin;

        return simpleEmailTemplate({
          backendUrl: backendUrl,
          title: `Hola ${user.nombre}, verifica tu cuenta`,
          content: `<p>Para verificar tu cuenta de El Salón, clickeá en este link</p>
          <p><a target="_blank" href="${frontUrl}/verificar?t=${token}">Verificar cuenta</a></p>`
      });
      },
    },
    forgotPassword:{
      generateEmailSubject: ({ req, user }) => {
        return `Restablacé tu contraseña de El Salón`;
      },
      generateEmailHTML: ({ req, token, user }) => {
        const backendUrl = `${req.protocol}://${req.get('host')}`; // Dynamically obtain the backend URL
        const frontUrl = req.headers.origin;

        return simpleEmailTemplate({
            backendUrl: backendUrl,
            title: `Hola ${user.nombre}, restablacé tu contraseña`,
            content: `<p>Para restablecer tu contraseña de El Salón, clickeá en este link</p>
            <p><a target="_blank" href="${frontUrl}/recuperar?t=${token}">Restablecer contraseña</a></p>`
        });
      },
    }
  },
  admin: {
    useAsTitle: 'nombre',
  },
  // anyone can create user. data is only accessible to the user who created it
  access: {
    admin: ({ req }) => req.user && req.user.isAdmin,
    create: () => { return true },
    read: ({ req }) => {
      if (req.user) {
        return {
          user: req.user.id,
        }
      }
      return false
    },
    update: ({ req }) => {
      if (req.user) {
        return {
          user: req.user.id,
        }
      }
      return false
    },
    delete: ({ req }) => {
      return false
    },
  },

  hooks: {
  },

  fields: [
    // Email added by default
    // Add more fields as needed
    
    {
      name: 'rol',
      type: 'select',
      options: [
        {
          label: 'Alumno',
          value: 'alumno',
        },
        {
          label: 'Docente',
          value: 'docente',
        },
      ],
      defaultValue: 'alumno',
    },
    
    {
      name: 'nombre',
      type: 'text',
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'avatares',
    },
    {
      name: 'bio',
      type: 'textarea',
    },
    ...SlugField(
      {
        name: 'slug',
        admin: {
          position: 'sidebar',
        },
      },
      {
          appendOnDuplication : true,
          useFields: ['nombre'],
      },
    ),
    {
      name: 'isAdmin',
      type: 'checkbox',
      admin: {
        position: 'sidebar',
      },
      access:{
        update: ({ req }) => {
          if (req.user) {
            return req.user.isAdmin
          }
          return false
        }
      }
    },
    // {
    //   name: 'grupos',
    //   type: 'relationship',
    //   relationTo: 'grupos',
    //   hasMany: true,
    // }
  ],
}

export default Users
