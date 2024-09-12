import { CollectionConfig } from 'payload/types'
import { isAdminOrAutor } from '../helper'

const Entradas: CollectionConfig = {
    slug: 'entradas',
    access:{
        update: isAdminOrAutor,
        delete: isAdminOrAutor,
    },
    hooks: {
        beforeChange: [
            async ({ operation, data, req }) => {
                if(operation === 'create'){
                    // console.log('New entry created', data);
                    data.autor = req.user.id; // El autor es el usuario actual
                    return data;
                }
            }
        ]
    },
    fields: [
        {
            name: 'autoriaGrupal',
            type: 'checkbox',
        },
        // todo: grupo
        {
            name: 'autor',
            type: 'relationship',
            relationTo: 'users',
            hasMany: false,
        },
        {
            name: 'contenido',
            type: 'textarea',
        },
        {
            name: 'imagenes',
            type: 'array',
            fields: [
                {
                    name: 'imagen',
                    type: 'upload',
                    relationTo: 'imagenes',
                }
            ]
        },
        {
            name: 'archivos',
            type: 'array',
            fields: [
                {
                    name: 'archivo',
                    type: 'upload',
                    relationTo: 'archivos',
                }
            ]
        },
        {
            name: 'sala',
            type: 'relationship',
            relationTo: 'salones',
        }
    ],
}

export default Entradas