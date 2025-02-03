import { CollectionConfig } from 'payload/types'
import { isAdminOrAutor,  } from '../helper'
import { NotificarNuevaColaboracion } from '../GeneradorNotificacionesWeb'

const Enlaces: CollectionConfig = {
    slug: 'enlaces',
    access:{
        update: isAdminOrAutor,
        delete: isAdminOrAutor,
    },
    admin: {
        group: 'Interacciones',
    },
    hooks: {
        afterChange: [NotificarNuevaColaboracion]
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
            options: ['bitacora', 'salon', 'grupo'], // Tipos de enlaces
        },
        {
            name: 'idEnlazado', // ID de quien colabora
            type: 'text',
        },
    ]
}

export default Enlaces
