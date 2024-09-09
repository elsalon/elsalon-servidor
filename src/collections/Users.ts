import { CollectionConfig } from 'payload/types'
import { CollectionAfterMeHook } from 'payload/types';

const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
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
      name: 'nombre',
      type: 'text',
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'avatares',
    }
    // {
    //   name: 'grupos',
    //   type: 'relationship',
    //   relationTo: 'grupos',
    // }
  ],
}

export default Users
