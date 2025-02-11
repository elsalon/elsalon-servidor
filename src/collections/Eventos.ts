import { CollectionConfig } from 'payload/types'
import { isAdminOrDocente } from '../helper'
import { NotificarEvento} from '../hooks/Notificaciones/NotificationsHooks'

const Eventos: CollectionConfig = {
    slug: 'eventos',
    admin: {
        useAsTitle: 'titulo',
        group: 'Interacciones',
    },
    access: {
        create: isAdminOrDocente,
        update: isAdminOrDocente,
        delete: isAdminOrDocente,
    },
    hooks: {
        beforeChange: [],
        afterChange:[
            NotificarEvento
        ],
    },
    fields: [
        {
            name: 'titulo',
            type: 'text',
        },
        {
            name: 'descripcion',
            type: 'textarea',
        },
        {
            name: 'fecha',
            type: 'date',
            admin: {
                date: {
                  pickerAppearance: 'dayAndTime',
                },
              },
        },
        {
            name: 'sala',
            type: 'relationship',
            relationTo: 'salones',
        },
        {
            name: 'autor',
            type: 'relationship',
            relationTo: 'users',
        }
    ],
    endpoints: []
}

export default Eventos;