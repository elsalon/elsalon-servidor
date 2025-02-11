import { CollectionConfig } from 'payload/types'
import { isAdminOrAutor,  } from '../helper'
import { NotificarNuevoEnlace } from '../hooks/Notificaciones/NotificationsHooks'

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
        afterChange: [NotificarNuevoEnlace]
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
            name: 'idEnlazado', // ID del user, entrada, grupo o salon
            type: 'text',
            index: true,
        },
    ]
}

export default Enlaces
