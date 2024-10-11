import { CollectionConfig } from 'payload/types'
import { isAdminOrAutor, AddNotificationColaboracion } from '../helper'

const Colaboraciones: CollectionConfig = {
    slug: 'colaboraciones',
    access:{
        update: isAdminOrAutor,
        delete: isAdminOrAutor,
    },
    admin: {
        group: 'Interacciones',
    },
    hooks: {
        afterChange: [AddNotificationColaboracion]
    },
    fields: [
        {
            name: 'autor',
            type: 'relationship',
            relationTo: 'users',
        },
        {
            name: 'tipo',
            type: 'select',
            options: ['bitacora', 'salon', 'grupo'], // Tipos de colaboraciones
        },
        {
            name: 'idColaborador', // ID de quien colabora
            type: 'text',
        },
        // {
        //     name: 'colaborador',
        //     type: 'relationship',
        //     relationTo: 'users',
        // },
        // {
        //     name: 'salon',
        //     type: 'relationship',
        //     relationTo: 'salones',
        // }
    ]
}

export default Colaboraciones
