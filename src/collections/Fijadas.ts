import { SlugField } from '@nouance/payload-better-fields-plugin'
import { CollectionConfig } from 'payload/types'
import { isAdminOrIntegrante } from '../helper'

const Fijadas: CollectionConfig = {
    slug: 'fijadas',
    admin: {
        group: 'Interacciones',
    },
    labels: {
        singular: 'Entrada Fijada',
        plural: 'Entradas Fijadas',
    },
    access: {
        // update: isAdminOrIntegrante,
        // delete: isAdminOrIntegrante,
    },
    hooks: {
        beforeChange: [
            async ({ operation, data, req }) => {
                if(operation === 'create'){
                    data.autor = req.user.id; // El autor es el usuario actual
                    return data;
                }
            },
            // TODO revisar que si se esta fijando/desfijando o destacando/desdestacando, se chequee que el usuario sea admin o docente
        ],
    },
    fields: [
        {
            name: 'autor',
            type: 'relationship',
            relationTo: 'users',
        },
        {
            name: 'contexto',
            type: 'text',
        },
        {
            name: 'entrada',
            type: 'relationship',
            relationTo: 'entradas',
        },
    ],
}

export default Fijadas;