import { CollectionConfig } from 'payload/types'
import { isAutor, isAdminOrAutor, afterCreateAssignAutorToUser } from '../helper'

const Guardado: CollectionConfig = {
  slug: 'guardado',
  admin: {
    group: 'Interacciones',
  },
  access: {
    read: isAutor,
    update: isAdminOrAutor,
    delete: isAdminOrAutor,
  },
  hooks: {
    beforeChange: [afterCreateAssignAutorToUser],
  },
  fields: [
    {
      name: 'autor',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'contenidoid',
      type: 'text',
      index: true,
    },
    {
      name: 'contenidotipo',
      type: 'text',
    }
  ],
}

export default Guardado