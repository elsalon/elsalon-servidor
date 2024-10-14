import { CollectionConfig } from 'payload/types'
import { SlugField } from '@nouance/payload-better-fields-plugin'

const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    // 1 mes
    tokenExpiration: 1000 * 60 * 60 * 24 * 30,
    maxLoginAttempts: 7,
    lockTime: 1000 * 60, // 1 minute
  },
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
