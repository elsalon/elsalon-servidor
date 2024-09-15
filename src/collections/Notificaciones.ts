import { CollectionConfig } from 'payload/types'
import { isAutor, isAdmin, isAdminOrAutor } from '../helper'

const Notificaciones: CollectionConfig = {
    slug: 'notificaciones',
    admin: {
        group: 'Interacciones',
    },
    access:{
        read: isAutor,
        create: isAdmin,
        update: isAdmin,
        delete: isAdminOrAutor,
    },
    hooks: {
    },
    fields: [
        {
            name: 'autor',
            type: 'relationship',
            relationTo: 'users',
        },
        {
            name: 'tipoNotificacion',
            type: 'select',
            options: ['apreciacion', 'comentario', 'mencion', 'respuesta', 'colaboracion'],
        },
        {
            name: 'mensaje',
            type: 'text',
        },
        {
            name: 'leida',
            type: 'checkbox',
        }
    ],
}

export default Notificaciones
