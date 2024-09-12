import { CollectionConfig } from 'payload/types'
import { isAdminOrAutor } from '../helper'

const Colaboraciones: CollectionConfig = {
    slug: 'colaboraciones',
    access:{
        update: isAdminOrAutor,
        delete: isAdminOrAutor,
    },
    fields: [
        {
            name: 'autor',
            type: 'relationship',
            relationTo: 'users',
        },
        {
            name: 'colaborador',
            type: 'relationship',
            relationTo: 'users',

        }
    ]
}

export default Colaboraciones
