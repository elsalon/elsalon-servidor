import { CollectionConfig } from 'payload/types'
import { isAdminOrAutor } from '../helper'

const Apreciaciones: CollectionConfig = {
    slug: 'apreciaciones',
    admin: {
        group: 'Interacciones',
    },
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
            name: 'entrada',
            type: 'relationship',
            relationTo: 'entradas',

        }
    ]
}

export default Apreciaciones
