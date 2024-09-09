import { CollectionConfig } from 'payload/types'
import { SlugField } from '@nouance/payload-better-fields-plugin'

const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'nombre',
  },
  // anyone can create user. data is only accessible to the user who created it
  access: {
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
    afterMe: [
        ({response}) => {
        response["grupos"] = ['PAV1 Grupo2', 'PAV2 Grupo 5'] //TODO
        return response;
    }]
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
        {
          label: 'Admin',
          value: 'admin',
        },
      ],
      defaultValue: 'alumno',
      access:{
        update: ({ req }) => {
          if (req.user) {
            return req.user.rol === 'admin'
          }
          return false
        }
      }
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
    // {
    //   name: 'grupos',
    //   type: 'relationship',
    //   relationTo: 'grupos',
    // }
  ],
}

export default Users
